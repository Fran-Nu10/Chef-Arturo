-- ============================================================================
-- Pruebas de pedidos, stock y pagos
--
-- Cubren lo que la auditoría encontró roto y lo que no debe volver a romperse.
-- Corren contra PostgreSQL de verdad, no contra un doble.
-- ============================================================================

\set ON_ERROR_STOP on
set client_min_messages to notice;

create or replace function pg_temp.ok(descripcion text, condicion boolean)
returns void language plpgsql as $$
begin
  if not condicion then
    raise exception 'FALLA · %', descripcion;
  end if;
  raise notice 'ok · %', descripcion;
end; $$;

create or replace function pg_temp.debe_fallar(
  descripcion text, sentencia text, motivo_esperado text default null)
returns void language plpgsql as $$
declare v_error text;
begin
  begin
    execute sentencia;
  exception when others then
    v_error := sqlerrm;
    -- Exigir el motivo evita que una prueba pase por la razón equivocada.
    if motivo_esperado is not null and position(motivo_esperado in v_error) = 0 then
      raise exception 'FALLA · % — falló, pero por otro motivo: %', descripcion, v_error;
    end if;
    raise notice 'ok · % (rechazado: %)', descripcion, v_error;
    return;
  end;
  raise exception 'FALLA · % — la sentencia fue aceptada', descripcion;
end; $$;

-- ── Semilla ────────────────────────────────────────────────────────────────
delete from public.payment_events;
delete from public.payments;
delete from public.order_items;
delete from public.order_status_history;
delete from public.orders;
delete from public.customers;
delete from public.products;
delete from public.categories;

insert into public.categories (id, slug, name)
values ('00000000-0000-0000-0000-0000000000c1', 'tortas', 'Tortas');

insert into public.products (id, slug, name, status, sale_mode, price_cents, track_stock, stock_quantity, min_quantity)
values
  ('00000000-0000-0000-0000-0000000000a1', 'torta', 'Torta', 'active', 'direct', 45000, true, 10, 1),
  ('00000000-0000-0000-0000-0000000000a2', 'borrador', 'Borrador', 'draft', 'direct', 30000, false, 0, 1),
  ('00000000-0000-0000-0000-0000000000a3', 'archivado', 'Archivado', 'archived', 'direct', 30000, false, 0, 1),
  ('00000000-0000-0000-0000-0000000000a4', 'porencargo', 'Por encargo', 'active', 'quote', null, false, 0, 6);

-- ════════════════════════════════════════════════════════════════════════════
-- 1 · El precio nunca viene del cliente
-- ════════════════════════════════════════════════════════════════════════════
set role anon;
select set_config('request.jwt.claims', '{}', false);

do $$
declare v_total integer;
begin
  -- El JSON trae un precio inventado de 1 centésimo. La función sólo mira
  -- product_id y quantity.
  select total_cents into v_total from public.create_public_order(
    'Ana', '099111222', null, 'pickup', null, null, null, '', 'whatsapp',
    '[{"product_id":"00000000-0000-0000-0000-0000000000a1","quantity":2,
       "unit_price_cents":1,"price":1,"line_total_cents":1,"total_cents":1}]'::jsonb
  );
  perform pg_temp.ok(
    'el precio inyectado en el JSON se ignora y el total se recalcula (90000)',
    v_total = 90000);
end $$;

-- ── Producto no publicado ──────────────────────────────────────────────────
select pg_temp.debe_fallar('no se puede pedir un producto en borrador', $$
  select public.create_public_order('Ana','099111223',null,'pickup',null,null,null,'','whatsapp',
    '[{"product_id":"00000000-0000-0000-0000-0000000000a2","quantity":1}]'::jsonb) $$, 'Producto no disponible');

select pg_temp.debe_fallar('no se puede pedir un producto archivado', $$
  select public.create_public_order('Ana','099111224',null,'pickup',null,null,null,'','whatsapp',
    '[{"product_id":"00000000-0000-0000-0000-0000000000a3","quantity":1}]'::jsonb) $$, 'Producto no disponible');

-- ── Cantidades ─────────────────────────────────────────────────────────────
select pg_temp.debe_fallar('cantidad cero', $$
  select public.create_public_order('Ana','099111225',null,'pickup',null,null,null,'','whatsapp',
    '[{"product_id":"00000000-0000-0000-0000-0000000000a1","quantity":0}]'::jsonb) $$, 'Cantidad inválida');

select pg_temp.debe_fallar('cantidad negativa', $$
  select public.create_public_order('Ana','099111226',null,'pickup',null,null,null,'','whatsapp',
    '[{"product_id":"00000000-0000-0000-0000-0000000000a1","quantity":-5}]'::jsonb) $$, 'Cantidad inválida');

select pg_temp.debe_fallar('por debajo de la cantidad mínima', $$
  select public.create_public_order('Ana','099111227',null,'pickup',null,null,null,'','whatsapp',
    '[{"product_id":"00000000-0000-0000-0000-0000000000a4","quantity":2}]'::jsonb) $$, 'cantidad mínima');

select pg_temp.debe_fallar('pedido sin líneas', $$
  select public.create_public_order('Ana','099111228',null,'pickup',null,null,null,'','whatsapp',
    '[]'::jsonb) $$, 'no tiene líneas');

select pg_temp.debe_fallar('entrega a domicilio sin dirección', $$
  select public.create_public_order('Ana','099111229',null,'delivery',null,null,null,'','whatsapp',
    '[{"product_id":"00000000-0000-0000-0000-0000000000a1","quantity":1}]'::jsonb) $$, 'necesita dirección');

-- ── Nadie declara que ya pagó ──────────────────────────────────────────────
select pg_temp.debe_fallar('el comprador no puede elegir un método de pago fuera de la lista', $$
  select public.create_public_order('Ana','099111230',null,'pickup',null,null,null,'','cash',
    '[{"product_id":"00000000-0000-0000-0000-0000000000a1","quantity":1}]'::jsonb) $$, 'Método de pago inválido');

do $$
declare v_id uuid;
begin
  select order_id into v_id from public.create_public_order(
    'Ana','099111231',null,'pickup',null,null,null,'','mercado_pago',
    '[{"product_id":"00000000-0000-0000-0000-0000000000a1","quantity":1}]'::jsonb);
  perform pg_temp.ok('el pedido nace pendiente en estado y en pago',
    (select status = 'pending' and payment_status = 'pending'
     from public.orders where id = v_id));
end $$;

-- ── Stock ──────────────────────────────────────────────────────────────────
do $$
begin
  perform pg_temp.ok('el stock se descontó al crear los pedidos (10 - 2 - 1 = 7)',
    (select stock_quantity = 7 from public.products
     where id = '00000000-0000-0000-0000-0000000000a1'));
end $$;

select pg_temp.debe_fallar('no se puede pedir más que el stock disponible', $$
  select public.create_public_order('Ana','099111232',null,'pickup',null,null,null,'','whatsapp',
    '[{"product_id":"00000000-0000-0000-0000-0000000000a1","quantity":999}]'::jsonb) $$, 'Sin stock suficiente');

-- El mismo producto repetido en dos líneas no puede burlar el control.
select pg_temp.debe_fallar('el mismo producto en dos líneas no evade el stock', $$
  select public.create_public_order('Ana','099111233',null,'pickup',null,null,null,'','whatsapp',
    '[{"product_id":"00000000-0000-0000-0000-0000000000a1","quantity":5},
      {"product_id":"00000000-0000-0000-0000-0000000000a1","quantity":5}]'::jsonb) $$, 'Sin stock suficiente');

do $$
begin
  perform pg_temp.ok('un pedido rechazado no deja el stock tocado (sigue en 7)',
    (select stock_quantity = 7 from public.products
     where id = '00000000-0000-0000-0000-0000000000a1'));
end $$;

reset role;

-- ── Reposición al cancelar ─────────────────────────────────────────────────
do $$
declare v_id uuid;
begin
  select id into v_id from public.orders where total_cents = 90000 limit 1;

  update public.orders set status = 'cancelled' where id = v_id;
  perform pg_temp.ok('cancelar devuelve el stock de las líneas (7 + 2 = 9)',
    (select stock_quantity = 9 from public.products
     where id = '00000000-0000-0000-0000-0000000000a1'));

  perform pg_temp.ok('queda registrado cuándo se devolvió',
    (select stock_restored_at is not null from public.orders where id = v_id));

  -- Sacarlo de cancelado y volver a cancelarlo no debe reponer dos veces.
  update public.orders set status = 'pending' where id = v_id;
  update public.orders set status = 'cancelled' where id = v_id;
  perform pg_temp.ok('recancelar no repone dos veces (sigue en 9)',
    (select stock_quantity = 9 from public.products
     where id = '00000000-0000-0000-0000-0000000000a1'));
end $$;

-- ── Historial automático ───────────────────────────────────────────────────
do $$
begin
  perform pg_temp.ok('cada cambio de estado deja historial',
    (select count(*) >= 3 from public.order_status_history));
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 2 · Pagos
-- ════════════════════════════════════════════════════════════════════════════

-- El upsert que hace el webhook. Antes fallaba con 42P10 porque el índice era
-- parcial: es la regresión más importante que cubre este archivo.
do $$
declare v_o uuid;
begin
  select id into v_o from public.orders limit 1;

  insert into public.payments (order_id, method, status, amount_cents, provider_payment_id)
  values (v_o, 'mercado_pago', 'pending', 45000, 'MP-100')
  on conflict (provider_payment_id) do update set status = excluded.status;

  perform pg_temp.ok('el upsert del webhook infiere el índice único',
    (select status = 'pending' from public.payments where provider_payment_id = 'MP-100'));

  insert into public.payments (order_id, method, status, amount_cents, provider_payment_id)
  values (v_o, 'mercado_pago', 'approved', 45000, 'MP-100')
  on conflict (provider_payment_id) do update set status = excluded.status;

  perform pg_temp.ok('una notificación repetida actualiza, no duplica',
    (select count(*) = 1 from public.payments where provider_payment_id = 'MP-100'));
  perform pg_temp.ok('y deja el último estado',
    (select status = 'approved' from public.payments where provider_payment_id = 'MP-100'));
end $$;

-- Varias filas sin provider_payment_id tienen que seguir conviviendo.
do $$
declare v_o uuid;
begin
  select id into v_o from public.orders limit 1;
  insert into public.payments (order_id, method, status, amount_cents)
  values (v_o, 'whatsapp', 'pending', 1000), (v_o, 'whatsapp', 'pending', 2000);
  perform pg_temp.ok('el único no estorba a los pagos sin id de proveedor', true);
end $$;

-- Idempotencia de eventos.
do $$
begin
  insert into public.payment_events (provider, event_key, event_type)
  values ('mercado_pago', 'EV-1', 'payment.updated');
  begin
    insert into public.payment_events (provider, event_key, event_type)
    values ('mercado_pago', 'EV-1', 'payment.updated');
    raise exception 'FALLA · se aceptó un evento duplicado';
  exception when unique_violation then
    perform pg_temp.ok('un evento repetido del proveedor se rechaza por clave única', true);
  end;
end $$;

-- ── Nadie aprueba un pago desde el navegador ───────────────────────────────
select set_config('prueba.pedido', (select id::text from public.orders limit 1), false);

set role anon;
select set_config('request.jwt.claims', '{}', false);

-- Con un literal, no con un select: anon no ve `orders`, así que un
-- `insert ... select` insertaría cero filas y pasaría sin probar nada.
select pg_temp.debe_fallar('anon no puede insertar un pago aprobado', format($f$
  insert into public.payments (order_id, method, status, amount_cents)
  values (%L, 'mercado_pago', 'approved', 1) $f$, current_setting('prueba.pedido')),
  'row-level security');

do $$
declare n integer;
begin
  update public.payments set status = 'approved';
  get diagnostics n = row_count;
  perform pg_temp.ok('anon no puede aprobar un pago existente (0 filas)', n = 0);

  update public.orders set payment_status = 'approved', total_cents = 1;
  get diagnostics n = row_count;
  perform pg_temp.ok('anon no puede aprobar ni cambiar el total de un pedido (0 filas)', n = 0);

  update public.products set price_cents = 1;
  get diagnostics n = row_count;
  perform pg_temp.ok('anon no puede cambiar precios (0 filas)', n = 0);
end $$;

do $$
begin
  perform pg_temp.ok('anon no ve pagos', (select count(*) = 0 from public.payments));
  perform pg_temp.ok('anon no ve pedidos', (select count(*) = 0 from public.orders));
  perform pg_temp.ok('anon no ve clientes', (select count(*) = 0 from public.customers));
  perform pg_temp.ok('anon no ve líneas de pedido', (select count(*) = 0 from public.order_items));
  perform pg_temp.ok('anon no ve eventos de pago', (select count(*) = 0 from public.payment_events));
  perform pg_temp.ok('anon no ve historial de estados',
    (select count(*) = 0 from public.order_status_history));
end $$;

reset role;

\echo ''
\echo '════════════════════════════════════════════════════════'
\echo ' PEDIDOS, STOCK Y PAGOS · TODAS LAS PRUEBAS PASARON'
\echo '════════════════════════════════════════════════════════'
