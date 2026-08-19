-- ============================================================================
-- 0005 · Creación pública de pedidos
--
-- Único camino por el que un visitante sin sesión puede escribir en `orders`.
-- Es SECURITY DEFINER porque necesita insertar en tablas que `anon` no puede
-- tocar, y por eso hace de aduana:
--
--   · sólo acepta (product_id, quantity); ignora cualquier precio del cliente,
--   · relee el precio de la tabla `products` filtrando por status = 'active',
--   · calcula subtotal y total en el servidor,
--   · fuerza status = 'pending' y payment_status = 'pending',
--   · valida cantidad mínima y stock,
--   · corre entera en una transacción: o se crea todo, o nada.
--
-- `search_path` fijado para que nadie pueda anteponer un esquema con tablas
-- homónimas y desviar las consultas.
-- ============================================================================

create or replace function public.create_public_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_fulfillment public.fulfillment_mode,
  p_address text,
  p_requested_date date,
  p_requested_slot text,
  p_comments text,
  p_payment_method public.payment_method,
  p_items jsonb
)
returns table (order_id uuid, order_number text, total_cents integer)
language plpgsql
security definer
set search_path = public, pg_temp
volatile
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_subtotal integer := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_unit_price integer;
  v_line_total integer;
  v_phone text;
  v_count integer;
begin
  -- ── Validación de entrada ────────────────────────────────────────────────
  if p_customer_name is null or length(btrim(p_customer_name)) < 2 then
    raise exception 'Nombre inválido' using errcode = 'check_violation';
  end if;

  -- Normalización del teléfono: sólo dígitos.
  v_phone := regexp_replace(coalesce(p_customer_phone, ''), '[^0-9]', '', 'g');
  if length(v_phone) < 6 then
    raise exception 'Teléfono inválido' using errcode = 'check_violation';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'El pedido no tiene líneas' using errcode = 'check_violation';
  end if;

  select count(*) into v_count from jsonb_array_elements(p_items);
  if v_count = 0 then
    raise exception 'El pedido no tiene líneas' using errcode = 'check_violation';
  end if;
  if v_count > 50 then
    raise exception 'Demasiadas líneas en un pedido' using errcode = 'check_violation';
  end if;

  if p_fulfillment = 'delivery'
     and (p_address is null or length(btrim(p_address)) = 0) then
    raise exception 'La entrega a domicilio necesita dirección'
      using errcode = 'check_violation';
  end if;

  -- Sólo se aceptan los métodos que el comprador puede elegir. Nadie crea un
  -- pedido declarando que ya pagó.
  if p_payment_method is null or p_payment_method not in ('mercado_pago', 'whatsapp') then
    raise exception 'Método de pago inválido' using errcode = 'check_violation';
  end if;

  -- ── Cliente ──────────────────────────────────────────────────────────────
  insert into public.customers (name, phone, email)
  values (btrim(p_customer_name), v_phone, nullif(btrim(coalesce(p_customer_email, '')), ''))
  on conflict (phone) do update
    set name = excluded.name,
        email = coalesce(excluded.email, public.customers.email),
        updated_at = now()
  returning id into v_customer_id;

  -- ── Pedido ───────────────────────────────────────────────────────────────
  v_order_number := 'CA-' || nextval('public.order_number_seq')::text;

  insert into public.orders (
    order_number, customer_id, status, payment_status, payment_method,
    fulfillment, address, requested_date, requested_slot, customer_comments
  ) values (
    v_order_number, v_customer_id, 'pending', 'pending', p_payment_method,
    p_fulfillment, nullif(btrim(coalesce(p_address, '')), ''),
    p_requested_date, nullif(btrim(coalesce(p_requested_slot, '')), ''),
    left(coalesce(p_comments, ''), 2000)
  )
  returning id into v_order_id;

  -- ── Líneas ───────────────────────────────────────────────────────────────
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := coalesce((v_item ->> 'quantity')::integer, 0);
    if v_quantity <= 0 or v_quantity > 999 then
      raise exception 'Cantidad inválida' using errcode = 'check_violation';
    end if;

    -- El precio sale de acá, no del cliente. `for update` bloquea la fila
    -- para que dos pedidos simultáneos no se lleven el mismo último stock.
    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid
      and status = 'active'
    for update;

    if not found then
      raise exception 'Producto no disponible: %', v_item ->> 'product_id'
        using errcode = 'no_data_found';
    end if;

    if v_quantity < v_product.min_quantity then
      raise exception 'El producto % requiere una cantidad mínima de %',
        v_product.name, v_product.min_quantity using errcode = 'check_violation';
    end if;

    if v_product.track_stock and v_product.stock_quantity < v_quantity then
      raise exception 'Sin stock suficiente de %', v_product.name
        using errcode = 'check_violation';
    end if;

    -- Un producto a cotizar entra al pedido con importe cero: el precio se
    -- acuerda después. No se inventa un número.
    v_unit_price := coalesce(v_product.price_cents, 0);
    v_line_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;

    insert into public.order_items (
      order_id, product_id, product_name, product_slug,
      unit_price_cents, quantity, line_total_cents, sale_mode, options
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.slug,
      v_unit_price, v_quantity, v_line_total, v_product.sale_mode,
      coalesce(v_item -> 'options', '{}'::jsonb)
    );

    if v_product.track_stock then
      update public.products
      set stock_quantity = stock_quantity - v_quantity
      where id = v_product.id;
    end if;
  end loop;

  -- ── Totales ──────────────────────────────────────────────────────────────
  -- Envío y descuento quedan en cero: no hay tarifa validada todavía. Los
  -- ajusta un administrador desde el panel, nunca el comprador.
  update public.orders
  set subtotal_cents = v_subtotal,
      shipping_cents = 0,
      discount_cents = 0,
      total_cents = v_subtotal
  where id = v_order_id;

  -- ── Marcas del cliente ───────────────────────────────────────────────────
  update public.customers
  set first_order_at = coalesce(first_order_at, now()),
      last_order_at = now()
  where id = v_customer_id;

  return query select v_order_id, v_order_number, v_subtotal;
end;
$$;

-- Ejecutable por el visitante anónimo: es la puerta pública del checkout.
revoke all on function public.create_public_order(
  text, text, text, public.fulfillment_mode, text, date, text, text,
  public.payment_method, jsonb
) from public;

grant execute on function public.create_public_order(
  text, text, text, public.fulfillment_mode, text, date, text, text,
  public.payment_method, jsonb
) to anon, authenticated;

-- La secuencia la usa la función, que corre como su dueño: el visitante no
-- necesita permiso directo sobre ella.
revoke all on sequence public.order_number_seq from anon, authenticated;
