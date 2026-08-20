import 'server-only'

import {
  CATEGORIAS_DEMO,
  CLIENTES_DEMO,
  HISTORIAL_DEMO,
  LINEAS_DEMO,
  MEDIOS_DEMO,
  PEDIDOS_DEMO,
  PRODUCTOS_DEMO,
  SECCIONES_DEMO,
  coincide,
} from './datos'
import { calcularMetricas, type Metricas } from '@/server/reportes/calculo'
import type { ResumenPanel } from '@/server/reportes/repositorio'
import { ticketPromedio } from '@/server/dinero'
import { diaDelNegocio, hoyDelNegocio, mesDelNegocio } from '@/server/zona-horaria'
import type { FilaProducto } from '@/lib/supabase/tipos'

/**
 * Las mismas consultas del panel, resueltas en memoria.
 *
 * Cada función devuelve exactamente la forma que devuelve su equivalente real,
 * para que las páginas no tengan que saber en qué modo están. Los filtros, el
 * orden y la paginación se replican de verdad: si en la demostración se busca
 * o se pagina, funciona.
 *
 * Los reportes reutilizan `calcularMetricas`, que es la misma función que usa
 * el modo real. Así lo que se muestra en la presentación se calcula con el
 * código de producción y no con números escritos a mano.
 */

const categoriaDe = (p: FilaProducto) => {
  const c = CATEGORIAS_DEMO.find((x) => x.id === p.category_id)
  return c ? { name: c.name, slug: c.slug } : null
}

// ── Catálogo ────────────────────────────────────────────────────────────────

export function listarProductosAdminDemo(filtros: {
  estado?: string
  categoriaId?: string
  busqueda?: string
  orden?: string
  pagina?: number
  porPagina?: number
}) {
  let lista = [...PRODUCTOS_DEMO]

  if (filtros.estado) lista = lista.filter((p) => p.status === filtros.estado)
  if (filtros.categoriaId) lista = lista.filter((p) => p.category_id === filtros.categoriaId)
  if (filtros.busqueda) {
    const t = filtros.busqueda.trim()
    lista = lista.filter((p) => coincide(p.name, t) || coincide(p.slug, t))
  }

  lista.sort((a, b) => {
    if (filtros.orden === 'name') return a.name.localeCompare(b.name, 'es')
    if (filtros.orden === 'created_at') return b.created_at.localeCompare(a.created_at)
    if (filtros.orden === 'stock') return a.stock_quantity - b.stock_quantity
    return a.position - b.position
  })

  const porPagina = Math.min(filtros.porPagina ?? 25, 100)
  const pagina = Math.max(filtros.pagina ?? 1, 1)
  const desde = (pagina - 1) * porPagina

  return {
    productos: lista
      .slice(desde, desde + porPagina)
      // Sin relaciones producto→imagen en la demostración: miniatura vacía.
      .map((p) => ({ ...p, categories: categoriaDe(p), imagen: null })),
    total: lista.length,
    pagina,
    porPagina,
  }
}

export function listarProductosParaOrdenarDemo() {
  return PRODUCTOS_DEMO.filter((p) => p.status !== 'archived')
    .sort((a, b) => a.position - b.position)
    .map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      status: p.status as 'draft' | 'active',
      category_id: p.category_id,
      imagen: null,
    }))
}

export function productosConStockBajoDemo() {
  return PRODUCTOS_DEMO.filter(
    (p) =>
      p.track_stock && p.status === 'active' && p.stock_quantity <= p.low_stock_threshold,
  )
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      stock_quantity: p.stock_quantity,
      low_stock_threshold: p.low_stock_threshold,
    }))
    .sort((a, b) => a.stock_quantity - b.stock_quantity)
}

export function listarCategoriasAdminDemo() {
  return [...CATEGORIAS_DEMO].sort((a, b) => a.position - b.position)
}

export function listarCategoriasConDetalleDemo() {
  return [...CATEGORIAS_DEMO]
    .sort((a, b) => a.position - b.position)
    .map((c) => ({
      ...c,
      imagen: MEDIOS_DEMO.find((m) => m.id === c.image_id)?.path ?? null,
      cantidadProductos: PRODUCTOS_DEMO.filter(
        (p) => p.category_id === c.id && p.status !== 'archived',
      ).length,
    }))
}

export function categoriaPorIdDemo(id: string) {
  const c = CATEGORIAS_DEMO.find((x) => x.id === id)
  if (!c) return null
  const medio = MEDIOS_DEMO.find((m) => m.id === c.image_id)
  return { ...c, media_assets: medio ? { path: medio.path } : null }
}

export function productoPorIdDemo(id: string) {
  const p = PRODUCTOS_DEMO.find((x) => x.id === id)
  if (!p) return null
  return { ...p, product_images: [] }
}

// ── Pedidos ─────────────────────────────────────────────────────────────────

export function listarPedidosDemo(filtros: {
  estado?: string
  estadoPago?: string
  busqueda?: string
  desde?: string
  hasta?: string
  pagina?: number
  porPagina?: number
}) {
  let lista = [...PEDIDOS_DEMO]

  if (filtros.estado) lista = lista.filter((p) => p.status === filtros.estado)
  if (filtros.estadoPago) lista = lista.filter((p) => p.payment_status === filtros.estadoPago)
  if (filtros.desde) lista = lista.filter((p) => diaDelNegocio(p.created_at) >= filtros.desde!)
  if (filtros.hasta) lista = lista.filter((p) => diaDelNegocio(p.created_at) <= filtros.hasta!)

  if (filtros.busqueda) {
    const t = filtros.busqueda.trim()
    const digitos = t.replace(/[^0-9]/g, '')
    lista = lista.filter((p) => {
      if (coincide(p.order_number, t)) return true
      const c = CLIENTES_DEMO.find((x) => x.id === p.customer_id)
      if (!c) return false
      if (coincide(c.name, t)) return true
      return digitos.length >= 4 && c.phone.includes(digitos)
    })
  }

  lista.sort((a, b) => b.created_at.localeCompare(a.created_at))

  const porPagina = Math.min(filtros.porPagina ?? 25, 100)
  const pagina = Math.max(filtros.pagina ?? 1, 1)
  const desde = (pagina - 1) * porPagina

  return {
    pedidos: lista.slice(desde, desde + porPagina).map((p) => {
      const c = CLIENTES_DEMO.find((x) => x.id === p.customer_id)
      return {
        ...p,
        customers: c ? { id: c.id, name: c.name, phone: c.phone, email: c.email } : null,
      }
    }),
    total: lista.length,
    pagina,
    porPagina,
  }
}

export function pedidoPorIdDemo(id: string) {
  const pedido = PEDIDOS_DEMO.find((p) => p.id === id)
  if (!pedido) return null
  return {
    pedido,
    cliente: CLIENTES_DEMO.find((c) => c.id === pedido.customer_id) ?? null,
    lineas: LINEAS_DEMO.filter((l) => l.order_id === id),
    historial: HISTORIAL_DEMO.filter((h) => h.order_id === id),
    // Sin pagos: en demostración no hay proveedor conectado y no se finge uno.
    pagos: [],
  }
}

// ── Clientes ────────────────────────────────────────────────────────────────

export function listarClientesDemo(busqueda?: string) {
  let lista = [...CLIENTES_DEMO]
  if (busqueda) {
    const t = busqueda.trim()
    const digitos = t.replace(/[^0-9]/g, '')
    lista = lista.filter(
      (c) =>
        coincide(c.name, t) ||
        coincide(c.email ?? '', t) ||
        (digitos.length >= 3 && c.phone.includes(digitos)),
    )
  }
  return lista.sort((a, b) => (b.last_order_at ?? '').localeCompare(a.last_order_at ?? ''))
}

export function fichaClienteDemo(id: string) {
  const cliente = CLIENTES_DEMO.find((c) => c.id === id)
  if (!cliente) return null

  const pedidos = PEDIDOS_DEMO.filter((p) => p.customer_id === id).sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )
  const pagados = pedidos.filter((p) => p.payment_status === 'approved')
  const totalGastadoCents = pagados.reduce((s, p) => s + p.total_cents, 0)

  return {
    cliente,
    pedidos,
    totalGastadoCents,
    ticketPromedioCents: ticketPromedio(totalGastadoCents, pagados.length),
    pedidosPagados: pagados.length,
  }
}

// ── Contenido ───────────────────────────────────────────────────────────────

export function todasLasSeccionesDemo() {
  return [...SECCIONES_DEMO].sort((a, b) => a.position - b.position)
}

export function seccionPorClaveDemo(clave: string) {
  return SECCIONES_DEMO.find((s) => s.key === clave) ?? null
}

export function listarMediosDemo() {
  return [...MEDIOS_DEMO].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

// ── Reportes ────────────────────────────────────────────────────────────────

export function metricasDelRangoDemo(desde: string, hasta: string): Metricas {
  const pedidos = PEDIDOS_DEMO.filter((p) => {
    const dia = diaDelNegocio(p.created_at)
    return dia >= desde && dia <= hasta
  })
  const ids = new Set(pedidos.map((p) => p.id))
  const lineas = LINEAS_DEMO.filter((l) => ids.has(l.order_id))

  const dias =
    (new Date(hasta).getTime() - new Date(desde).getTime()) / (1000 * 60 * 60 * 24)

  // La misma función que usa el modo real.
  return calcularMetricas(pedidos, lineas, { porMes: dias > 92 })
}

export function resumenPanelDemo(): ResumenPanel {
  const hoy = hoyDelNegocio()
  const mes = mesDelNegocio(new Date())

  const pedidosDeHoy = PEDIDOS_DEMO.filter((p) => diaDelNegocio(p.created_at) === hoy).length
  const delMes = PEDIDOS_DEMO.filter(
    (p) => mesDelNegocio(p.created_at) === mes && p.payment_status === 'approved',
  )
  const ventas = delMes.reduce((s, p) => s + p.total_cents, 0)

  return {
    pedidosPendientes: PEDIDOS_DEMO.filter((p) => p.status === 'pending').length,
    pedidosDeHoy,
    ventasAprobadasCents: ventas,
    ticketPromedioCents: ticketPromedio(ventas, delMes.length),
    ultimosPedidos: PEDIDOS_DEMO.slice(0, 8).map((p) => ({
      ...p,
      customers: CLIENTES_DEMO.find((c) => c.id === p.customer_id)
        ? { name: CLIENTES_DEMO.find((c) => c.id === p.customer_id)!.name }
        : null,
    })),
  }
}
