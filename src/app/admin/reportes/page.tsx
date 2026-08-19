import { CabeceraAdmin, SinBackend, VacioAdmin } from '@/components/admin/Chasis'
import { Metrica } from '@/components/admin/Tabla'
import { faltantesDeBackend, hayBackend } from '@/lib/supabase/env'
import { formatearImporte } from '@/server/dinero'
import { exigirAdmin } from '@/server/autorizacion'
import { metricasDelRango } from '@/server/reportes/repositorio'

export const metadata = { title: 'Reportes' }

const METODO: Record<string, string> = {
  mercado_pago: 'Mercado Pago',
  whatsapp: 'WhatsApp',
  cash: 'Efectivo',
  sin_definir: 'Sin definir',
}

function hace(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  return d.toISOString().slice(0, 10)
}

export default async function PaginaReportes({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>
}) {
  if (!hayBackend()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  const q = await searchParams
  const desde = q.desde ?? hace(30)
  const hasta = q.hasta ?? new Date().toISOString().slice(0, 10)

  const m = await metricasDelRango(desde, hasta)
  if (!m) return <SinBackend faltantes={faltantesDeBackend()} />

  const maximo = Math.max(1, ...m.evolucion.map((e) => e.ingresosCents))

  return (
    <>
      <CabeceraAdmin
        titulo="Reportes"
        descripcion="Lectura operativa de lo que registró este sistema. No es contabilidad, ni un reporte fiscal, ni una conciliación bancaria."
      />

      <div className="flex flex-col gap-6 px-4 py-6 lg:px-8">
        <form className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">Desde</span>
            <input type="date" name="desde" defaultValue={desde}
              className="min-h-[44px] border border-linea-fuerte bg-papel px-3 text-sm" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">Hasta</span>
            <input type="date" name="hasta" defaultValue={hasta}
              className="min-h-[44px] border border-linea-fuerte bg-papel px-3 text-sm" />
          </label>
          <button type="submit"
            className="inline-flex min-h-[44px] items-center border border-verde bg-verde px-5 text-[13.5px] font-semibold text-papel">
            Aplicar
          </button>
        </form>

        {m.cantidadPedidos === 0 ? (
          <VacioAdmin
            titulo="Sin operaciones en el rango"
            texto="No hubo pedidos entre esas fechas. Probá con un rango más amplio."
          />
        ) : (
          <>
            <section aria-label="Métricas del rango" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metrica etiqueta="Ingresos aprobados" valor={formatearImporte(m.ingresosAprobadosCents)}
                detalle="Dinero efectivamente cobrado" />
              <Metrica etiqueta="Facturación bruta" valor={formatearImporte(m.facturacionBrutaCents)}
                detalle="Todo lo pedido, cancelados incluidos" />
              <Metrica etiqueta="Pagos pendientes" valor={formatearImporte(m.pagosPendientesCents)}
                detalle="Aún sin resolver" />
              <Metrica etiqueta="Reembolsos" valor={formatearImporte(m.reembolsosCents)}
                detalle="Devuelto al comprador" />
              <Metrica etiqueta="Pedidos" valor={String(m.cantidadPedidos)}
                detalle={`${m.cantidadPedidosPagados} pagados`} />
              <Metrica etiqueta="Cancelados" valor={String(m.cantidadCancelados)}
                detalle={formatearImporte(m.canceladosCents)} />
              <Metrica etiqueta="Ticket promedio" valor={formatearImporte(m.ticketPromedioCents)}
                detalle="Sobre pedidos pagados" />
            </section>

            <details className="border border-linea bg-papel-alt p-4">
              <summary className="cursor-pointer text-[13.5px] font-semibold">
                Qué significa cada métrica
              </summary>
              <dl className="m-0 mt-3 flex flex-col gap-2 text-[12.5px] leading-relaxed">
                <div><dt className="inline font-semibold">Ingresos aprobados: </dt>
                  <dd className="m-0 inline text-tinta-suave">suma de los totales de los pedidos cuyo pago está aprobado. Es la única cifra que representa dinero.</dd></div>
                <div><dt className="inline font-semibold">Facturación bruta: </dt>
                  <dd className="m-0 inline text-tinta-suave">suma de los totales de todos los pedidos creados en el rango, cancelados incluidos. Mide demanda, no ingresos.</dd></div>
                <div><dt className="inline font-semibold">Pagos pendientes: </dt>
                  <dd className="m-0 inline text-tinta-suave">totales de pedidos cuyo pago todavía no se resolvió.</dd></div>
                <div><dt className="inline font-semibold">Cancelados: </dt>
                  <dd className="m-0 inline text-tinta-suave">no se cuentan como venta en ninguna métrica de ingreso.</dd></div>
                <div><dt className="inline font-semibold">Productos más vendidos: </dt>
                  <dd className="m-0 inline text-tinta-suave">unidades de pedidos no cancelados, sin importar el estado del pago.</dd></div>
              </dl>
            </details>

            <section aria-labelledby="evolucion" className="flex flex-col gap-3">
              <h2 id="evolucion" className="m-0 font-display text-xl font-normal">Evolución</h2>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {m.evolucion.map((e) => (
                  <li key={e.periodo} className="flex items-center gap-3 text-[12.5px]">
                    <span className="tnum w-[86px] flex-none text-tinta-suave">{e.periodo}</span>
                    <span className="h-3 flex-1 bg-crema">
                      <span
                        className="block h-3 bg-verde"
                        style={{ width: `${Math.round((e.ingresosCents / maximo) * 100)}%` }}
                      />
                    </span>
                    <span className="tnum w-[110px] flex-none text-right">
                      {formatearImporte(e.ingresosCents)}
                    </span>
                    <span className="tnum w-[70px] flex-none text-right text-tinta-suave">
                      {e.pedidos} ped.
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section aria-labelledby="metodos" className="flex flex-col gap-3">
                <h2 id="metodos" className="m-0 font-display text-xl font-normal">Por método de pago</h2>
                {m.porMetodoPago.length === 0 ? (
                  <p className="m-0 text-[13px] text-tinta-suave">Sin pagos aprobados en el rango.</p>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {m.porMetodoPago.map((x) => (
                      <li key={x.metodo} className="flex justify-between gap-3 border-b border-linea pb-2 text-[13px]">
                        <span>{METODO[x.metodo] ?? x.metodo}</span>
                        <span className="tnum">
                          {formatearImporte(x.totalCents)}
                          <span className="text-tinta-suave"> · {x.cantidad}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="top" className="flex flex-col gap-3">
                <h2 id="top" className="m-0 font-display text-xl font-normal">Productos más vendidos</h2>
                {m.productosMasVendidos.length === 0 ? (
                  <p className="m-0 text-[13px] text-tinta-suave">Sin ventas en el rango.</p>
                ) : (
                  <ol className="m-0 flex list-none flex-col gap-2 p-0">
                    {m.productosMasVendidos.map((p) => (
                      <li key={p.nombre} className="flex justify-between gap-3 border-b border-linea pb-2 text-[13px]">
                        <span>{p.nombre}</span>
                        <span className="tnum">
                          {p.unidades} u.
                          <span className="text-tinta-suave"> · {formatearImporte(p.totalCents)}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </>
  )
}
