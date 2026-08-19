import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { entornoPublico } from '@/lib/supabase/env'

/**
 * Mercado Pago · Checkout Pro.
 *
 * Todo lo de este archivo corre en el servidor. El access token no sale nunca
 * de acá: el navegador sólo recibe el `init_point` de la preferencia.
 *
 * Sin credenciales la aplicación compila y funciona; el checkout online se
 * muestra como "pendiente de configuración" y queda WhatsApp como alternativa.
 * Nunca se simula un pago aprobado.
 */

export type ModoMercadoPago = 'deshabilitado' | 'prueba' | 'produccion'

const API = 'https://api.mercadopago.com'

/**
 * Cuánto se acepta de desfase entre el `ts` firmado y el reloj propio.
 *
 * Generoso a propósito: cubre reintentos del proveedor y relojes desalineados
 * sin dejar la ventana abierta para siempre.
 */
export const TOLERANCIA_FIRMA_SEGUNDOS = 15 * 60

function accessToken(): string | null {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN || null
}

function secretoWebhook(): string | null {
  return process.env.MERCADO_PAGO_WEBHOOK_SECRET || null
}

/**
 * Modo actual.
 *
 * Mercado Pago distingue credenciales de prueba por el prefijo `TEST-`. Saber
 * en qué modo se está evita el peor error posible: creer que se está cobrando
 * de verdad cuando se está en sandbox.
 */
export function modoMercadoPago(): ModoMercadoPago {
  const token = accessToken()
  if (!token) return 'deshabilitado'
  return token.startsWith('TEST-') ? 'prueba' : 'produccion'
}

export function mercadoPagoConfigurado(): boolean {
  return modoMercadoPago() !== 'deshabilitado'
}

/** Qué falta para habilitarlo. Sólo nombres de variables, nunca valores. */
export function faltantesDeMercadoPago(): string[] {
  const faltan: string[] = []
  if (!accessToken()) faltan.push('MERCADO_PAGO_ACCESS_TOKEN')
  if (!secretoWebhook()) faltan.push('MERCADO_PAGO_WEBHOOK_SECRET')
  return faltan
}

export interface LineaPreferencia {
  id: string
  title: string
  quantity: number
  unitPriceCents: number
}

export interface PreferenciaCreada {
  preferenceId: string
  initPoint: string
  sandboxInitPoint: string | null
}

/**
 * Crea la preferencia de un pedido.
 *
 * `external_reference` es el id interno del pedido: es lo que ata la
 * notificación del webhook con nuestra fila. `X-Idempotency-Key` evita que un
 * reintento de red genere dos preferencias para el mismo pedido.
 *
 * Los importes llegan ya calculados por la base — esta función no los deriva
 * de nada que venga del navegador.
 */
export async function crearPreferencia(parametros: {
  orderId: string
  orderNumber: string
  lineas: LineaPreferencia[]
  emailComprador?: string | null
}): Promise<PreferenciaCreada> {
  const token = accessToken()
  if (!token) throw new Error('Mercado Pago no está configurado')

  const cuerpo = {
    items: parametros.lineas.map((l) => ({
      id: l.id,
      title: l.title.slice(0, 250),
      quantity: l.quantity,
      currency_id: 'UYU',
      unit_price: l.unitPriceCents / 100,
    })),
    payer: parametros.emailComprador ? { email: parametros.emailComprador } : undefined,
    external_reference: parametros.orderId,
    back_urls: {
      success: `${entornoPublico.siteUrl}/pedido/confirmado?ref=${parametros.orderNumber}`,
      pending: `${entornoPublico.siteUrl}/pedido/pendiente?ref=${parametros.orderNumber}`,
      failure: `${entornoPublico.siteUrl}/pedido/error?ref=${parametros.orderNumber}`,
    },
    auto_return: 'approved',
    notification_url: `${entornoPublico.siteUrl}/api/pagos/mercadopago/webhook`,
    statement_descriptor: 'CHEF ARTURO',
  }

  const respuesta = await fetch(`${API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      // Una preferencia por pedido, aunque el POST se reintente.
      'X-Idempotency-Key': `pedido-${parametros.orderId}`,
    },
    body: JSON.stringify(cuerpo),
  })

  if (!respuesta.ok) {
    const detalle = await respuesta.text()
    throw new Error(`Mercado Pago rechazó la preferencia (${respuesta.status}): ${detalle}`)
  }

  const datos = (await respuesta.json()) as {
    id: string
    init_point: string
    sandbox_init_point?: string
  }

  return {
    preferenceId: datos.id,
    initPoint: datos.init_point,
    sandboxInitPoint: datos.sandbox_init_point ?? null,
  }
}

/**
 * Consulta un pago en el proveedor.
 *
 * El webhook nunca cree lo que le mandan: sólo trae un id, y el estado real se
 * pregunta acá. Una notificación falsificada no puede aprobar nada porque el
 * estado sale de esta llamada autenticada.
 */
export async function consultarPago(paymentId: string): Promise<{
  id: string
  status: string
  statusDetail: string | null
  externalReference: string | null
  amountCents: number
  paymentMethodId: string | null
} | null> {
  const token = accessToken()
  if (!token) throw new Error('Mercado Pago no está configurado')

  const respuesta = await fetch(`${API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (respuesta.status === 404) return null
  if (!respuesta.ok) {
    throw new Error(`No se pudo consultar el pago ${paymentId} (${respuesta.status})`)
  }

  const p = (await respuesta.json()) as {
    id: number | string
    status: string
    status_detail?: string
    external_reference?: string
    transaction_amount?: number
    payment_method_id?: string
  }

  return {
    id: String(p.id),
    status: p.status,
    statusDetail: p.status_detail ?? null,
    externalReference: p.external_reference ?? null,
    amountCents: Math.round((p.transaction_amount ?? 0) * 100),
    paymentMethodId: p.payment_method_id ?? null,
  }
}

/**
 * Verifica la firma del webhook.
 *
 * Mercado Pago manda `x-signature: ts=…,v1=…` y `x-request-id`. El manifiesto
 * que se firma es `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`.
 *
 * La comparación es en tiempo constante: un `===` filtra información por el
 * tiempo que tarda en fallar.
 */
export function verificarFirmaWebhook(parametros: {
  signature: string | null
  requestId: string | null
  dataId: string | null
}): { valida: boolean; motivo?: string } {
  const secreto = secretoWebhook()
  if (!secreto) return { valida: false, motivo: 'Falta MERCADO_PAGO_WEBHOOK_SECRET' }
  if (!parametros.signature) return { valida: false, motivo: 'Falta la cabecera x-signature' }
  if (!parametros.dataId) return { valida: false, motivo: 'Falta data.id' }

  const partes = new Map(
    parametros.signature.split(',').map((trozo) => {
      const [clave, ...resto] = trozo.split('=')
      return [clave.trim(), resto.join('=').trim()] as const
    }),
  )

  const ts = partes.get('ts')
  const v1 = partes.get('v1')
  if (!ts || !v1) return { valida: false, motivo: 'Firma con formato inesperado' }

  // Ventana de frescura. Sin esto, una notificación válida capturada una vez
  // sirve para siempre: la idempotencia por `event_key` limita el daño, pero
  // no es una defensa contra reenvío. Mercado Pago manda `ts` en segundos.
  const segundos = Number(ts)
  if (!Number.isFinite(segundos)) return { valida: false, motivo: 'Firma con ts inválido' }
  const antiguedad = Math.abs(Date.now() / 1000 - segundos)
  if (antiguedad > TOLERANCIA_FIRMA_SEGUNDOS) {
    return { valida: false, motivo: 'Firma vencida' }
  }

  const manifiesto = `id:${parametros.dataId};request-id:${parametros.requestId ?? ''};ts:${ts};`
  const esperado = createHmac('sha256', secreto).update(manifiesto).digest('hex')

  const a = Buffer.from(esperado, 'hex')
  const b = Buffer.from(v1, 'hex')
  if (a.length !== b.length) return { valida: false, motivo: 'Firma inválida' }
  if (!timingSafeEqual(a, b)) return { valida: false, motivo: 'Firma inválida' }

  return { valida: true }
}

/** Traduce el estado del proveedor al nuestro. Lo que no se reconoce, pendiente. */
export function traducirEstadoPago(
  estado: string,
): 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' {
  switch (estado) {
    case 'approved':
    case 'authorized':
      return 'approved'
    case 'rejected':
      return 'rejected'
    case 'cancelled':
      return 'cancelled'
    case 'refunded':
    case 'charged_back':
      return 'refunded'
    case 'pending':
    case 'in_process':
    case 'in_mediation':
    default:
      return 'pending'
  }
}
