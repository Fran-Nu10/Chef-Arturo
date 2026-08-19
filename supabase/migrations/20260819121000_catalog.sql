-- ============================================================================
-- 0002 · Catálogo: medios, categorías, productos e imágenes de producto
--
-- Los importes se guardan en centésimos enteros (`price_cents`). Nunca en
-- coma flotante: 0.1 + 0.2 no da 0.3 y un e-commerce no puede permitírselo.
-- ============================================================================

create type public.product_status as enum ('draft', 'active', 'archived');
create type public.sale_mode as enum ('direct', 'preorder', 'quote');
create type public.fulfillment_mode as enum ('pickup', 'delivery', 'both');

-- ── Medios ─────────────────────────────────────────────────────────────────
-- Todo archivo vive en Supabase Storage. Si se importa una imagen autorizada
-- de un banco externo se copia al bucket y se guarda su procedencia: no se
-- deja un hotlink permanente contra un dominio de terceros.
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null,
  alt text not null default '',
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  mime_type text not null,
  bytes integer check (bytes is null or bytes >= 0),
  -- Procedencia: 'own' para material propio, o el proveedor del stock.
  source text not null default 'own',
  source_url text,
  credit text,
  license text,
  -- Material temporal de demo, reemplazable desde el panel.
  is_temporary boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, path)
);

create trigger media_assets_touch
  before update on public.media_assets
  for each row execute function public.touch_updated_at();

-- ── Categorías ─────────────────────────────────────────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  position integer not null default 0,
  is_active boolean not null default true,
  image_id uuid references public.media_assets (id) on delete set null,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index categories_active_idx on public.categories (is_active, position);

create trigger categories_touch
  before update on public.categories
  for each row execute function public.touch_updated_at();

-- ── Productos ──────────────────────────────────────────────────────────────
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category_id uuid references public.categories (id) on delete restrict,
  short_description text not null default '',
  full_description text not null default '',

  -- Precio en centésimos. Puede ser null cuando la modalidad es 'quote':
  -- ese producto se cotiza y la UI muestra "Precio pendiente".
  price_cents integer check (price_cents is null or price_cents >= 0),
  currency text not null default 'UYU' check (currency = 'UYU'),

  status public.product_status not null default 'draft',
  sale_mode public.sale_mode not null default 'direct',
  is_featured boolean not null default false,
  position integer not null default 0,

  -- Stock opcional: si `track_stock` es false, `stock_quantity` se ignora.
  track_stock boolean not null default false,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 0 check (low_stock_threshold >= 0),

  lead_time_days integer not null default 0 check (lead_time_days >= 0),
  min_quantity integer not null default 1 check (min_quantity >= 1),
  fulfillment public.fulfillment_mode not null default 'both',

  seo_title text,
  seo_description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,

  constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Un producto de compra directa necesita precio para poder cobrarse.
  constraint products_direct_needs_price
    check (sale_mode <> 'direct' or price_cents is not null)
);

create index products_status_idx on public.products (status, position);
create index products_category_idx on public.products (category_id);
create index products_featured_idx on public.products (is_featured) where status = 'active';

create trigger products_touch
  before update on public.products
  for each row execute function public.touch_updated_at();

-- Un producto que ya apareció en un pedido no se borra: se archiva. La regla
-- se aplica en la base y no sólo en la aplicación, para que también valga si
-- alguien opera con la clave de servicio o desde el SQL editor.
create or replace function public.prevent_delete_sold_product()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if exists (select 1 from public.order_items oi where oi.product_id = old.id) then
    raise exception
      'El producto % ya aparece en un pedido: archivalo en lugar de borrarlo.', old.id
      using errcode = 'restrict_violation';
  end if;
  return old;
end;
$$;

-- ── Imágenes de producto ───────────────────────────────────────────────────
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  media_id uuid not null references public.media_assets (id) on delete restrict,
  alt text not null default '',
  position integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, media_id)
);

create index product_images_product_idx on public.product_images (product_id, position);

-- Una sola imagen principal por producto.
create unique index product_images_one_primary
  on public.product_images (product_id)
  where is_primary;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.media_assets enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

-- Público: sólo lo publicado.
create policy categories_public_read on public.categories
  for select to anon, authenticated
  using (is_active);

create policy products_public_read on public.products
  for select to anon, authenticated
  using (status = 'active');

create policy product_images_public_read on public.product_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.status = 'active'
    )
  );

create policy media_public_read on public.media_assets
  for select to anon, authenticated
  using (bucket = 'media');

-- Administradores activos: lectura completa y escritura.
create policy categories_admin_read on public.categories
  for select to authenticated using (public.is_active_admin());
create policy categories_admin_write on public.categories
  for all to authenticated
  using (public.is_active_admin()) with check (public.is_active_admin());

create policy products_admin_read on public.products
  for select to authenticated using (public.is_active_admin());
create policy products_admin_write on public.products
  for all to authenticated
  using (public.is_active_admin()) with check (public.is_active_admin());

create policy product_images_admin_write on public.product_images
  for all to authenticated
  using (public.is_active_admin()) with check (public.is_active_admin());

create policy media_admin_write on public.media_assets
  for all to authenticated
  using (public.is_active_admin()) with check (public.is_active_admin());
