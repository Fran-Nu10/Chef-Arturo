import Link from 'next/link'
import { CabeceraAdmin, SinBackend, VacioAdmin } from '@/components/admin/Chasis'
import { Metrica, Pildora, Tabla } from '@/components/admin/Tabla'
import { faltantesDeBackend, panelOperativo } from '@/lib/supabase/env'
import { ETIQUETA_ESTADO_PEDIDO, fechaHora, tonoEstadoPedido } from '@/lib/etiquetas'
import { formatearImporte } from '@/server/dinero'
import { exigirAdmin } from '@/server/autorizacion'
import { productosConStockBajo } from '@/server/catalogo/repositorio'
import { resumenPanel } from '@/server/reportes/repositorio'
import { mercadoPagoConfigurado, modoMercadoPago } from '@/server/pagos/mercadopago'

export const metadata = { title: 'Resumen' }

/**
 * Panel de inicio.
 *
 * Sin operaciones muestra ceros y un estado vacío. Nunca una métrica
 * inventada: si no hay pedidos, no hay ventas.
 */
export default async function PaginaPanel() {
  if (!panelOperativo()) return <SinBackend faltantes={faltantesDeBackend()} />

  await exigirAdmin()
  const [resumen, stockBajo] = await Promise.all([resumenPanel(), productosConStockBajo()])

  if (!resumen) return <SinBackend faltantes={faltantesDeBackend()} />

  const modo = modoMercadoPago()

  return (
    <>
      <CabeceraAdmin
        titulo="Resumen"
        descripcion="Estado operativo de hoy. Las ventas son las de pagos aprobados del mes en curso."
      />

      <div className="flex flex-col gap-8 px-4 py-6 lg:px-8">
        {!mercadoPagoConfigurado() && (
          <p className="m-0 border border-caramelo bg-papel-alt px-4 py-3 text-[13px] text-caramelo-texto">
            Mercado Pago está <strong>pendiente de configuración</strong>. El
            checkout online no se ofrece; los pedidos siguen entrando por WhatsApp.
          </p>
        )}
        {modo === 'prueba' && (
          <p className="m-0 border border-caramelo bg-papel-alt px-4 py-3 text-[13px] text-caramelo-texto">
            Mercado Pago está en <strong>modo prueba</strong>. Los cobros no son reales.
          </p>
        )}

        <section aria-label="Métricas" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrica
            etiqueta="Pedidos pendientes"
            valor={String(resumen.pedidosPendientes)}
            detalle="Esperando confirmación"
          />
          <Metrica
            etiqueta="Pedidos de hoy"
            valor={String(resumen.pedidosDeHoy)}
            detalle="Creados desde las 00:00"
          />
          <Metrica
            etiqueta="Ventas del mes"
            valor={formatearImporte(resumen.ventasAprobadasCents)}
            detalle="Sólo pagos aprobados"
          />
          <Metrica
            etiqueta="Ticket promedio"
            valor={formatearImporte(resumen.ticketPromedioCents)}
            detalle="Sobre pedidos pagados"
          />
        </section>

        <section aria-labelledby="ultimos" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="ultimos" className="m-0 font-display text-xl font-normal">
              Últimos pedidos
            </h2>
            <Link href="/admin/pedidos" className="text-[13px] font-medium text-caramelo-texto">
              Ver todos
            </Link>
          </div>
          <Tabla
            filas={resumen.ultimosPedidos}
            claveFila={(p) => p.id}
            vacio={
              <VacioAdmin
                titulo="Todavía no hay pedidos"
                texto="Cuando entre el primer pedido desde el sitio, aparece acá."
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
              { clave: 'cliente', etiqueta: 'Cliente', render: (p) => p.customers?.name ?? '—' },
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

        <section aria-labelledby="stock" className="flex flex-col gap-3">
          <h2 id="stock" className="m-0 font-display text-xl font-normal">
            Stock bajo
          </h2>
          {stockBajo && stockBajo.length > 0 ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {stockBajo.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 border border-linea bg-papel-alt px-3.5 py-3"
                >
                  <span className="text-[13.5px] font-medium">{p.name}</span>
                  <span className="tnum text-[13px] text-alerta">
                    {p.stock_quantity} / umbral {p.low_stock_threshold}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 border border-linea bg-papel-alt px-3.5 py-3 text-[13px] text-tinta-suave">
              Ningún producto con control de stock está por debajo de su umbral.
            </p>
          )}
        </section>

        <section aria-labelledby="accesos" className="flex flex-col gap-3">
          <h2 id="accesos" className="m-0 font-display text-xl font-normal">
            Accesos rápidos
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { href: '/admin/productos/nuevo', texto: 'Nuevo producto' },
              { href: '/admin/pedidos?estado=pending', texto: 'Pedidos pendientes' },
              { href: '/admin/contenido', texto: 'Editar la home' },
              { href: '/admin/reportes', texto: 'Reportes' },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="inline-flex min-h-[44px] items-center border border-verde px-4 text-[13px] font-medium text-verde no-underline hover:bg-verde/[0.07]"
              >
                {a.texto}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
