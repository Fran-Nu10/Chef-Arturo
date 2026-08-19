import 'server-only'

import { ticketPromedio } from '@/server/dinero'
import { diaDelNegocio, mesDelNegocio } from '@/server/zona-horaria'
import type { FilaPedido } from '@/lib/supabase/tipos'

/**
 * Reporte financiero básico.
 *
 * No es contabilidad, ni un reporte fiscal, ni una conciliación bancaria: es
 * una lectura operativa de lo que registró este sistema.
 *
 * Las definiciones importan y están en `docs/BACKEND.md`:
 *
 *   · facturación bruta   — suma de los totales de todos los pedidos creados
 *                           en el rango, cancelados incluidos. Mide demanda.
 *   · ingresos aprobados  — suma de los totales de los pedidos cuyo pago está
 *                           aprobado. Es la única cifra que representa dinero.
 *   · pagos pendientes    — totales con pago aún sin resolver.
 *   · reembolsos          — totales con pago reembolsado.
 *   · cancelados          — totales de pedidos cancelados. No son ventas.
 */

export interface Metricas {
  facturacionBrutaCents: number
  ingresosAprobadosCents: number
  pagosPendientesCents: number
  reembolsosCents: number
  canceladosCents: number
  cantidadPedidos: number
  cantidadPedidosPagados: number
  cantidadCancelados: number
  ticketPromedioCents: number
  porMetodoPago: { metodo: string; cantidad: number; totalCents: number }[]
  productosMasVendidos: { nombre: string; unidades: number; totalCents: number }[]
  evolucion: { periodo: string; pedidos: number; ingresosCents: number }[]
}

export const METRICAS_VACIAS: Metricas = {
  facturacionBrutaCents: 0,
  ingresosAprobadosCents: 0,
  pagosPendientesCents: 0,
  reembolsosCents: 0,
  canceladosCents: 0,
  cantidadPedidos: 0,
  cantidadPedidosPagados: 0,
  cantidadCancelados: 0,
  ticketPromedioCents: 0,
  porMetodoPago: [],
  productosMasVendidos: [],
  evolucion: [],
}

/**
 * Agrupa por día si el rango es corto, por mes si es largo.
 *
 * La clave sale de la zona del negocio, no de recortar la cadena ISO. Ver
 * `zona-horaria.ts`: recortarla mandaba al día siguiente todo pedido hecho
 * después de las 21:00 en Florida.
 */
function claveDePeriodo(fecha: string, porMes: boolean): string {
  return porMes ? mesDelNegocio(fecha) : diaDelNegocio(fecha)
}

/**
 * Calcula las métricas a partir de los pedidos y las líneas del rango.
 *
 * Es una función pura para poder probarla sin base de datos.
 */
export function calcularMetricas(
  pedidos: Pick<
    FilaPedido,
    'id' | 'total_cents' | 'status' | 'payment_status' | 'payment_method' | 'created_at'
  >[],
  lineas: { order_id: string; product_name: string; quantity: number; line_total_cents: number }[],
  opciones: { porMes?: boolean } = {},
): Metricas {
  const aprobados = pedidos.filter((p) => p.payment_status === 'approved')
  const cancelados = pedidos.filter((p) => p.status === 'cancelled')

  const sumar = (lista: typeof pedidos) => lista.reduce((s, p) => s + p.total_cents, 0)

  const ingresosAprobadosCents = sumar(aprobados)

  // Método de pago: sólo sobre lo aprobado. Un pedido pendiente todavía no
  // eligió realmente por dónde entró el dinero.
  const porMetodo = new Map<string, { cantidad: number; totalCents: number }>()
  for (const p of aprobados) {
    const clave = p.payment_method ?? 'sin_definir'
    const actual = porMetodo.get(clave) ?? { cantidad: 0, totalCents: 0 }
    actual.cantidad += 1
    actual.totalCents += p.total_cents
    porMetodo.set(clave, actual)
  }

  // Productos más vendidos: se cuentan las líneas de pedidos no cancelados.
  const idsNoCancelados = new Set(
    pedidos.filter((p) => p.status !== 'cancelled').map((p) => p.id),
  )
  const porProducto = new Map<string, { unidades: number; totalCents: number }>()
  for (const l of lineas) {
    if (!idsNoCancelados.has(l.order_id)) continue
    const actual = porProducto.get(l.product_name) ?? { unidades: 0, totalCents: 0 }
    actual.unidades += l.quantity
    actual.totalCents += l.line_total_cents
    porProducto.set(l.product_name, actual)
  }

  const porPeriodo = new Map<string, { pedidos: number; ingresosCents: number }>()
  for (const p of pedidos) {
    const clave = claveDePeriodo(p.created_at, opciones.porMes ?? false)
    const actual = porPeriodo.get(clave) ?? { pedidos: 0, ingresosCents: 0 }
    actual.pedidos += 1
    if (p.payment_status === 'approved') actual.ingresosCents += p.total_cents
    porPeriodo.set(clave, actual)
  }

  return {
    facturacionBrutaCents: sumar(pedidos),
    ingresosAprobadosCents,
    pagosPendientesCents: sumar(pedidos.filter((p) => p.payment_status === 'pending')),
    reembolsosCents: sumar(pedidos.filter((p) => p.payment_status === 'refunded')),
    canceladosCents: sumar(cancelados),
    cantidadPedidos: pedidos.length,
    cantidadPedidosPagados: aprobados.length,
    cantidadCancelados: cancelados.length,
    ticketPromedioCents: ticketPromedio(ingresosAprobadosCents, aprobados.length),
    porMetodoPago: [...porMetodo.entries()]
      .map(([metodo, v]) => ({ metodo, ...v }))
      .sort((a, b) => b.totalCents - a.totalCents),
    productosMasVendidos: [...porProducto.entries()]
      .map(([nombre, v]) => ({ nombre, ...v }))
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 10),
    evolucion: [...porPeriodo.entries()]
      .map(([periodo, v]) => ({ periodo, ...v }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo)),
  }
}
