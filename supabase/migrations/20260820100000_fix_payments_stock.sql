-- ============================================================================
-- 0007 · Correcciones de la auditoría: upsert de pagos y reposición de stock
--
-- Migración hacia adelante. No reescribe las anteriores: sirve tanto sobre una
-- base ya migrada como desde cero.
-- ============================================================================

-- ── 1 · Índice único de pagos ───────────────────────────────────────────────
--
-- El índice anterior era PARCIAL (`where provider_payment_id is not null`).
-- Postgres no puede inferir un índice parcial en `on conflict (columna)` si la
-- sentencia no repite el predicado, y PostgREST no lo repite: el webhook
-- fallaba con 42P10 en cada notificación.
--
-- No hace falta que sea parcial: en Postgres los NULL son distintos entre sí,
-- así que un único normal ya permite muchas filas sin `provider_payment_id`.

drop index if exists public.payments_provider_payment_key;

alter table public.payments
  add constraint payments_provider_payment_key unique (provider_payment_id);

comment on constraint payments_provider_payment_key on public.payments is
  'Restricción, no índice parcial: `on conflict (provider_payment_id)` necesita poder inferirla.';

-- Una preferencia por pedido: evita duplicar la fila pendiente si el comprador
-- reintenta el checkout.
create unique index if not exists payments_preference_key
  on public.payments (provider_preference_id)
  where provider_preference_id is not null;

-- ── 2 · Reposición de stock al cancelar ─────────────────────────────────────
--
-- `create_public_order` descuenta stock al crear el pedido, para que dos
-- compradores no se lleven la misma última unidad. La contrapartida es que
-- cancelar tiene que devolverlo, o el stock se degrada con cada cancelación.
--
-- Vive en un trigger y no en la acción del panel para que valga por cualquier
-- camino: panel, webhook o SQL manual. La marca evita reponer dos veces si un
-- operador saca el pedido de cancelado y vuelve a cancelarlo.

alter table public.orders
  add column if not exists stock_restored_at timestamptz;

comment on column public.orders.stock_restored_at is
  'Cuándo se devolvió el stock de este pedido. Impide reponerlo dos veces.';

create or replace function public.restore_stock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Sólo en la transición hacia cancelado, y sólo una vez.
  if new.status <> 'cancelled' or old.status = 'cancelled' then
    return new;
  end if;
  if new.stock_restored_at is not null then
    return new;
  end if;

  update public.products p
  set stock_quantity = p.stock_quantity + i.cantidad
  from (
    select product_id, sum(quantity)::integer as cantidad
    from public.order_items
    where order_id = new.id and product_id is not null
    group by product_id
  ) i
  where p.id = i.product_id and p.track_stock;

  new.stock_restored_at := now();
  return new;
end;
$$;

comment on function public.restore_stock_on_cancel() is
  'SECURITY DEFINER: escribe en `products`, que el operador del panel no puede tocar desde esta ruta. No recibe parámetros del cliente.';

revoke all on function public.restore_stock_on_cancel() from public;

drop trigger if exists orders_restore_stock on public.orders;
create trigger orders_restore_stock
  before update of status on public.orders
  for each row execute function public.restore_stock_on_cancel();

-- ── 3 · Buckets con sus límites aplicados ───────────────────────────────────
--
-- Antes era `on conflict do nothing`: si el bucket ya existía —creado a mano
-- desde el panel de Supabase, por ejemplo— el límite de tamaño y la lista de
-- MIME permitidos NO se aplicaban, y quedaba aceptando cualquier archivo.

do $$
begin
  update storage.buckets
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4']
  where id = 'media';

  update storage.buckets
  set public = false,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf']
  where id = 'private';
exception
  when insufficient_privilege then
    raise warning 'Sin permiso para ajustar storage.buckets: aplicá los límites desde el panel de Supabase.';
end $$;
