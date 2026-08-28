-- ============================================================================
-- Pedido de ejemplo para el panel
--
-- Crea UN pedido de muestra, con su cliente y tres líneas, para que la dueña
-- vea el panel con algo adentro antes de que entre el primer pedido real.
--
-- Cómo correrlo: Supabase → SQL Editor → pegar todo → Run.
--
-- Qué hace y qué no:
--
--   · Los importes NO se escriben a mano. Cada línea lee el precio vigente de
--     `products` y el total se suma de las líneas. Si mañana cambia un precio,
--     este script sigue dando el número correcto.
--   · No toca el stock: los 37 productos del catálogo tienen `track_stock` en
--     falso, así que no hay nada que descontar.
--   · Si algún slug no existe o no está activo, aborta y no deja nada a medias.
--   · Si ya hay un pedido de ejemplo, no crea otro. Se puede correr dos veces
--     sin duplicar nada.
--   · El pedido queda en "pendiente" y el pago en "pendiente", así que NO
--     entra en "ventas del mes" ni en el ticket promedio: los reportes siguen
--     mostrando cero hasta que haya una venta de verdad.
--
-- Para borrarlo después está `docs/pedido-de-ejemplo-borrar.sql`.
-- ============================================================================

do $$
declare
  c_marca constant text := 'PEDIDO DE EJEMPLO';
  -- Teléfono deliberadamente inexistente: 099 000 000 no está asignado.
  c_telefono constant text := '59899000000';
  v_cliente uuid;
  v_pedido uuid;
  v_numero text;
  v_lineas integer;
  v_total integer;
begin
  if exists (select 1 from public.orders where internal_notes like c_marca || '%') then
    raise notice 'Ya existe un pedido de ejemplo. No se crea otro.';
    return;
  end if;

  -- ── Cliente ───────────────────────────────────────────────────────────────
  insert into public.customers (name, phone, email, internal_notes)
  values (
    'Carolina Méndez',
    c_telefono,
    null,
    c_marca || ' · cliente de muestra, no es una persona real.'
  )
  on conflict (phone) do update
    set name = excluded.name,
        internal_notes = excluded.internal_notes,
        updated_at = now()
  returning id into v_cliente;

  -- ── Pedido ────────────────────────────────────────────────────────────────
  v_numero := 'CA-' || nextval('public.order_number_seq')::text;

  insert into public.orders (
    order_number, customer_id,
    status, payment_status, payment_method,
    fulfillment, address,
    requested_date, requested_slot,
    customer_comments, internal_notes
  ) values (
    v_numero, v_cliente,
    'pending', 'pending', 'whatsapp',
    'delivery', 'Dirección de ejemplo — este pedido es de prueba',
    current_date + 2, 'tarde',
    'Es para un cumpleaños. ¿Lo pueden tener listo antes de las 17?',
    c_marca || ' · sirve para recorrer el panel: cambiar el estado, ver el '
      || 'historial y el detalle. Se puede borrar cuando ya no haga falta.'
  )
  returning id into v_pedido;

  -- ── Líneas ────────────────────────────────────────────────────────────────
  -- El precio y el nombre salen de `products`; acá sólo se dice qué y cuánto.
  insert into public.order_items (
    order_id, product_id, product_name, product_slug,
    unit_price_cents, quantity, line_total_cents, sale_mode
  )
  select
    v_pedido, p.id, p.name, p.slug,
    coalesce(p.price_cents, 0),
    q.cantidad,
    coalesce(p.price_cents, 0) * q.cantidad,
    p.sale_mode
  from (values
    ('cheesecake-clasica-entero-kg', 1),
    ('pack-matero-6-empanadas', 1),
    ('cookie-levain-clasica-chips', 4)
  ) as q(slug, cantidad)
  join public.products p on p.slug = q.slug and p.status = 'active';

  -- Si un slug no existiera, el join lo saltearía en silencio y el pedido
  -- quedaría incompleto. Mejor abortar y que no quede nada.
  select count(*) into v_lineas from public.order_items where order_id = v_pedido;
  if v_lineas <> 3 then
    raise exception
      'Se esperaban 3 líneas y se crearon %. Revisá que los tres slugs existan y estén activos; no se creó nada.',
      v_lineas;
  end if;

  -- ── Totales ───────────────────────────────────────────────────────────────
  select sum(line_total_cents)::integer into v_total
  from public.order_items where order_id = v_pedido;

  update public.orders
  set subtotal_cents = v_total,
      shipping_cents = 0,
      discount_cents = 0,
      total_cents = v_total
  where id = v_pedido;

  update public.customers
  set first_order_at = coalesce(first_order_at, now()),
      last_order_at = now()
  where id = v_cliente;

  raise notice 'Pedido % creado con % líneas. Total: $ %',
    v_numero, v_lineas, to_char(v_total / 100.0, 'FM999G999D00');
end $$;

-- Cómo quedó.
select o.order_number, c.name as cliente, o.status, o.payment_status,
       o.fulfillment, o.requested_date, o.requested_slot,
       to_char(o.total_cents / 100.0, 'FM$ 999G999D00') as total,
       (select count(*) from public.order_items i where i.order_id = o.id) as lineas
from public.orders o
join public.customers c on c.id = o.customer_id
where o.internal_notes like 'PEDIDO DE EJEMPLO%';
