-- ============================================================================
-- 0004 · Clientes, pedidos, pagos e historial
--
-- Regla que gobierna todo este archivo: el importe nunca se confía al cliente.
-- El navegador manda qué producto y cuántas unidades; el servidor busca el
-- precio vigente del producto activo y recalcula subtotal y total.
-- ============================================================================

create type public.order_status as enum (
  'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'
);

create type public.payment_status as enum (
  'pending', 'approved', 'rejected', 'cancelled', 'refunded'
);

create type public.payment_method as enum ('mercado_pago', 'whatsapp', 'cash');

-- ── Clientes ───────────────────────────────────────────────────────────────
-- Sin login en esta fase: el checkout es como invitado. El teléfono
-- normalizado (sólo dígitos, con código de país) es la clave natural.
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  internal_notes text not null default '',
  first_order_at timestamptz,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_phone_normalized check (phone ~ '^[0-9]{6,20}$'),
  constraint customers_email_shape check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- Evita el duplicado evidente: mismo teléfono, mismo cliente.
create unique index customers_phone_key on public.customers (phone);
create index customers_name_idx on public.customers using gin (to_tsvector('simple', name));

create trigger customers_touch
  before update on public.customers
  for each row execute function public.touch_updated_at();

-- ── Pedidos ────────────────────────────────────────────────────────────────
create sequence public.order_number_seq start 1000;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Número legible que ve el comprador: CA-1000, CA-1001…
  order_number text not null unique,
  customer_id uuid not null references public.customers (id) on delete restrict,

  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  payment_method public.payment_method,

  -- Importes en centésimos, calculados por el servidor.
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  currency text not null default 'UYU' check (currency = 'UYU'),

  requested_date date,
  requested_slot text,
  fulfillment public.fulfillment_mode not null default 'pickup',
  address text,

  customer_comments text not null default '',
  internal_notes text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,

  -- Una entrega a domicilio necesita dirección.
  constraint orders_delivery_needs_address
    check (fulfillment <> 'delivery' or (address is not null and length(btrim(address)) > 0))
);

create index orders_status_idx on public.orders (status, created_at desc);
create index orders_payment_idx on public.orders (payment_status, created_at desc);
create index orders_customer_idx on public.orders (customer_id, created_at desc);
create index orders_created_idx on public.orders (created_at desc);

create trigger orders_touch
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ── Líneas del pedido ──────────────────────────────────────────────────────
-- Guardan un snapshot: si mañana cambia el precio o el nombre del producto,
-- el pedido histórico sigue diciendo lo que se compró y a cuánto.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete restrict,
  product_name text not null,
  product_slug text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  sale_mode public.sale_mode not null,
  options jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

-- Ahora que existe `order_items`, el guardia de borrado de productos ya puede
-- instalarse (la función se definió en la migración del catálogo).
create trigger products_no_delete_if_sold
  before delete on public.products
  for each row execute function public.prevent_delete_sold_product();

-- ── Historial de estados ───────────────────────────────────────────────────
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  note text not null default '',
  changed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index order_status_history_order_idx
  on public.order_status_history (order_id, created_at desc);

-- Todo cambio de estado deja rastro, venga de donde venga.
create or replace function public.log_order_status_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, from_status, to_status, note)
    values (new.id, null, new.status, 'Pedido creado');
  elsif new.status is distinct from old.status then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger orders_log_status
  after insert or update of status on public.orders
  for each row execute function public.log_order_status_change();

-- ── Pagos ──────────────────────────────────────────────────────────────────
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  method public.payment_method not null,
  status public.payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'UYU' check (currency = 'UYU'),
  -- Identificadores del proveedor.
  provider_preference_id text,
  provider_payment_id text,
  -- Última respuesta del proveedor, sin secretos.
  provider_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id);
create unique index payments_provider_payment_key
  on public.payments (provider_payment_id)
  where provider_payment_id is not null;

create trigger payments_touch
  before update on public.payments
  for each row execute function public.touch_updated_at();

-- ── Eventos de webhook ─────────────────────────────────────────────────────
-- La clave única es la que da idempotencia: Mercado Pago reintenta la misma
-- notificación varias veces y no puede provocar efectos repetidos.
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'mercado_pago',
  event_key text not null,
  event_type text,
  payload jsonb,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  unique (provider, event_key)
);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;

-- Sin políticas para anon/authenticated-no-admin: nadie de fuera lee clientes,
-- pedidos, notas ni pagos. La creación pública pasa por la función de más
-- abajo, no por un INSERT directo.
create policy customers_admin_all on public.customers
  for all to authenticated
  using (public.is_active_admin()) with check (public.is_active_admin());

create policy orders_admin_all on public.orders
  for all to authenticated
  using (public.is_active_admin()) with check (public.is_active_admin());

create policy order_items_admin_all on public.order_items
  for all to authenticated
  using (public.is_active_admin()) with check (public.is_active_admin());

create policy order_status_history_admin_read on public.order_status_history
  for select to authenticated using (public.is_active_admin());
create policy order_status_history_admin_insert on public.order_status_history
  for insert to authenticated with check (public.is_active_admin());

-- Los pagos se leen desde el panel, pero NADIE los escribe desde el navegador:
-- no hay policy de INSERT/UPDATE para `authenticated`. Sólo los toca el
-- webhook, que corre en el servidor con la clave de servicio.
create policy payments_admin_read on public.payments
  for select to authenticated using (public.is_active_admin());

-- `payment_events` es puramente técnico: ni siquiera el panel lo lee.
