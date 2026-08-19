import { notFound } from 'next/navigation'
import { CabeceraAdmin, SinBackend } from '@/components/admin/Chasis'
import { Pildora } from '@/components/admin/Tabla'
import { PanelPedido } from '@/components/admin/PanelPedido'
import { faltantesDeBackend, hayBackend } from '@/lib/supabase/env'
import {
  ETIQUETA_ESTADO_PAGO,
  ETIQUETA_ESTADO_PEDIDO,
  ETIQUETA_MODALIDAD,
  fechaCorta,
  fechaHora,
  tonoEstadoPago,
  tonoEstadoPedido,
} from '@/lib/etiquetas'
import { formatearImporte } from '@/server/dinero'
import { exigirAdmin } from '@/server/autorizacion'
import { pedidoPorId } from '@/server/pedidos/repositorio'

export const metadata = { title: 'Detalle del pedido' }

export default async function PaginaPedido({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!hayBackend()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  const { id } = await params
  const detalle = await pedidoPorId(id)
  if (!detalle) notFound()

  const { pedido, cliente, lineas, historial, pagos } = detalle

  return (
    <>
      <CabeceraAdmin
        titulo={`Pedido ${pedido.order_number}`}
        migas={[{ etiqueta: 'Pedidos', href: '/admin/pedidos' }, { etiqueta: pedido.order_number }]}
        acciones={
          <div className="flex gap-2">
            <Pildora
              texto={ETIQUETA_ESTADO_PEDIDO[pedido.status]}
              tono={tonoEstadoPedido(pedido.status)}
            />
            <Pildora
              texto={`Pago: ${ETIQUETA_ESTADO_PAGO[pedido.payment_status]}`}
              tono={tonoEstadoPago(pedido.payment_status)}
            />
          </div>
        }
      />

      <div className="grid gap-6 px-4 py-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="lineas" className="flex flex-col gap-3">
            <h2 id="lineas" className="m-0 font-display text-xl font-normal">
              Productos
            </h2>
            <ul className="m-0 flex list-none flex-col p-0">
              {lineas.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-linea py-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[14px] font-medium">{l.product_name}</span>
                    <span className="text-[11.5px] text-tinta-suave">
                      {ETIQUETA_MODALIDAD[l.sale_mode]} · {formatearImporte(l.unit_price_cents)} c/u
                    </span>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="tnum text-[13px] text-tinta-suave">×{l.quantity}</span>
                    <span className="tnum text-[14px] font-semibold">
                      {formatearImporte(l.line_total_cents)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="m-0 flex flex-col gap-1 pt-2 text-[13.5px]">
              {[
                ['Subtotal', pedido.subtotal_cents],
                ['Envío', pedido.shipping_cents],
                ['Descuento', -pedido.discount_cents],
              ].map(([etiqueta, valor]) => (
                <div key={String(etiqueta)} className="flex justify-between gap-3">
                  <dt className="text-tinta-suave">{etiqueta}</dt>
                  <dd className="tnum m-0">{formatearImporte(Math.abs(Number(valor)))}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-3 border-t border-linea pt-2 text-[15px] font-semibold">
                <dt>Total</dt>
                <dd className="tnum m-0 text-verde">{formatearImporte(pedido.total_cents)}</dd>
              </div>
            </dl>
          </section>

          <PanelPedido
            pedido={{
              id: pedido.id,
              orderNumber: pedido.order_number,
              status: pedido.status,
              internalNotes: pedido.internal_notes,
              shippingCents: pedido.shipping_cents,
              discountCents: pedido.discount_cents,
            }}
            telefonoCliente={cliente?.phone ?? ''}
          />

          <section aria-labelledby="historial" className="flex flex-col gap-3">
            <h2 id="historial" className="m-0 font-display text-xl font-normal">
              Historial
            </h2>
            <ol className="m-0 flex list-none flex-col gap-2 p-0">
              {historial.map((h) => (
                <li key={h.id} className="border-l-2 border-linea pl-3 text-[13px]">
                  <span className="font-medium">
                    {h.from_status
                      ? `${ETIQUETA_ESTADO_PEDIDO[h.from_status]} → ${ETIQUETA_ESTADO_PEDIDO[h.to_status]}`
                      : ETIQUETA_ESTADO_PEDIDO[h.to_status]}
                  </span>
                  <span className="tnum block text-[11.5px] text-tinta-suave">
                    {fechaHora(h.created_at)}
                  </span>
                  {h.note && <span className="block text-[12.5px] text-tinta-suave">{h.note}</span>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <section className="flex flex-col gap-2 border border-linea bg-papel-alt p-4">
            <h2 className="m-0 font-display text-lg font-normal">Cliente</h2>
            <p className="m-0 text-[13.5px] font-medium">{cliente?.name ?? '—'}</p>
            <p className="tnum m-0 text-[13px] text-tinta-suave">{cliente?.phone ?? '—'}</p>
            {cliente?.email && (
              <p className="m-0 text-[13px] text-tinta-suave">{cliente.email}</p>
            )}
          </section>

          <section className="flex flex-col gap-2 border border-linea bg-papel-alt p-4">
            <h2 className="m-0 font-display text-lg font-normal">Entrega</h2>
            <p className="m-0 text-[13.5px]">
              {pedido.fulfillment === 'delivery' ? 'Entrega a domicilio' : 'Retiro en Florida'}
            </p>
            {pedido.address && (
              <p className="m-0 text-[13px] text-tinta-suave">{pedido.address}</p>
            )}
            <p className="tnum m-0 text-[13px] text-tinta-suave">
              {fechaCorta(pedido.requested_date)}
              {pedido.requested_slot ? ` · ${pedido.requested_slot}` : ''}
            </p>
          </section>

          {pedido.customer_comments && (
            <section className="flex flex-col gap-2 border border-linea bg-papel-alt p-4">
              <h2 className="m-0 font-display text-lg font-normal">Comentarios del cliente</h2>
              <p className="m-0 text-[13px] leading-relaxed text-tinta-suave">
                {pedido.customer_comments}
              </p>
            </section>
          )}

          <section className="flex flex-col gap-2 border border-linea bg-papel-alt p-4">
            <h2 className="m-0 font-display text-lg font-normal">Pagos</h2>
            {pagos.length === 0 ? (
              <p className="m-0 text-[13px] text-tinta-suave">Sin pagos registrados.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {pagos.map((p) => (
                  <li key={p.id} className="flex flex-col gap-0.5 text-[13px]">
                    <span className="flex items-center justify-between gap-2">
                      <span>{p.method === 'mercado_pago' ? 'Mercado Pago' : 'WhatsApp'}</span>
                      <Pildora
                        texto={ETIQUETA_ESTADO_PAGO[p.status]}
                        tono={tonoEstadoPago(p.status)}
                      />
                    </span>
                    <span className="tnum text-[12px] text-tinta-suave">
                      {formatearImporte(p.amount_cents)} · {fechaHora(p.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="m-0 text-[11.5px] leading-relaxed text-tinta-suave">
              El estado del pago lo actualiza únicamente el webhook del proveedor.
              No puede cambiarse desde el panel.
            </p>
          </section>
        </aside>
      </div>
    </>
  )
}
