-- ============================================================================
-- Verificación del importador de imágenes de pastelería
--
-- Este entorno no tiene salida de red hacia Supabase, así que
-- `scripts/importar-imagenes-pasteleria-v1.mjs` no se pudo correr contra el
-- proyecto real. Este archivo reproduce en SQL puro la misma secuencia de
-- escrituras que hace el script para cada caso: alta simple, imagen
-- compartida entre dos presentaciones, reemplazo seguro de una principal
-- existente, y que nada de esto duplique filas al repetirse.
--
-- Se sembra su propia categoría y sus propios productos con los 16 slugs
-- reales del manifiesto — no depende de los que carga la migración del
-- catálogo, porque 01_rls.sql ya los reemplazó por sus fixtures mínimas
-- cuando este archivo corre después en la cadena de `run.sh`. (Se confirmó
-- aparte, contra una base recién migrada sin ese reemplazo, que la migración
-- `20260821090000_catalogo_real_chef_arturo_v1.sql` sí siembra los 16 slugs:
-- ver el informe de esta rama.)
--
--   psql -d chef_arturo_test -f supabase/tests/04_pasteleria_imagenes.sql
-- ============================================================================

\set ON_ERROR_STOP on
\pset pager off

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

-- ── Simulación de la secuencia del importador ───────────────────────────────
-- Como administrador: es exactamente el rol con el que corre el script (la
-- clave de servicio se comporta como `service_role`, que salta RLS igual que
-- un admin activo la cumple).
begin;
select pg_temp.como_usuario('00000000-0000-0000-0000-0000000000a1');

-- Categoría y los 16 productos del manifiesto, sembrados acá mismo: idénticos
-- en slug a los que carga el catálogo real, para que la prueba valga sin
-- importar qué haya dejado 01_rls.sql en la tabla.
insert into public.categories (id, slug, name, is_active)
values ('00000000-0000-4000-8000-0000000000c9', 'pasteleria-04', 'Pastelería (prueba)', true)
on conflict (id) do nothing;

insert into public.products (slug, name, category_id, price_cents, status, sale_mode)
select slug, name, '00000000-0000-4000-8000-0000000000c9', 24000, 'active', 'direct'
from (values
  ('crumble-manzana-individual', 'Crumble de manzana — individual'),
  ('crumble-manzana-entero-kg', 'Crumble de manzana — entero por kg'),
  ('cheesecake-naranja-individual', 'Cheesecake de naranja — individual'),
  ('cheesecake-naranja-entero-kg', 'Cheesecake de naranja — entero por kg'),
  ('lemon-pie-individual', 'Lemon pie — individual'),
  ('lemon-pie-entero-kg', 'Lemon pie — entero por kg'),
  ('mango-maracuya-individual', 'Mango y maracuyá — individual'),
  ('mango-maracuya-entero-kg', 'Mango y maracuyá — entero por kg'),
  ('mousse-pistacho-chocolate-blanco-individual', 'Mousse de pistacho y chocolate blanco — individual'),
  ('mousse-pistacho-chocolate-blanco-entero-kg', 'Mousse de pistacho y chocolate blanco — entero por kg'),
  ('mousse-dulce-de-leche-frutos-rojos-individual', 'Mousse de dulce de leche y frutos rojos — individual'),
  ('mousse-dulce-de-leche-frutos-rojos-entero-kg', 'Mousse de dulce de leche y frutos rojos — entero por kg'),
  ('cheesecake-clasica-individual', 'Cheesecake clásica — individual'),
  ('cheesecake-clasica-entero-kg', 'Cheesecake clásica — entero por kg'),
  ('cheesecake-maracuya-individual', 'Cheesecake de maracuyá — individual'),
  ('cheesecake-maracuya-entero-kg', 'Cheesecake de maracuyá — entero por kg')
) as manifiesto(slug, name)
on conflict (slug) do nothing;

select pg_temp.esperar(
  'los 16 slugs de pastelería del manifiesto quedaron sembrados',
  (
    select count(*)::int from public.products
    where category_id = '00000000-0000-4000-8000-0000000000c9'
  ),
  16
);

-- 1 · Alta simple: crumble-manzana-individual no tenía imagen.
insert into storage.objects (bucket_id, name)
values ('media', 'productos/pasteleria/crumble-manzana-individual.jpg');

insert into public.media_assets (id, bucket, path, alt, mime_type, source, credit, is_temporary)
values (
  '00000000-0000-4000-8000-0000000000f1',
  'media', 'productos/pasteleria/crumble-manzana-individual.jpg',
  'Crumble de manzana — individual', 'image/jpeg', 'own', 'Chef Arturo', false
)
on conflict (bucket, path) do update set alt = excluded.alt
returning id;

insert into public.product_images (product_id, media_id, alt, position, is_primary)
select id, '00000000-0000-4000-8000-0000000000f1', 'Crumble de manzana — individual', 0, true
from public.products where slug = 'crumble-manzana-individual'
on conflict (product_id, media_id) do update set is_primary = true;

select pg_temp.esperar(
  'crumble-manzana-individual queda con imagen principal',
  (
    select pi.is_primary from public.product_images pi
    join public.products p on p.id = pi.product_id
    where p.slug = 'crumble-manzana-individual'
  ),
  true
);

-- 2 · Imagen compartida: cheesecake-clasica vincula el MISMO media_id a
--     individual y a entero-kg.
insert into storage.objects (bucket_id, name)
values ('media', 'productos/pasteleria/cheesecake-clasica.jpg');

insert into public.media_assets (id, bucket, path, alt, mime_type, source, credit, is_temporary)
values (
  '00000000-0000-4000-8000-0000000000f2',
  'media', 'productos/pasteleria/cheesecake-clasica.jpg',
  'Cheesecake clásica de Chef Arturo', 'image/jpeg', 'own', 'Chef Arturo', false
)
on conflict (bucket, path) do nothing;

insert into public.product_images (product_id, media_id, alt, position, is_primary)
select id, '00000000-0000-4000-8000-0000000000f2', 'Cheesecake clásica — individual', 0, true
from public.products where slug = 'cheesecake-clasica-individual'
on conflict (product_id, media_id) do update set is_primary = true;

insert into public.product_images (product_id, media_id, alt, position, is_primary)
select id, '00000000-0000-4000-8000-0000000000f2', 'Cheesecake clásica — entero por kg', 0, true
from public.products where slug = 'cheesecake-clasica-entero-kg'
on conflict (product_id, media_id) do update set is_primary = true;

select pg_temp.esperar(
  'cheesecake clásica individual y entero comparten el mismo media_id',
  (
    select count(distinct pi.media_id)::int
    from public.product_images pi
    join public.products p on p.id = pi.product_id
    where p.slug in ('cheesecake-clasica-individual', 'cheesecake-clasica-entero-kg')
      and pi.is_primary
  ),
  1
);

-- 3 · Reemplazo seguro: lemon-pie-individual ya tenía otra imagen (simula un
--     import anterior); el importador la reemplaza sin dejar un momento con
--     dos principales, y borra la vieja sólo por quedar huérfana.
insert into storage.objects (bucket_id, name) values ('media', 'productos/vieja-lemon.jpg');
insert into public.media_assets (id, bucket, path, alt, mime_type, source, is_temporary)
values ('00000000-0000-4000-8000-0000000000f3', 'media', 'productos/vieja-lemon.jpg', 'Genérica', 'image/jpeg', 'own', true);
insert into public.product_images (product_id, media_id, alt, position, is_primary)
select id, '00000000-0000-4000-8000-0000000000f3', 'Genérica', 0, true
from public.products where slug = 'lemon-pie-individual';

-- Paso 1 del reemplazo: subir y registrar la nueva.
insert into storage.objects (bucket_id, name)
values ('media', 'productos/pasteleria/lemon-pie-individual.jpg');
insert into public.media_assets (id, bucket, path, alt, mime_type, source, credit, is_temporary)
values (
  '00000000-0000-4000-8000-0000000000f4',
  'media', 'productos/pasteleria/lemon-pie-individual.jpg',
  'Lemon pie — individual', 'image/jpeg', 'own', 'Chef Arturo', false
);

-- Paso 2: bajar la principal anterior ANTES de subir la nueva a true — el
-- índice único product_images_one_primary rechazaría dos filas true a la vez.
update public.product_images set is_primary = false
where product_id = (select id from public.products where slug = 'lemon-pie-individual')
  and is_primary;

insert into public.product_images (product_id, media_id, alt, position, is_primary)
select id, '00000000-0000-4000-8000-0000000000f4', 'Lemon pie — individual', 0, true
from public.products where slug = 'lemon-pie-individual'
on conflict (product_id, media_id) do update set is_primary = true;

-- Paso 3: verificar.
select pg_temp.esperar(
  'lemon-pie-individual quedó con la imagen nueva como principal',
  (
    select pi.media_id from public.product_images pi
    join public.products p on p.id = pi.product_id
    where p.slug = 'lemon-pie-individual' and pi.is_primary
  ),
  '00000000-0000-4000-8000-0000000000f4'::uuid
);

-- Paso 4: recién ahora, quitar la relación anterior.
delete from public.product_images
where product_id = (select id from public.products where slug = 'lemon-pie-individual')
  and media_id = '00000000-0000-4000-8000-0000000000f3';

-- Paso 5: el asset anterior queda huérfano → media_asset_usage lo confirma
-- → se borra.
select pg_temp.esperar(
  'la imagen vieja de lemon pie quedó sin usos tras el reemplazo',
  (select count(*)::int from public.media_asset_usage('00000000-0000-4000-8000-0000000000f3')),
  0
);
delete from public.media_assets where id = '00000000-0000-4000-8000-0000000000f3';
delete from storage.objects where name = 'productos/vieja-lemon.jpg';

select pg_temp.esperar(
  'nunca hubo dos imágenes principales para lemon-pie-individual a la vez',
  (
    select count(*)::int from public.product_images pi
    join public.products p on p.id = pi.product_id
    where p.slug = 'lemon-pie-individual' and pi.is_primary
  ),
  1
);

-- 4 · Una imagen todavía compartida NO se borra al "reemplazar" en uno de
--     sus dos productos — la comparte cheesecake-clasica-entero-kg, así que
--     media_asset_usage no debe reportar cero.
select pg_temp.esperar(
  'la imagen compartida de cheesecake clásica sigue en uso por sus dos productos',
  (select count(*)::int from public.media_asset_usage('00000000-0000-4000-8000-0000000000f2')),
  2
);
select pg_temp.esperar(
  'el asset compartido de cheesecake clásica sigue existiendo',
  (select count(*)::int from public.media_assets where id = '00000000-0000-4000-8000-0000000000f2'),
  1
);

-- 5 · Idempotencia: repetir el alta de crumble-manzana-individual no
--     duplica la fila de media_assets (mismo id por el upsert de bucket+path)
--     ni la de product_images.
insert into public.media_assets (id, bucket, path, alt, mime_type, source, credit, is_temporary)
values (
  '00000000-0000-4000-8000-0000000000ff',  -- id distinto a propósito
  'media', 'productos/pasteleria/crumble-manzana-individual.jpg',
  'Crumble de manzana — individual', 'image/jpeg', 'own', 'Chef Arturo', false
)
on conflict (bucket, path) do update set alt = excluded.alt
returning id;

select pg_temp.esperar(
  'el upsert por (bucket, path) conserva el id original, no lo cambia',
  (select id from public.media_assets where path = 'productos/pasteleria/crumble-manzana-individual.jpg'),
  '00000000-0000-4000-8000-0000000000f1'::uuid
);

insert into public.product_images (product_id, media_id, alt, position, is_primary)
select id, '00000000-0000-4000-8000-0000000000f1', 'Crumble de manzana — individual', 0, true
from public.products where slug = 'crumble-manzana-individual'
on conflict (product_id, media_id) do update set is_primary = true;

select pg_temp.esperar(
  'repetir el alta no duplica la relación producto-imagen',
  (
    select count(*)::int from public.product_images pi
    join public.products p on p.id = pi.product_id
    where p.slug = 'crumble-manzana-individual'
  ),
  1
);

rollback;

\echo ''
\echo '════════════════════════════════════════════════════════'
\echo ' VERIFICACIÓN DEL IMPORTADOR DE PASTELERÍA (SQL) OK'
\echo ' Pendiente: correrlo de verdad contra Supabase (sin red desde acá)'
\echo '════════════════════════════════════════════════════════'
