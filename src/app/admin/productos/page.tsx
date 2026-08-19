import Link from 'next/link'
import { CabeceraAdmin, SinBackend, VacioAdmin } from '@/components/admin/Chasis'
import { Pildora, Tabla } from '@/components/admin/Tabla'
import { faltantesDeBackend, panelOperativo } from '@/lib/supabase/env'
import { ETIQUETA_ESTADO_PRODUCTO, ETIQUETA_MODALIDAD } from '@/lib/etiquetas'
import { formatearImporte } from '@/server/dinero'
import { exigirAdmin } from '@/server/autorizacion'
import { listarCategoriasAdmin, listarProductosAdmin } from '@/server/catalogo/repositorio'
import type { EstadoProducto } from '@/lib/supabase/tipos'

export const metadata = { title: 'Productos' }

const ESTADOS: EstadoProducto[] = ['draft', 'active', 'archived']

export default async function PaginaProductos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  if (!panelOperativo()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  const q = await searchParams
  const [resultado, categorias] = await Promise.all([
    listarProductosAdmin({
      busqueda: q.q,
      estado: ESTADOS.includes(q.estado as EstadoProducto)
        ? (q.estado as EstadoProducto)
        : undefined,
      categoriaId: q.categoria,
      orden: (q.orden as 'position' | 'name' | 'created_at' | 'stock') ?? 'position',
      pagina: Number(q.pagina ?? 1),
    }),
    listarCategoriasAdmin(),
  ])

  if (!resultado) return <SinBackend faltantes={faltantesDeBackend()} />

  return (
    <>
      <CabeceraAdmin
        titulo="Productos"
        descripcion={`${resultado.total} productos en el catálogo.`}
        acciones={
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex min-h-[44px] items-center border border-verde bg-verde px-5 text-[13.5px] font-semibold text-papel no-underline"
          >
            Nuevo producto
          </Link>
        }
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
              placeholder="Nombre o slug"
              className="min-h-[44px] border border-linea-fuerte bg-papel px-3 text-sm focus:border-verde focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
              Estado
            </span>
            <select name="estado" defaultValue={q.estado ?? ''}
              className="min-h-[44px] border border-linea-fuerte bg-papel px-3 text-sm">
              <option value="">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>{ETIQUETA_ESTADO_PRODUCTO[e]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
              Categoría
            </span>
            <select name="categoria" defaultValue={q.categoria ?? ''}
              className="min-h-[44px] border border-linea-fuerte bg-papel px-3 text-sm">
              <option value="">Todas</option>
              {(categorias ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
              Ordenar
            </span>
            <select name="orden" defaultValue={q.orden ?? 'position'}
              className="min-h-[44px] border border-linea-fuerte bg-papel px-3 text-sm">
              <option value="position">Orden visual</option>
              <option value="name">Nombre</option>
              <option value="created_at">Más recientes</option>
              <option value="stock">Stock</option>
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center border border-verde bg-verde px-5 text-[13.5px] font-semibold text-papel"
          >
            Filtrar
          </button>
        </form>

        <Tabla
          filas={resultado.productos}
          claveFila={(p) => p.id}
          vacio={
            <VacioAdmin
              titulo="Todavía no hay productos"
              texto="Creá el primero para que aparezca en el catálogo público."
              accion={
                <Link
                  href="/admin/productos/nuevo"
                  className="inline-flex min-h-[44px] items-center border border-verde bg-verde px-5 text-[13.5px] font-semibold text-papel no-underline"
                >
                  Nuevo producto
                </Link>
              }
            />
          }
          columnas={[
            {
              clave: 'nombre',
              etiqueta: 'Producto',
              render: (p) => (
                <Link href={`/admin/productos/${p.id}`} className="font-medium text-verde">
                  {p.name}
                  <span className="block font-mono text-[11px] text-tinta-suave">{p.slug}</span>
                </Link>
              ),
            },
            {
              clave: 'categoria',
              etiqueta: 'Categoría',
              secundaria: true,
              render: (p) => p.categories?.name ?? '—',
            },
            {
              clave: 'modalidad',
              etiqueta: 'Modalidad',
              render: (p) => ETIQUETA_MODALIDAD[p.sale_mode],
            },
            {
              clave: 'estado',
              etiqueta: 'Estado',
              render: (p) => (
                <Pildora
                  texto={ETIQUETA_ESTADO_PRODUCTO[p.status]}
                  tono={
                    p.status === 'active' ? 'verde' : p.status === 'draft' ? 'caramelo' : 'neutro'
                  }
                />
              ),
            },
            {
              clave: 'stock',
              etiqueta: 'Stock',
              secundaria: true,
              render: (p) =>
                p.track_stock ? (
                  <span
                    className={`tnum ${p.stock_quantity <= p.low_stock_threshold ? 'text-alerta' : ''}`}
                  >
                    {p.stock_quantity}
                  </span>
                ) : (
                  <span className="text-tinta-suave">Sin control</span>
                ),
            },
            {
              clave: 'precio',
              etiqueta: 'Precio',
              alineacion: 'derecha',
              render: (p) => <span className="tnum">{formatearImporte(p.price_cents)}</span>,
            },
          ]}
        />
      </div>
    </>
  )
}
