-- ============================================================================
-- Pruebas del flujo de imágenes del panel
--
-- La subida va del navegador a Storage con la sesión del administrador, así
-- que la seguridad real vive en estas políticas: quién puede escribir en el
-- bucket `media`, quién puede registrar `media_assets`, y qué protege a una
-- imagen que está en uso. Se prueban los cuatro sujetos, igual que en 01.
--
--   psql -d chef_arturo_test -f supabase/tests/03_imagenes.sql
-- ============================================================================

\set ON_ERROR_STOP on
\pset pager off

-- ── Utilidades (cada archivo corre en su propia sesión) ─────────────────────
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

create or replace function pg_temp.debe_fallar(
  descripcion text, sentencia text, motivo_esperado text default null)
returns void language plpgsql as $$
declare v_error text;
begin
  begin
    execute sentencia;
  exception when others then
    v_error := sqlerrm;
    if motivo_esperado is not null and position(motivo_esperado in v_error) = 0 then
      raise exception 'FALLA · % — falló, pero por otro motivo: %', descripcion, v_error;
    end if;
    raise notice 'ok · % (rechazado: %)', descripcion, v_error;
    return;
  end;
  raise exception 'FALLA · % — la sentencia fue aceptada', descripcion;
end; $$;

create or replace function pg_temp.debe_no_afectar(descripcion text, sentencia text)
returns void language plpgsql as $$
declare n integer;
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

-- ── Datos de prueba ─────────────────────────────────────────────────────────
-- Reusa los administradores sembrados por 01 (a1 owner, a2 staff activo,
-- a3 staff inactivo, a4 usuario común) y siembra lo propio del flujo de
-- imágenes. Idempotente: limpia lo suyo antes de sembrar.
begin;

delete from storage.objects where name like 'productos/%' or name like 'categorias/%' or name like 'contenido/%';
delete from public.product_images;
delete from public.products where slug like 'img-%';
update public.categories set image_id = null;
delete from public.media_assets where path like 'productos/%' or path like 'categorias/%' or path like 'contenido/%';

insert into public.products (id, slug, name, category_id, price_cents, status, sale_mode)
values ('00000000-0000-0000-0000-00000000f0b1', 'img-producto', 'Producto con foto',
        '00000000-0000-0000-0000-0000000000c1', 45000, 'active', 'direct');

insert into public.media_assets (id, path, mime_type, alt) values
  ('00000000-0000-0000-0000-00000000f001', 'productos/11111111-1111-4111-8111-111111111111.jpg', 'image/jpeg', 'Producto con foto'),
  ('00000000-0000-0000-0000-00000000f002', 'categorias/22222222-2222-4222-8222-222222222222.webp', 'image/webp', 'Categoría Pastelería'),
  ('00000000-0000-0000-0000-00000000f003', 'contenido/33333333-3333-4333-8333-333333333333.png', 'image/png', 'Vitrina'),
  ('00000000-0000-0000-0000-00000000f004', 'productos/44444444-4444-4444-8444-444444444444.jpg', 'image/jpeg', 'Sin uso');

insert into public.product_images (product_id, media_id, is_primary, alt)
values ('00000000-0000-0000-0000-00000000f0b1', '00000000-0000-0000-0000-00000000f001', true, 'Producto con foto');

update public.categories
set image_id = '00000000-0000-0000-0000-00000000f002'
where id = '00000000-0000-0000-0000-0000000000c1';

update public.site_sections
set media_ids = to_jsonb(array['00000000-0000-0000-0000-00000000f003'])
where key = 'hero';

insert into storage.objects (bucket_id, name)
values ('media', 'productos/11111111-1111-4111-8111-111111111111.jpg');

commit;

-- ══════════════════════════════════════════════════════════════════════════
-- 1 · Anónimo: puede mirar el bucket público, no puede tocarlo
-- ══════════════════════════════════════════════════════════════════════════
begin;
select pg_temp.como_anon();

select pg_temp.esperar('anon lee el bucket media (es público)',
  (select count(*)::int from storage.objects where bucket_id = 'media'), 1);

select pg_temp.debe_fallar('anon NO puede subir al bucket media',
  $$insert into storage.objects (bucket_id, name)
    values ('media', 'productos/99999999-9999-4999-8999-999999999999.jpg')$$);

select pg_temp.debe_no_afectar('anon NO puede borrar objetos de Storage',
  $$delete from storage.objects where bucket_id = 'media'$$);

select pg_temp.debe_fallar('anon NO puede registrar media_assets',
  $$insert into public.media_assets (path, mime_type)
    values ('productos/98999999-9999-4999-8999-999999999999.jpg', 'image/jpeg')$$);
rollback;

-- ══════════════════════════════════════════════════════════════════════════
-- 2 · Autenticado sin permisos y administrador inactivo
-- ══════════════════════════════════════════════════════════════════════════
begin;
select pg_temp.como_usuario('00000000-0000-0000-0000-0000000000a4');

select pg_temp.debe_fallar('un usuario común NO puede subir al bucket media',
  $$insert into storage.objects (bucket_id, name)
    values ('media', 'productos/97999999-9999-4999-8999-999999999999.jpg')$$);

select pg_temp.debe_fallar('un usuario común NO puede registrar media_assets',
  $$insert into public.media_assets (path, mime_type)
    values ('productos/96999999-9999-4999-8999-999999999999.jpg', 'image/jpeg')$$);

select pg_temp.debe_no_afectar('un usuario común NO puede borrar media_assets',
  $$delete from public.media_assets$$);
rollback;

begin;
select pg_temp.como_usuario('00000000-0000-0000-0000-0000000000a3');

select pg_temp.debe_fallar('un administrador INACTIVO no puede subir',
  $$insert into storage.objects (bucket_id, name)
    values ('media', 'productos/95999999-9999-4999-8999-999999999999.jpg')$$);

select pg_temp.debe_fallar('un administrador INACTIVO no puede registrar media_assets',
  $$insert into public.media_assets (path, mime_type)
    values ('productos/94999999-9999-4999-8999-999999999999.jpg', 'image/jpeg')$$);
rollback;

-- ══════════════════════════════════════════════════════════════════════════
-- 3 · Administrador activo: el flujo completo del subidor
-- ══════════════════════════════════════════════════════════════════════════
begin;
select pg_temp.como_usuario('00000000-0000-0000-0000-0000000000a2');

insert into storage.objects (bucket_id, name)
values ('media', 'productos/93999999-9999-4999-8999-999999999999.jpg');
select pg_temp.esperar('staff activo sube al bucket media',
  (select count(*)::int from storage.objects
   where name = 'productos/93999999-9999-4999-8999-999999999999.jpg'), 1);

insert into public.media_assets (path, mime_type, alt)
values ('productos/93999999-9999-4999-8999-999999999999.jpg', 'image/jpeg', 'Nueva foto');
select pg_temp.esperar('staff activo registra media_assets',
  (select count(*)::int from public.media_assets
   where path = 'productos/93999999-9999-4999-8999-999999999999.jpg'), 1);

-- Reemplazo: la relación cambia de media y la vieja queda huérfana.
update public.product_images
set media_id = (select id from public.media_assets
                where path = 'productos/93999999-9999-4999-8999-999999999999.jpg')
where product_id = '00000000-0000-0000-0000-00000000f0b1';
select pg_temp.esperar('tras reemplazar, la imagen anterior queda sin usos',
  (select count(*)::int from public.media_asset_usage('00000000-0000-0000-0000-00000000f001')), 0);

delete from public.media_assets where id = '00000000-0000-0000-0000-00000000f001';
select pg_temp.esperar('staff activo borra la imagen huérfana',
  (select count(*)::int from public.media_assets
   where id = '00000000-0000-0000-0000-00000000f001'), 0);

delete from storage.objects where name = 'productos/11111111-1111-4111-8111-111111111111.jpg';
select pg_temp.esperar('staff activo borra el objeto huérfano de Storage',
  (select count(*)::int from storage.objects
   where name = 'productos/11111111-1111-4111-8111-111111111111.jpg'), 0);
rollback;

-- ══════════════════════════════════════════════════════════════════════════
-- 4 · Protección de imágenes en uso y de rutas duplicadas
-- ══════════════════════════════════════════════════════════════════════════
begin;
select pg_temp.como_usuario('00000000-0000-0000-0000-0000000000a1');

select pg_temp.esperar('media_asset_usage detecta el uso en un producto',
  (select count(*)::int from public.media_asset_usage('00000000-0000-0000-0000-00000000f001')), 1);

select pg_temp.esperar('media_asset_usage detecta el uso en una categoría',
  (select count(*)::int from public.media_asset_usage('00000000-0000-0000-0000-00000000f002')), 1);

select pg_temp.esperar('media_asset_usage detecta el uso en una sección',
  (select count(*)::int from public.media_asset_usage('00000000-0000-0000-0000-00000000f003')), 1);

select pg_temp.esperar('una imagen sin referencias reporta cero usos',
  (select count(*)::int from public.media_asset_usage('00000000-0000-0000-0000-00000000f004')), 0);

-- Aunque la aplicación se equivocara, la base no deja borrar una imagen que
-- un producto referencia: el FK es `on delete restrict`.
select pg_temp.debe_fallar('la imagen de un producto no puede borrarse ni por error',
  $$delete from public.media_assets where id = '00000000-0000-0000-0000-00000000f001'$$);

-- La ruta es única: una subida no puede pisar un archivo registrado.
select pg_temp.debe_fallar('no se puede registrar dos veces la misma ruta',
  $$insert into public.media_assets (path, mime_type)
    values ('productos/44444444-4444-4444-8444-444444444444.jpg', 'image/jpeg')$$);
rollback;

\echo ''
\echo '════════════════════════════════════════════════════════'
\echo ' TODAS LAS PRUEBAS DEL FLUJO DE IMÁGENES PASARON'
\echo '════════════════════════════════════════════════════════'
