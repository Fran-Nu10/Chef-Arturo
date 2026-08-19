-- ============================================================================
-- Pruebas de Row Level Security
--
-- Cubren los cuatro sujetos: anónimo, autenticado sin permisos, staff y owner.
-- Cada bloque cambia de rol y de claims igual que lo hace PostgREST, así que
-- lo que se mide son las políticas reales, no una simulación.
--
--   psql -d chef_arturo_test -f supabase/tests/01_rls.sql
--
-- Falla ruidosamente: cualquier expectativa incumplida aborta con excepción.
-- ============================================================================

\set ON_ERROR_STOP on
\pset pager off

create extension if not exists "pgcrypto";

-- ── Utilidades ─────────────────────────────────────────────────────────────
create or replace function pg_temp.esperar(
  descripcion text, obtenido anyelement, esperado anyelement
) returns void language plpgsql as $$
begin
  if obtenido is distinct from esperado then
    raise exception 'FALLA · % — esperado %, obtenido %', descripcion, esperado, obtenido;
  end if;
  raise notice 'ok · %', descripcion;
end;
$$;

create or replace function pg_temp.debe_fallar(descripcion text, sentencia text)
returns void language plpgsql as $$
begin
  begin
    execute sentencia;
  exception when others then
    raise notice 'ok · % (rechazado: %)', descripcion, sqlerrm;
    return;
  end;
  raise exception 'FALLA · % — la sentencia se permitió y debía rechazarse', descripcion;
end;
$$;

-- Con RLS, un UPDATE o un DELETE sin política aplicable no lanza error: la
-- cláusula USING no encuentra ninguna fila y la sentencia afecta cero. Esa es
-- la garantía que hay que medir; exigir una excepción daría un falso negativo.
create or replace function pg_temp.debe_no_afectar(descripcion text, sentencia text)
returns void language plpgsql as $$
declare
  n integer;
begin
  begin
    execute sentencia;
    get diagnostics n = row_count;
  exception when others then
    raise notice 'ok · % (rechazado: %)', descripcion, sqlerrm;
    return;
  end;
  if n <> 0 then
    raise exception 'FALLA · % — se modificaron % filas', descripcion, n;
  end if;
  raise notice 'ok · % (0 filas alcanzadas)', descripcion;
end;
$$;

create or replace function pg_temp.como_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
end;
$$;

create or replace function pg_temp.como_usuario(uid uuid) returns void language plpgsql as $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
end;
$$;

create or replace function pg_temp.como_servicio() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  execute 'set local role postgres';
end;
$$;

-- ── Datos de prueba ────────────────────────────────────────────────────────
-- El bloque es idempotente: limpia lo suyo antes de sembrar, así el archivo
-- puede ejecutarse dos veces seguidas sobre la misma base.
begin;

delete from public.payment_events;
delete from public.order_status_history;
delete from public.order_items;
delete from public.payments;
delete from public.orders;
delete from public.customers;
delete from public.product_images;
delete from public.products;
delete from public.categories;
delete from public.media_assets;
delete from public.site_settings;
delete from public.admin_users;
delete from auth.users;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@ejemplo.test'),
  ('00000000-0000-0000-0000-0000000000a2', 'staff@ejemplo.test'),
  ('00000000-0000-0000-0000-0000000000a3', 'inactivo@ejemplo.test'),
  ('00000000-0000-0000-0000-0000000000a4', 'cualquiera@ejemplo.test');

insert into public.admin_users (id, role, is_active) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner', true),
  ('00000000-0000-0000-0000-0000000000a2', 'staff', true),
  ('00000000-0000-0000-0000-0000000000a3', 'staff', false);

insert into public.categories (id, slug, name, is_active) values
  ('00000000-0000-0000-0000-0000000000c1', 'pasteleria', 'Pastelería', true),
  ('00000000-0000-0000-0000-0000000000c2', 'oculta', 'Categoría oculta', false);

insert into public.products (id, slug, name, category_id, price_cents, status, sale_mode, track_stock, stock_quantity)
values
  ('00000000-0000-0000-0000-0000000000b1', 'producto-activo', 'Producto activo',
   '00000000-0000-0000-0000-0000000000c1', 45000, 'active', 'direct', true, 10),
  ('00000000-0000-0000-0000-0000000000b2', 'producto-borrador', 'Producto borrador',
   '00000000-0000-0000-0000-0000000000c1', 30000, 'draft', 'direct', false, 0);

insert into public.customers (id, name, phone) values
  ('00000000-0000-0000-0000-0000000000d1', 'Cliente de prueba', '59899123456');

insert into public.orders (id, order_number, customer_id, total_cents, subtotal_cents)
values ('00000000-0000-0000-0000-0000000000e1', 'CA-TEST', '00000000-0000-0000-0000-0000000000d1', 45000, 45000);

insert into public.payments (order_id, method, status, amount_cents)
values ('00000000-0000-0000-0000-0000000000e1', 'mercado_pago', 'pending', 45000);

update public.site_sections
set published = '{"titulo":"Hola"}'::jsonb, is_enabled = true
where key = 'hero';

commit;

-- ══════════════════════════════════════════════════════════════════════════
-- 1 · Visitante anónimo
-- ══════════════════════════════════════════════════════════════════════════
begin;
select pg_temp.como_anon();

select pg_temp.esperar('anon ve sólo productos activos',
  (select count(*)::int from public.products), 1);

select pg_temp.esperar('anon ve sólo categorías activas',
  (select count(*)::int from public.categories), 1);

select pg_temp.esperar('anon NO ve clientes',
  (select count(*)::int from public.customers), 0);

select pg_temp.esperar('anon NO ve pedidos',
  (select count(*)::int from public.orders), 0);

select pg_temp.esperar('anon NO ve pagos',
  (select count(*)::int from public.payments), 0);

select pg_temp.esperar('anon NO ve administradores',
  (select count(*)::int from public.admin_users), 0);

select pg_temp.esperar('anon ve sólo secciones publicadas',
  (select count(*)::int from public.site_sections), 1);

select pg_temp.debe_fallar('anon no puede crear productos',
  $$insert into public.products (slug, name, price_cents, status)
    values ('hackeado', 'Hackeado', 1, 'active')$$);

select pg_temp.debe_fallar('anon no puede insertar un pedido a mano',
  $$insert into public.orders (order_number, customer_id, total_cents)
    values ('CA-FALSO', '00000000-0000-0000-0000-0000000000d1', 0)$$);

select pg_temp.debe_no_afectar('anon no puede marcar un pago como aprobado',
  $$update public.payments set status = 'approved'$$);

select pg_temp.debe_no_afectar('anon no puede cambiar el total de un pedido',
  $$update public.orders set total_cents = 1$$);

select pg_temp.debe_fallar('anon no puede darse de alta como administrador',
  $$insert into public.admin_users (id, role, is_active)
    values ('00000000-0000-0000-0000-0000000000a4', 'owner', true)$$);
rollback;

-- ══════════════════════════════════════════════════════════════════════════
-- 2 · Usuario autenticado sin permisos
-- ══════════════════════════════════════════════════════════════════════════
begin;
select pg_temp.como_usuario('00000000-0000-0000-0000-0000000000a4');

select pg_temp.esperar('autenticado sin rol no es admin',
  public.is_active_admin(), false);

select pg_temp.esperar('autenticado sin rol NO ve pedidos',
  (select count(*)::int from public.orders), 0);

select pg_temp.esperar('autenticado sin rol NO ve clientes',
  (select count(*)::int from public.customers), 0);

select pg_temp.esperar('autenticado sin rol ve el catálogo público',
  (select count(*)::int from public.products), 1);

select pg_temp.debe_fallar('autenticado sin rol no puede crear productos',
  $$insert into public.products (slug, name, price_cents, status)
    values ('otro-hackeo', 'Otro', 1, 'active')$$);

select pg_temp.debe_fallar('autenticado sin rol no puede auto-promoverse',
  $$insert into public.admin_users (id, role, is_active)
    values ('00000000-0000-0000-0000-0000000000a4', 'owner', true)$$);
rollback;

-- ══════════════════════════════════════════════════════════════════════════
-- 3 · Administrador inactivo
-- ══════════════════════════════════════════════════════════════════════════
begin;
select pg_temp.como_usuario('00000000-0000-0000-0000-0000000000a3');

select pg_temp.esperar('un admin inactivo no cuenta como admin',
  public.is_active_admin(), false);

select pg_temp.esperar('admin inactivo NO ve pedidos',
  (select count(*)::int from public.orders), 0);
rollback;

-- ══════════════════════════════════════════════════════════════════════════
-- 4 · Staff
-- ══════════════════════════════════════════════════════════════════════════
begin;
select pg_temp.como_usuario('00000000-0000-0000-0000-0000000000a2');

select pg_temp.esperar('staff es admin activo', public.is_active_admin(), true);
select pg_temp.esperar('staff no es owner', public.is_owner(), false);

select pg_temp.esperar('staff ve todos los productos',
  (select count(*)::int from public.products), 2);

select pg_temp.esperar('staff ve pedidos',
  (select count(*)::int from public.orders), 1);

select pg_temp.esperar('staff ve clientes',
  (select count(*)::int from public.customers), 1);

select pg_temp.esperar('staff ve pagos',
  (select count(*)::int from public.payments), 1);

insert into public.products (slug, name, price_cents, status, sale_mode)
values ('creado-por-staff', 'Creado por staff', 10000, 'draft', 'direct');
select pg_temp.esperar('staff puede crear productos',
  (select count(*)::int from public.products where slug = 'creado-por-staff'), 1);

select pg_temp.debe_fallar('staff NO puede tocar la configuración del sitio',
  $$insert into public.site_settings (key, value) values ('whatsapp', '{}'::jsonb)$$);

select pg_temp.debe_fallar('staff NO puede crear administradores',
  $$insert into public.admin_users (id, role, is_active)
    values ('00000000-0000-0000-0000-0000000000a4', 'staff', true)$$);

select pg_temp.debe_no_afectar('nadie aprueba un pago desde el navegador, ni staff',
  $$update public.payments set status = 'approved'$$);
rollback;

-- ══════════════════════════════════════════════════════════════════════════
-- 5 · Owner
-- ══════════════════════════════════════════════════════════════════════════
begin;
select pg_temp.como_usuario('00000000-0000-0000-0000-0000000000a1');

select pg_temp.esperar('owner es admin activo', public.is_active_admin(), true);
select pg_temp.esperar('owner es owner', public.is_owner(), true);

insert into public.site_settings (key, value) values ('whatsapp', '{"numero":"pendiente"}'::jsonb);
select pg_temp.esperar('owner puede escribir la configuración',
  (select count(*)::int from public.site_settings where key = 'whatsapp'), 1);

insert into public.admin_users (id, role, is_active)
values ('00000000-0000-0000-0000-0000000000a4', 'staff', true);
select pg_temp.esperar('owner puede dar de alta administradores',
  (select count(*)::int from public.admin_users), 4);

select pg_temp.debe_no_afectar('tampoco el owner aprueba pagos desde el navegador',
  $$update public.payments set status = 'approved'$$);
rollback;

-- ══════════════════════════════════════════════════════════════════════════
-- 6 · Creación pública de pedidos
-- ══════════════════════════════════════════════════════════════════════════
begin;
select pg_temp.como_anon();

-- El caso feliz: anon crea un pedido a través de la función.
create temporary table t_pedido on commit drop as
select * from public.create_public_order(
  'Comprador de prueba', '099 111 222', null, 'pickup'::public.fulfillment_mode,
  null, current_date + 3, 'mañana', 'sin observaciones',
  'whatsapp'::public.payment_method,
  '[{"product_id":"00000000-0000-0000-0000-0000000000b1","quantity":2}]'::jsonb
);

select pg_temp.esperar('el pedido público se creó',
  (select count(*)::int from t_pedido), 1);

-- 2 unidades × 45000 = 90000. Lo calculó el servidor.
select pg_temp.esperar('el total lo calcula el servidor',
  (select total_cents from t_pedido), 90000);

select pg_temp.debe_fallar('anon no puede crear un pedido con un producto en borrador',
  $$select public.create_public_order(
      'X', '099111333', null, 'pickup'::public.fulfillment_mode, null, null, null, '',
      'whatsapp'::public.payment_method,
      '[{"product_id":"00000000-0000-0000-0000-0000000000b2","quantity":1}]'::jsonb)$$);

select pg_temp.debe_fallar('anon no puede pedir más de lo que hay en stock',
  $$select public.create_public_order(
      'X', '099111444', null, 'pickup'::public.fulfillment_mode, null, null, null, '',
      'whatsapp'::public.payment_method,
      '[{"product_id":"00000000-0000-0000-0000-0000000000b1","quantity":999}]'::jsonb)$$);

select pg_temp.debe_fallar('anon no puede declarar el pago ya aprobado',
  $$select public.create_public_order(
      'X', '099111555', null, 'pickup'::public.fulfillment_mode, null, null, null, '',
      'cash'::public.payment_method,
      '[{"product_id":"00000000-0000-0000-0000-0000000000b1","quantity":1}]'::jsonb)$$);

select pg_temp.debe_fallar('la entrega a domicilio exige dirección',
  $$select public.create_public_order(
      'X', '099111666', null, 'delivery'::public.fulfillment_mode, null, null, null, '',
      'whatsapp'::public.payment_method,
      '[{"product_id":"00000000-0000-0000-0000-0000000000b1","quantity":1}]'::jsonb)$$);

select pg_temp.debe_fallar('un pedido sin líneas se rechaza',
  $$select public.create_public_order(
      'X', '099111777', null, 'pickup'::public.fulfillment_mode, null, null, null, '',
      'whatsapp'::public.payment_method, '[]'::jsonb)$$);
rollback;

-- ══════════════════════════════════════════════════════════════════════════
-- 7 · Reglas de negocio en la base
-- ══════════════════════════════════════════════════════════════════════════
begin;
select pg_temp.como_servicio();

-- Un producto vendido no se borra ni con la clave de servicio.
insert into public.order_items (
  order_id, product_id, product_name, product_slug,
  unit_price_cents, quantity, line_total_cents, sale_mode
) values (
  '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000b1',
  'Producto activo', 'producto-activo', 45000, 1, 45000, 'direct'
);

select pg_temp.debe_fallar('un producto ya vendido no puede borrarse',
  $$delete from public.products where id = '00000000-0000-0000-0000-0000000000b1'$$);

-- El historial de estados se escribe solo.
update public.orders set status = 'confirmed'
where id = '00000000-0000-0000-0000-0000000000e1';
select pg_temp.esperar('el cambio de estado queda registrado',
  (select count(*)::int from public.order_status_history
   where order_id = '00000000-0000-0000-0000-0000000000e1' and to_status = 'confirmed'), 1);

-- Idempotencia del webhook: el mismo evento no entra dos veces.
insert into public.payment_events (provider, event_key, event_type)
values ('mercado_pago', 'evento-123', 'payment');
select pg_temp.debe_fallar('un evento de pago repetido se rechaza',
  $$insert into public.payment_events (provider, event_key, event_type)
    values ('mercado_pago', 'evento-123', 'payment')$$);

-- Una sola imagen principal por producto.
insert into public.media_assets (id, path, mime_type) values
  ('00000000-0000-0000-0000-0000000000f1', 'a.jpg', 'image/jpeg'),
  ('00000000-0000-0000-0000-0000000000f2', 'b.jpg', 'image/jpeg');
insert into public.product_images (product_id, media_id, is_primary)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000f1', true);
select pg_temp.debe_fallar('no puede haber dos imágenes principales',
  $$insert into public.product_images (product_id, media_id, is_primary)
    values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000f2', true)$$);

select pg_temp.esperar('el medio en uso se detecta',
  (select count(*)::int from public.media_asset_usage('00000000-0000-0000-0000-0000000000f1')), 1);

-- Un producto de compra directa no puede quedarse sin precio.
select pg_temp.debe_fallar('compra directa exige precio',
  $$insert into public.products (slug, name, status, sale_mode, price_cents)
    values ('sin-precio', 'Sin precio', 'active', 'direct', null)$$);
rollback;

\echo ''
\echo '════════════════════════════════════════════════════════'
\echo ' TODAS LAS PRUEBAS DE RLS Y REGLAS DE NEGOCIO PASARON'
\echo '════════════════════════════════════════════════════════'
