'use server'

import { clienteServicio, clienteServidor } from '@/lib/supabase/servidor'
import { PedidoPublico } from '@/server/validacion'
import {
  crearPreferencia,
  mercadoPagoConfigurado,
} from '@/server/pagos/mercadopago'

/**
 * Checkout público.
 *
 * El comprador no tiene sesión. Toda la operación pasa por
 * `create_public_order`, que es la única puerta por la que `anon` puede
 * escribir en `orders`, y que recalcula los importes del lado servidor.
 *
 * Acá no se calcula ningún precio: los datos del formulario se validan y se
 * pasan tal cual. El total que devuelve la función es el que vale.
 */

export interface ResultadoCheckout {
  ok?: boolean
  error?: string
  errores?: Record<string, string>
  numeroPedido?: string
  /** Sólo con Mercado Pago configurado y elegido. */
  urlPago?: string
}

export async function crearPedidoPublico(
  _previo: ResultadoCheckout,
  datos: FormData,
): Promise<ResultadoCheckout> {
  const crudo = {
    customerName: datos.get('nombre'),
    customerPhone: datos.get('telefono'),
    customerEmail: datos.get('email') ?? '',
    fulfillment: datos.get('entrega') ?? 'pickup',
    address: datos.get('direccion') ?? undefined,
    requestedDate: datos.get('fecha') || undefined,
    requestedSlot: datos.get('franja') || undefined,
    comments: datos.get('comentarios') ?? '',
    paymentMethod: datos.get('metodoPago') ?? 'whatsapp',
    items: JSON.parse(String(datos.get('items') ?? '[]')) as unknown,
  }

  const analisis = PedidoPublico.safeParse(crudo)
  if (!analisis.success) {
    const errores: Record<string, string> = {}
    for (const issue of analisis.error.issues) {
      const campo = issue.path.join('.') || 'general'
      errores[campo] ??= issue.message
    }
    return { errores }
  }

  const pedido = analisis.data

  // Si Mercado Pago no está configurado no se acepta ese método: es preferible
  // decirlo antes que crear un pedido que nadie puede pagar.
  if (pedido.paymentMethod === 'mercado_pago' && !mercadoPagoConfigurado()) {
    return {
      error:
        'El pago online todavía no está habilitado. Podés enviar el pedido por WhatsApp.',
    }
  }

  const supabase = await clienteServidor()
  if (!supabase) {
    return { error: 'No se pueden tomar pedidos en este momento.' }
  }

  const { data, error } = await supabase.rpc('create_public_order', {
    p_customer_name: pedido.customerName,
    p_customer_phone: pedido.customerPhone,
    p_customer_email: pedido.customerEmail ?? null,
    p_fulfillment: pedido.fulfillment,
    p_address: pedido.address ?? null,
    p_requested_date: pedido.requestedDate ?? null,
    p_requested_slot: pedido.requestedSlot ?? null,
    p_comments: pedido.comments,
    p_payment_method: pedido.paymentMethod,
    p_items: pedido.items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
  })

  if (error) {
    // Los mensajes de la función son para el comprador; los de Postgres, no.
    const esDeNegocio =
      error.message.includes('disponible') ||
      error.message.includes('stock') ||
      error.message.includes('mínima') ||
      error.message.includes('dirección')
    return { error: esDeNegocio ? error.message : 'No pudimos registrar el pedido.' }
  }

  const creado = Array.isArray(data) ? data[0] : data
  if (!creado) return { error: 'No pudimos registrar el pedido.' }

  // ── Mercado Pago ─────────────────────────────────────────────────────────
  if (pedido.paymentMethod === 'mercado_pago') {
    // Estos dos pasos NO pueden hacerse con el cliente anónimo, y antes se
    // hacían. `order_items` sólo es legible por administradores, así que la
    // lectura devolvía cero líneas —sin error— y la preferencia se armaba
    // vacía; e `insert` en `payments` no tiene política para nadie, así que
    // reventaba con 42501 y el error se descartaba: el pedido quedaba sin
    // fila de pago. Ambas cosas verificadas contra PostgreSQL 16.
    //
    // Van con la clave de servicio, acotadas al pedido que se acaba de crear
    // en esta misma petición. Es servidor puro: nada de esto llega al
    // navegador.
    const servicio = clienteServicio()
    if (!servicio) {
      return {
        ok: true,
        numeroPedido: creado.order_number,
        error:
          'Registramos tu pedido, pero el pago online no está disponible. Coordinamos por WhatsApp.',
      }
    }

    try {
      const { data: lineas, error: errorLineas } = await servicio
        .from('order_items')
        .select('id, product_name, quantity, unit_price_cents')
        .eq('order_id', creado.order_id)

      if (errorLineas) throw new Error('No se pudieron leer las líneas del pedido')
      if (!lineas || lineas.length === 0) {
        throw new Error('El pedido quedó sin líneas')
      }

      const preferencia = await crearPreferencia({
        orderId: creado.order_id,
        orderNumber: creado.order_number,
        emailComprador: pedido.customerEmail ?? null,
        lineas: lineas.map((l) => ({
          id: l.id,
          title: l.product_name,
          quantity: l.quantity,
          unitPriceCents: l.unit_price_cents,
        })),
      })

      // La fila de pago nace pendiente. Sólo el webhook puede aprobarla.
      const { error: errorPago } = await servicio.from('payments').insert({
        order_id: creado.order_id,
        method: 'mercado_pago',
        status: 'pending',
        amount_cents: creado.total_cents,
        provider_preference_id: preferencia.preferenceId,
      })
      if (errorPago) throw new Error('No se pudo registrar el pago pendiente')

      return {
        ok: true,
        numeroPedido: creado.order_number,
        urlPago: preferencia.initPoint,
      }
    } catch {
      // El pedido ya existe y es válido: se deja registrado y se ofrece la
      // alternativa. No se pierde la operación por una falla del proveedor.
      return {
        ok: true,
        numeroPedido: creado.order_number,
        error:
          'Registramos tu pedido, pero no pudimos abrir el pago online. Coordinamos por WhatsApp.',
      }
    }
  }

  return { ok: true, numeroPedido: creado.order_number }
}
