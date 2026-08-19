import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CabeceraAdmin, SinBackend } from '@/components/admin/Chasis'
import { Metrica, Pildora, Tabla } from '@/components/admin/Tabla'
import { NotasCliente } from '@/components/admin/NotasCliente'
import { faltantesDeBackend, hayBackend } from '@/lib/supabase/env'
import {
  ETIQUETA_ESTADO_PEDIDO,
  fechaCorta,
  fechaHora,
  tonoEstadoPedido,
} from '@/lib/etiquetas'
import { formatearImporte } from '@/server/dinero'
import { exigirAdmin } from '@/server/autorizacion'
import { fichaCliente } from '@/server/pedidos/repositorio'

export const metadata = { title: 'Ficha del cliente' }

export default async function PaginaCliente({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!hayBackend()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  const { id } = await params
  const ficha = await fichaCliente(id)
  if (!ficha) notFound()

  const { cliente, pedidos, totalGastadoCents, ticketPromedioCents, pedidosPagados } = ficha

  return (
    <>
      <CabeceraAdmin
        titulo={cliente.name}
        migas={[{ etiqueta: 'Clientes', href: '/admin/clientes' }, { etiqueta: cliente.name }]}
        descripcion={`${cliente.phone}${cliente.email ? ` · ${cliente.email}` : ''}`}
      />

      <div className="flex flex-col gap-6 px-4 py-6 lg:px-8">
        <section aria-label="Métricas del cliente" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrica
            etiqueta="Total gastado"
            valor={formatearImporte(totalGastadoCents)}
            detalle="Sólo pagos aprobados"
          />
          <Metrica
            etiqueta="Ticket promedio"
            valor={formatearImporte(ticketPromedioCents)}
            detalle={`Sobre ${pedidosPagados} pedidos pagados`}
          />
          <Metrica etiqueta="Pedidos" valor={String(pedidos.length)} detalle="Creados en total" />
          <Metrica
            etiqueta="Primer pedido"
            valor={fechaCorta(cliente.first_order_at)}
            detalle={`Último: ${fechaCorta(cliente.last_order_at)}`}
          />
        </section>

        <p className="m-0 text-[12px] leading-relaxed text-tinta-suave">
          Las cifras se derivan de los pagos aprobados y no se pueden editar: son
          un cálculo, no un dato cargado a mano.
        </p>

        <section aria-labelledby="pedidos-cliente" className="flex flex-col gap-3">
          <h2 id="pedidos-cliente" className="m-0 font-display text-xl font-normal">
            Historial de pedidos
          </h2>
          <Tabla
            filas={pedidos}
            claveFila={(p) => p.id}
            vacio={<p className="m-0 text-[13px] text-tinta-suave">Sin pedidos todavía.</p>}
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
                clave: 'estado',
                etiqueta: 'Estado',
                render: (p) => (
                  <Pildora
                    texto={ETIQUETA_ESTADO_PEDIDO[p.status]}
                    tono={tonoEstadoPedido(p.status)}
                  />
                ),
              },
              {
                clave: 'fecha',
                etiqueta: 'Fecha',
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
        </section>

        <NotasCliente clienteId={cliente.id} notas={cliente.internal_notes} />
      </div>
    </>
  )
}
