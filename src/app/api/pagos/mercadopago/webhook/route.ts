import { NextResponse, type NextRequest } from 'next/server'
import { clienteServicio } from '@/lib/supabase/servidor'
import {
  consultarPago,
  mercadoPagoConfigurado,
  traducirEstadoPago,
  verificarFirmaWebhook,
} from '@/server/pagos/mercadopago'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Webhook de Mercado Pago.
 *
 * El orden importa y es deliberado:
 *
 *   1. Verificar la firma. Sin eso, cualquiera aprueba pedidos con un POST.
 *   2. Registrar el evento con clave única. Si ya existía, se responde 200 y
 *      se corta: Mercado Pago reintenta la misma notificación varias veces y
 *      no puede provocar efectos repetidos.
 *   3. Consultar el pago al proveedor. Nunca se cree el cuerpo recibido: sólo
 *      se toma el id, y el estado se pregunta con una llamada autenticada.
 *   4. Recién ahí actualizar el estado local.
 *
 * Se responde 200 incluso ante errores propios ya registrados, para que el
 * proveedor no entre en un ciclo de reintentos por una falla nuestra. Los
 * casos irrecuperables quedan en `payment_events.error`.
 */
export async function POST(request: NextRequest) {
  if (!mercadoPagoConfigurado()) {
    return NextResponse.json({ error: 'Mercado Pago no configurado' }, { status: 503 })
  }

  const supabase = clienteServicio()
  if (!supabase) {
    return NextResponse.json({ error: 'Backend no configurado' }, { status: 503 })
  }

  let cuerpo: { type?: string; action?: string; data?: { id?: string } }
  try {
    cuerpo = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const dataId = cuerpo.data?.id ? String(cuerpo.data.id) : request.nextUrl.searchParams.get('data.id')

  // ── 1 · Firma ────────────────────────────────────────────────────────────
  const firma = verificarFirmaWebhook({
    signature: request.headers.get('x-signature'),
    requestId: request.headers.get('x-request-id'),
    dataId,
  })
  if (!firma.valida) {
    // No se registra el evento: un atacante no debe poder llenar la tabla.
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  const tipo = cuerpo.type ?? cuerpo.action ?? 'desconocido'
  if (!dataId) {
    return NextResponse.json({ error: 'Falta data.id' }, { status: 400 })
  }

  // Sólo interesan las notificaciones de pago.
  if (!tipo.startsWith('payment')) {
    return NextResponse.json({ recibido: true, ignorado: tipo })
  }

  // ── 2 · Idempotencia ─────────────────────────────────────────────────────
  // La unicidad de (provider, event_key) es la que garantiza el "una sola vez".
  const { error: errorEvento } = await supabase.from('payment_events').insert({
    provider: 'mercado_pago',
    event_key: dataId,
    event_type: tipo,
    payload: cuerpo as Record<string, unknown>,
  })

  if (errorEvento) {
    if (errorEvento.code === '23505') {
      return NextResponse.json({ recibido: true, duplicado: true })
    }
    return NextResponse.json({ error: 'No se pudo registrar el evento' }, { status: 500 })
  }

  const registrarFallo = async (mensaje: string) => {
    await supabase
      .from('payment_events')
      .update({ error: mensaje, processed_at: new Date().toISOString() })
      .eq('provider', 'mercado_pago')
      .eq('event_key', dataId)
  }

  try {
    // ── 3 · Consultar al proveedor ─────────────────────────────────────────
    const pago = await consultarPago(dataId)
    if (!pago) {
      await registrarFallo('El pago no existe en Mercado Pago')
      return NextResponse.json({ recibido: true, desconocido: true })
    }

    const orderId = pago.externalReference
    if (!orderId) {
      await registrarFallo('El pago no trae external_reference')
      return NextResponse.json({ recibido: true, sinReferencia: true })
    }

    const { data: pedido } = await supabase
      .from('orders')
      .select('id, total_cents, status')
      .eq('id', orderId)
      .maybeSingle()

    if (!pedido) {
      await registrarFallo(`No existe el pedido ${orderId}`)
      return NextResponse.json({ recibido: true, pedidoInexistente: true })
    }

    const estado = traducirEstadoPago(pago.status)

    // El importe cobrado tiene que coincidir con el del pedido. Si no, se
    // registra y no se aprueba: es la señal de una preferencia manipulada.
    if (estado === 'approved' && pago.amountCents !== pedido.total_cents) {
      await registrarFallo(
        `Importe distinto: pedido ${pedido.total_cents}, pago ${pago.amountCents}`,
      )
      return NextResponse.json({ recibido: true, importeDistinto: true })
    }

    // ── 4 · Actualizar ─────────────────────────────────────────────────────
    await supabase
      .from('payments')
      .upsert(
        {
          order_id: pedido.id,
          method: 'mercado_pago' as const,
          status: estado,
          amount_cents: pago.amountCents,
          provider_payment_id: pago.id,
          provider_payload: {
            status: pago.status,
            status_detail: pago.statusDetail,
            payment_method_id: pago.paymentMethodId,
          },
        },
        { onConflict: 'provider_payment_id' },
      )

    // El pago aprobado confirma el pedido, pero sólo si seguía pendiente: no
    // se pisa un pedido que un humano ya movió o canceló.
    await supabase
      .from('orders')
      .update(
        estado === 'approved' && pedido.status === 'pending'
          ? { payment_status: estado, status: 'confirmed' as const }
          : { payment_status: estado },
      )
      .eq('id', pedido.id)

    await supabase
      .from('payment_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('provider', 'mercado_pago')
      .eq('event_key', dataId)

    return NextResponse.json({ recibido: true, estado })
  } catch (error) {
    await registrarFallo(error instanceof Error ? error.message : 'Error desconocido')
    // 200 a propósito: el evento quedó registrado con su error y un reintento
    // del proveedor no lo arreglaría.
    return NextResponse.json({ recibido: true, error: true })
  }
}

/** Mercado Pago pinga la URL antes de habilitarla. */
export async function GET() {
  return NextResponse.json({ ok: true, servicio: 'webhook mercado pago' })
}
