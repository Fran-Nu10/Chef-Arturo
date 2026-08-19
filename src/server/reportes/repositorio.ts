import 'server-only'

import { modoDemo } from '@/lib/supabase/env'
import { metricasDelRangoDemo, resumenPanelDemo } from '@/server/demo/consultas'
import { hoyDelNegocio, finDelDiaUtc, inicioDelDiaUtc, inicioDelMesUtc } from '@/server/zona-horaria'
import { clienteServidor } from '@/lib/supabase/servidor'
import { ticketPromedio } from '@/server/dinero'
import { METRICAS_VACIAS, calcularMetricas } from './calculo'
import type { Metricas } from './calculo'
import type { FilaPedido } from '@/lib/supabase/tipos'

/**
 * El cálculo puro vive en `calculo.ts` y se reexporta desde acá.
 *
 * Se separó porque las consultas del modo demostración necesitan
 * `calcularMetricas` —para que la presentación muestre números calculados con
 * el código de producción— y este módulo necesita las consultas demo. Dejarlo
 * todo junto creaba un ciclo de importación entre los dos archivos.
 */
export { METRICAS_VACIAS, calcularMetricas } from './calculo'
export type { Metricas } from './calculo'

export async function metricasDelRango(desde: string, hasta: string): Promise<Metricas | null> {
  if (modoDemo()) return metricasDelRangoDemo(desde, hasta)

  const supabase = await clienteServidor()
  if (!supabase) return null

  // Los límites del rango son los del día en Florida, no los de UTC. `desde`
  // y `hasta` llegan como `YYYY-MM-DD` desde dos <input type="date">.
  const inicio = inicioDelDiaUtc(desde)
  const fin = finDelDiaUtc(hasta)

  const { data: pedidos, error } = await supabase
    .from('orders')
    .select('id, total_cents, status, payment_status, payment_method, created_at')
    .gte('created_at', inicio)
    .lt('created_at', fin)

  if (error) throw error
  if (!pedidos || pedidos.length === 0) return METRICAS_VACIAS

  const { data: lineas } = await supabase
    .from('order_items')
    .select('order_id, product_name, quantity, line_total_cents')
    .in(
      'order_id',
      pedidos.map((p) => p.id),
    )

  const dias =
    (new Date(hasta).getTime() - new Date(desde).getTime()) / (1000 * 60 * 60 * 24)

  return calcularMetricas(pedidos, lineas ?? [], { porMes: dias > 92 })
}

// ── Resumen del panel ───────────────────────────────────────────────────────

export interface ResumenPanel {
  pedidosPendientes: number
  pedidosDeHoy: number
  ventasAprobadasCents: number
  ticketPromedioCents: number
  ultimosPedidos: (FilaPedido & { customers: { name: string } | null })[]
}

export async function resumenPanel(): Promise<ResumenPanel | null> {
  if (modoDemo()) return resumenPanelDemo()

  const supabase = await clienteServidor()
  if (!supabase) return null

  // Antes se usaba `new Date(a, m, d)`, que toma la zona del **servidor**. En
  // un host en UTC, "hoy" empezaba a las 21:00 del día anterior en Florida.
  const inicioHoy = inicioDelDiaUtc(hoyDelNegocio())
  const inicioMes = inicioDelMesUtc()

  const [pendientes, deHoy, delMes, ultimos] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', inicioHoy),
    supabase
      .from('orders')
      .select('total_cents')
      .eq('payment_status', 'approved')
      .gte('created_at', inicioMes),
    supabase
      .from('orders')
      .select('*, customers(name)')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const aprobados = delMes.data ?? []
  const ventas = aprobados.reduce((s, p) => s + p.total_cents, 0)

  return {
    pedidosPendientes: pendientes.count ?? 0,
    pedidosDeHoy: deHoy.count ?? 0,
    ventasAprobadasCents: ventas,
    ticketPromedioCents: ticketPromedio(ventas, aprobados.length),
    ultimosPedidos: (ultimos.data ?? []) as unknown as ResumenPanel['ultimosPedidos'],
  }
}
