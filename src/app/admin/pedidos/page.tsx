import Link from 'next/link'
import { CabeceraAdmin, SinBackend, VacioAdmin } from '@/components/admin/Chasis'
import { Pildora, Tabla } from '@/components/admin/Tabla'
import { faltantesDeBackend, hayBackend } from '@/lib/supabase/env'
import {
  ETIQUETA_ESTADO_PAGO,
  ETIQUETA_ESTADO_PEDIDO,
  fechaHora,
  tonoEstadoPago,
  tonoEstadoPedido,
} from '@/lib/etiquetas'
import { formatearImporte } from '@/server/dinero'
import { exigirAdmin } from '@/server/autorizacion'
import { listarPedidos } from '@/server/pedidos/repositorio'
import type { EstadoPago, EstadoPedido } from '@/lib/supabase/tipos'

export const metadata = { title: 'Pedidos' }

const ESTADOS: EstadoPedido[] = [
  'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled',
]
const ESTADOS_PAGO: EstadoPago[] = [
  'pending', 'approved', 'rejected', 'cancelled', 'refunded',
]

export default async function PaginaPedidos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  if (!hayBackend()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  const q = await searchParams
  const resultado = await listarPedidos({
    busqueda: q.q,
    estado: ESTADOS.includes(q.estado as EstadoPedido) ? (q.estado as EstadoPedido) : undefined,
    estadoPago: ESTADOS_PAGO.includes(q.pago as EstadoPago) ? (q.pago as EstadoPago) : undefined,
    desde: q.desde,
    hasta: q.hasta,
    pagina: Number(q.pagina ?? 1),
  })

  if (!resultado) return <SinBackend faltantes={faltantesDeBackend()} />

  return (
    <>
      <CabeceraAdmin
        titulo="Pedidos"
        descripcion={`${resultado.total} pedidos registrados.`}
      />

      <div className="flex flex-col gap-5 px-4 py-6 lg:px-8">
        <form className="flex flex-wrap items-end gap-3" role="search">
          <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
              Buscar
            </span>
            <input
              type="search"
              name="q"
              defaultValue={q.q ?? ''}
              placeholder="Nº de pedido, nombre o teléfono"
              className="min-h-[44px] border border-linea-fuerte bg-papel px-3 text-sm focus:border-verde focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
              Estado
            </span>
            <select
              name="estado"
              defaultValue={q.estado ?? ''}
              className="min-h-[44px] border border-linea-fuerte bg-papel px-3 text-sm"
            >
              <option value="">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>{ETIQUETA_ESTADO_PEDIDO[e]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
              Pago
            </span>
            <select
              name="pago"
              defaultValue={q.pago ?? ''}
              className="min-h-[44px] border border-linea-fuerte bg-papel px-3 text-sm"
            >
              <option value="">Todos</option>
              {ESTADOS_PAGO.map((e) => (
                <option key={e} value={e}>{ETIQUETA_ESTADO_PAGO[e]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
              Desde
            </span>
            <input type="date" name="desde" defaultValue={q.desde ?? ''}
              className="min-h-[44px] border border-linea-fuerte bg-papel px-3 text-sm" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
              Hasta
            </span>
            <input type="date" name="hasta" defaultValue={q.hasta ?? ''}
              className="min-h-[44px] border border-linea-fuerte bg-papel px-3 text-sm" />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center border border-verde bg-verde px-5 text-[13.5px] font-semibold text-papel"
          >
            Filtrar
          </button>
        </form>

        <Tabla
          filas={resultado.pedidos}
          claveFila={(p) => p.id}
          vacio={
            <VacioAdmin
              titulo="Sin pedidos que coincidan"
              texto="Probá con otro término o quitá los filtros."
            />
          }
          columnas={[
            {
              clave: 'numero',
              etiqueta: 'Pedido',
              render: (p) => (
                <Link href={`/admin/pedidos/${p.id}`} className="tnum font-semibold text-verde">
                  {p.order_number}
                </Link>
              ),
            },
            {
              clave: 'cliente',
              etiqueta: 'Cliente',
              render: (p) => (
                <span>
                  {p.customers?.name ?? '—'}
                  <span className="tnum block text-[11.5px] text-tinta-suave">
                    {p.customers?.phone ?? ''}
                  </span>
                </span>
              ),
            },
            {
              clave: 'estado',
              etiqueta: 'Estado',
              render: (p) => (
                <Pildora texto={ETIQUETA_ESTADO_PEDIDO[p.status]} tono={tonoEstadoPedido(p.status)} />
              ),
            },
            {
              clave: 'pago',
              etiqueta: 'Pago',
              render: (p) => (
                <Pildora
                  texto={ETIQUETA_ESTADO_PAGO[p.payment_status]}
                  tono={tonoEstadoPago(p.payment_status)}
                />
              ),
            },
            {
              clave: 'fecha',
              etiqueta: 'Creado',
              secundaria: true,
              render: (p) => <span className="tnum">{fechaHora(p.created_at)}</span>,
            },
            {
              clave: 'total',
              etiqueta: 'Total',
              alineacion: 'derecha',
              render: (p) => <span className="tnum">{formatearImporte(p.total_cents)}</span>,
            },
          ]}
        />
      </div>
    </>
  )
}
