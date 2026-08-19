'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { clienteServidor } from '@/lib/supabase/servidor'
import { exigirAdmin } from '@/server/autorizacion'
import { EstadoPedido, Uuid, transicionPermitida } from '@/server/validacion'
import { confirmarEscritura } from '@/server/resultados'
import type { Resultado } from '@/server/resultados'

const NO_ALCANZO =
  'No se guardó: el registro no existe o tu usuario no tiene permiso para modificarlo.'

/**
 * Acciones sobre pedidos.
 *
 * El importe no se toca desde acá salvo por un administrador que ajusta envío
 * o descuento explícitamente, y aun así el total se recalcula en el servidor a
 * partir de las líneas guardadas: nunca se acepta un total que venga del
 * formulario.
 */

const CambioEstado = z.object({
  orderId: Uuid,
  nuevoEstado: EstadoPedido,
  nota: z.string().trim().max(500).default(''),
  /** El operador confirmó una transición fuera del flujo previsto. */
  forzar: z.boolean().default(false),
})

export async function cambiarEstadoPedido(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  await exigirAdmin()

  const analisis = CambioEstado.safeParse({
    orderId: datos.get('orderId'),
    nuevoEstado: datos.get('nuevoEstado'),
    nota: datos.get('nota') ?? '',
    forzar: datos.get('forzar') === 'on',
  })
  if (!analisis.success) return { error: 'Datos de cambio de estado inválidos.' }

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const { data: actual } = await supabase
    .from('orders')
    .select('status')
    .eq('id', analisis.data.orderId)
    .maybeSingle()

  if (!actual) return { error: 'El pedido no existe o no tenés acceso.' }

  const permitida = transicionPermitida(actual.status, analisis.data.nuevoEstado)
  if (!permitida && !analisis.data.forzar) {
    return {
      error: `Pasar de "${actual.status}" a "${analisis.data.nuevoEstado}" no sigue el flujo previsto. Confirmá que querés forzarlo.`,
    }
  }

  // El stock que se descontó al crear el pedido lo devuelve un trigger de la
  // base cuando el estado pasa a cancelado. No se hace acá para que valga por
  // cualquier camino, no sólo por el panel.
  const resultado = await confirmarEscritura(
    supabase
      .from('orders')
      .update({
        status: analisis.data.nuevoEstado,
        ...(analisis.data.nuevoEstado === 'cancelled'
          ? { cancelled_at: new Date().toISOString() }
          : {}),
      })
      .eq('id', analisis.data.orderId)
      .select('id'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado

  // El trigger deja el registro automático; la nota se agrega aparte para no
  // perder el motivo que escribió el operador.
  if (analisis.data.nota) {
    const { error: errorNota } = await supabase.from('order_status_history').insert({
      order_id: analisis.data.orderId,
      from_status: actual.status,
      to_status: analisis.data.nuevoEstado,
      note: analisis.data.nota,
    })
    // El estado ya cambió: no se revierte por la nota, pero tampoco se calla.
    if (errorNota) {
      return { ok: true, error: 'El estado cambió, pero la nota no se pudo guardar.' }
    }
  }

  revalidatePath('/admin/pedidos')
  revalidatePath(`/admin/pedidos/${analisis.data.orderId}`)
  return { ok: true }
}

export async function guardarNotaInterna(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  await exigirAdmin()

  const id = Uuid.safeParse(datos.get('orderId'))
  const nota = z.string().max(4000).safeParse(datos.get('internalNotes') ?? '')
  if (!id.success || !nota.success) return { error: 'Datos inválidos.' }

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const resultado = await confirmarEscritura(
    supabase.from('orders').update({ internal_notes: nota.data }).eq('id', id.data).select('id'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado
  revalidatePath(`/admin/pedidos/${id.data}`)
  return resultado
}

/**
 * Ajuste de envío y descuento por un administrador.
 *
 * El total se recalcula desde las líneas guardadas en la base. El formulario
 * no puede mandar un total: sólo los dos conceptos que un humano decide.
 */
const Ajuste = z.object({
  orderId: Uuid,
  envioPesos: z.coerce.number().min(0).max(999999),
  descuentoPesos: z.coerce.number().min(0).max(999999),
})

export async function ajustarImportes(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  await exigirAdmin()

  const analisis = Ajuste.safeParse({
    orderId: datos.get('orderId'),
    envioPesos: datos.get('envio') ?? 0,
    descuentoPesos: datos.get('descuento') ?? 0,
  })
  if (!analisis.success) return { error: 'Importes inválidos.' }

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  // Si esta lectura falla no se puede seguir: `lineas ?? []` daba subtotal 0 y
  // dejaba el pedido en cero sin avisar.
  const { data: lineas, error: errorLineas } = await supabase
    .from('order_items')
    .select('line_total_cents')
    .eq('order_id', analisis.data.orderId)

  if (errorLineas) return { error: 'No se pudieron leer las líneas del pedido.' }
  if (!lineas || lineas.length === 0) {
    return { error: 'El pedido no tiene líneas: no se puede recalcular el total.' }
  }

  const subtotal = lineas.reduce((s, l) => s + l.line_total_cents, 0)
  const envio = Math.round(analisis.data.envioPesos * 100)
  const descuento = Math.min(Math.round(analisis.data.descuentoPesos * 100), subtotal + envio)

  const resultado = await confirmarEscritura(
    supabase
      .from('orders')
      .update({
        subtotal_cents: subtotal,
        shipping_cents: envio,
        discount_cents: descuento,
        total_cents: subtotal + envio - descuento,
      })
      .eq('id', analisis.data.orderId)
      .select('id'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado
  revalidatePath(`/admin/pedidos/${analisis.data.orderId}`)
  return resultado
}

/**
 * Registro manual de coordinación por WhatsApp.
 *
 * Deja constancia de que un humano habló con el cliente. **No** marca el pago
 * como aprobado: eso sólo puede venir del proveedor a través del webhook.
 */
export async function registrarCoordinacionWhatsapp(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const sesion = await exigirAdmin()

  const id = Uuid.safeParse(datos.get('orderId'))
  const detalle = z.string().trim().min(1).max(1000).safeParse(datos.get('detalle'))
  if (!id.success || !detalle.success) return { error: 'Contanos qué se coordinó.' }

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const { data: pedido } = await supabase
    .from('orders')
    .select('status, internal_notes')
    .eq('id', id.data)
    .maybeSingle()

  if (!pedido) return { error: 'El pedido no existe o no tenés acceso.' }

  const sello = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const linea = `[${sello}] WhatsApp · ${sesion.email}: ${detalle.data}`
  const notas = pedido.internal_notes ? `${pedido.internal_notes}\n${linea}` : linea

  const resultado = await confirmarEscritura(
    supabase.from('orders').update({ internal_notes: notas }).eq('id', id.data).select('id'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado

  const { error: errorHistorial } = await supabase.from('order_status_history').insert({
    order_id: id.data,
    from_status: pedido.status,
    to_status: pedido.status,
    note: `Coordinación por WhatsApp: ${detalle.data}`,
  })
  if (errorHistorial) {
    return { ok: true, error: 'Se guardó la nota, pero no quedó en el historial.' }
  }

  revalidatePath(`/admin/pedidos/${id.data}`)
  return resultado
}

export async function guardarNotaCliente(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  await exigirAdmin()

  const id = Uuid.safeParse(datos.get('customerId'))
  const nota = z.string().max(4000).safeParse(datos.get('internalNotes') ?? '')
  if (!id.success || !nota.success) return { error: 'Datos inválidos.' }

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const resultado = await confirmarEscritura(
    supabase.from('customers').update({ internal_notes: nota.data }).eq('id', id.data).select('id'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado
  revalidatePath(`/admin/clientes/${id.data}`)
  return resultado
}

/** Mensaje de WhatsApp preparado. No inventa importes ni plazos. */
export async function enlaceWhatsapp(
  telefono: string,
  numeroPedido: string,
): Promise<string> {
  const digitos = telefono.replace(/[^0-9]/g, '')
  const texto = `Hola, te escribimos de Chef Arturo por tu pedido ${numeroPedido}.`
  return `https://wa.me/${digitos}?text=${encodeURIComponent(texto)}`
}
