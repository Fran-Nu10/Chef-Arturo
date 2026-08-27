import Link from 'next/link'
import { CabeceraAdmin, SinBackend, VacioAdmin } from '@/components/admin/Chasis'
import { Tabla } from '@/components/admin/Tabla'
import { faltantesDeBackend, panelOperativo } from '@/lib/supabase/env'
import { fechaCorta } from '@/lib/etiquetas'
import { exigirAdmin } from '@/server/autorizacion'
import { listarClientes } from '@/server/pedidos/repositorio'

export const metadata = { title: 'Clientes' }

export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  if (!panelOperativo()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  const { q } = await searchParams
  const clientes = await listarClientes(q)
  if (!clientes) return <SinBackend faltantes={faltantesDeBackend()} />

  return (
    <>
      <CabeceraAdmin titulo="Clientes" descripcion="Se crean solos al entrar un pedido." />
      <div className="flex flex-col gap-5 px-4 py-6 lg:px-8">
        <form role="search" className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[220px] flex-1 flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
              Buscar
            </span>
            <input
              type="search"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Nombre, teléfono o email"
              className="min-h-[44px] border border-linea-fuerte bg-papel px-3 text-sm focus:border-verde focus:outline-none"
            />
          </label>
          <button type="submit"
            className="inline-flex min-h-[44px] items-center border border-verde bg-verde px-5 text-[13.5px] font-semibold text-papel">
            Buscar
          </button>
        </form>

        <Tabla
          filas={clientes}
          claveFila={(c) => c.id}
          vacio={
            <VacioAdmin
              titulo="Todavía no hay clientes"
              texto="Se registran automáticamente cuando alguien hace un pedido."
            />
          }
          columnas={[
            {
              clave: 'nombre',
              etiqueta: 'Cliente',
              render: (c) => (
                <Link href={`/admin/clientes/${c.id}`} className="font-medium text-verde">
                  {c.name}
                </Link>
              ),
            },
            { clave: 'telefono', etiqueta: 'Teléfono', render: (c) => <span className="tnum">{c.phone}</span> },
            { clave: 'email', etiqueta: 'Email', secundaria: true, render: (c) => c.email ?? '—' },
            {
              clave: 'ultimo',
              etiqueta: 'Último pedido',
              alineacion: 'derecha',
              render: (c) => <span className="tnum">{fechaCorta(c.last_order_at)}</span>,
            },
          ]}
        />
      </div>
    </>
  )
}
