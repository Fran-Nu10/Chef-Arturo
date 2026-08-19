import 'server-only'

import { terminoDeBusqueda } from '@/server/validacion'
import { clienteServidor } from '@/lib/supabase/servidor'
import type {
  FilaCliente,
  FilaHistorialPedido,
  FilaLineaPedido,
  FilaPago,
  FilaPedido,
} from '@/lib/supabase/tipos'

export interface FiltrosPedidos {
  busqueda?: string
  estado?: FilaPedido['status']
  estadoPago?: FilaPedido['payment_status']
  desde?: string
  hasta?: string
  pagina?: number
  porPagina?: number
}

export type PedidoConCliente = FilaPedido & {
  customers: Pick<FilaCliente, 'id' | 'name' | 'phone' | 'email'> | null
}

/**
 * Listado de pedidos del panel.
 *
 * La búsqueda cubre número de pedido, nombre y teléfono. El término se limpia
 * antes de armar el filtro `or` de PostgREST, cuya sintaxis usa comas y
 * paréntesis como separadores.
 */
export async function listarPedidos(filtros: FiltrosPedidos = {}) {
  const supabase = await clienteServidor()
  if (!supabase) return null

  const porPagina = Math.min(filtros.porPagina ?? 25, 100)
  const pagina = Math.max(filtros.pagina ?? 1, 1)
  const desde = (pagina - 1) * porPagina

  let consulta = supabase
    .from('orders')
    .select('*, customers(id, name, phone, email)', { count: 'exact' })

  if (filtros.estado) consulta = consulta.eq('status', filtros.estado)
  if (filtros.estadoPago) consulta = consulta.eq('payment_status', filtros.estadoPago)
  if (filtros.desde) consulta = consulta.gte('created_at', filtros.desde)
  if (filtros.hasta) consulta = consulta.lte('created_at', `${filtros.hasta}T23:59:59.999Z`)

  if (filtros.busqueda) {
    const termino = terminoDeBusqueda(filtros.busqueda)
    if (termino) {
      const soloDigitos = termino.replace(/[^0-9]/g, '')
      const partes = [`order_number.ilike.%${termino}%`]
      if (soloDigitos.length >= 4) {
        // El teléfono vive en `customers`; se resuelve aparte y se filtra por id.
        const { data: clientes } = await supabase
          .from('customers')
          .select('id')
          .ilike('phone', `%${soloDigitos}%`)
        const ids = (clientes ?? []).map((c) => c.id)
        if (ids.length > 0) partes.push(`customer_id.in.(${ids.join(',')})`)
      }
      const { data: porNombre } = await supabase
        .from('customers')
        .select('id')
        .ilike('name', `%${termino}%`)
      const idsNombre = (porNombre ?? []).map((c) => c.id)
      if (idsNombre.length > 0) partes.push(`customer_id.in.(${idsNombre.join(',')})`)

      consulta = consulta.or(partes.join(','))
    }
  }

  const { data, error, count } = await consulta
    .order('created_at', { ascending: false })
    .range(desde, desde + porPagina - 1)

  if (error) throw error

  return {
    pedidos: (data ?? []) as unknown as PedidoConCliente[],
    total: count ?? 0,
    pagina,
    porPagina,
  }
}

export interface PedidoCompleto {
  pedido: FilaPedido
  cliente: FilaCliente | null
  lineas: FilaLineaPedido[]
  historial: FilaHistorialPedido[]
  pagos: FilaPago[]
}

export async function pedidoPorId(id: string): Promise<PedidoCompleto | null> {
  const supabase = await clienteServidor()
  if (!supabase) return null

  const { data: pedido, error } = await supabase
    .from('orders')
    .select('*, customers(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!pedido) return null

  const [{ data: lineas }, { data: historial }, { data: pagos }] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', id).order('created_at'),
    supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('payments').select('*').eq('order_id', id).order('created_at'),
  ])

  const { customers, ...resto } = pedido as unknown as FilaPedido & {
    customers: FilaCliente | null
  }

  return {
    pedido: resto,
    cliente: customers,
    lineas: lineas ?? [],
    historial: historial ?? [],
    pagos: pagos ?? [],
  }
}

// ── Clientes ────────────────────────────────────────────────────────────────

export async function listarClientes(busqueda?: string) {
  const supabase = await clienteServidor()
  if (!supabase) return null

  let consulta = supabase.from('customers').select('*')

  if (busqueda) {
    const termino = terminoDeBusqueda(busqueda)
    const digitos = termino.replace(/[^0-9]/g, '')
    const partes = [`name.ilike.%${termino}%`, `email.ilike.%${termino}%`]
    if (digitos.length >= 3) partes.push(`phone.ilike.%${digitos}%`)
    consulta = consulta.or(partes.join(','))
  }

  const { data, error } = await consulta
    .order('last_order_at', { ascending: false, nullsFirst: false })
    .limit(200)

  if (error) throw error
  return data
}

export interface FichaCliente {
  cliente: FilaCliente
  pedidos: FilaPedido[]
  /** Derivado de pagos aprobados, no de pedidos creados. */
  totalGastadoCents: number
  ticketPromedioCents: number
  pedidosPagados: number
}

export async function fichaCliente(id: string): Promise<FichaCliente | null> {
  const supabase = await clienteServidor()
  if (!supabase) return null

  const { data: cliente, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!cliente) return null

  const { data: pedidos } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })

  const lista = pedidos ?? []

  // El gasto real es el de los pagos aprobados. Un pedido creado y nunca
  // pagado no es facturación, y uno cancelado tampoco.
  const pagados = lista.filter((p) => p.payment_status === 'approved')
  const totalGastadoCents = pagados.reduce((suma, p) => suma + p.total_cents, 0)

  return {
    cliente,
    pedidos: lista,
    totalGastadoCents,
    pedidosPagados: pagados.length,
    ticketPromedioCents:
      pagados.length > 0 ? Math.round(totalGastadoCents / pagados.length) : 0,
  }
}
