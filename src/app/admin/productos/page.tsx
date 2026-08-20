import Link from 'next/link'
import { AccionesProducto } from '@/components/admin/AccionesProducto'
import { CabeceraAdmin, SinBackend, VacioAdmin } from '@/components/admin/Chasis'
import { FiltrosColapsables } from '@/components/admin/FiltrosColapsables'
import { Pildora, Tabla } from '@/components/admin/Tabla'
import { faltantesDeBackend, panelOperativo } from '@/lib/supabase/env'
import { ETIQUETA_ESTADO_PRODUCTO, ETIQUETA_MODALIDAD_CORTA } from '@/lib/etiquetas'
import { formatearImporte } from '@/server/dinero'
import { exigirAdmin } from '@/server/autorizacion'
import {
  listarCategoriasAdmin,
  listarProductosAdmin,
  urlPublica,
} from '@/server/catalogo/repositorio'
import type { EstadoProducto } from '@/lib/supabase/tipos'

export const metadata = { title: 'Productos' }

const ESTADOS: EstadoProducto[] = ['active', 'draft', 'archived']

const BOTON_PRIMARIO =
  'inline-flex min-h-[44px] items-center border border-verde bg-verde px-5 text-[13.5px] font-semibold text-papel no-underline'
const BOTON_SECUNDARIO =
  'inline-flex min-h-[44px] items-center border border-verde px-5 text-[13.5px] font-semibold text-verde no-underline hover:bg-verde/[0.07]'

/** Miniatura de la lista. Sin foto no hay hueco roto: lo dice con palabras. */
function Miniatura({ path, alt }: { path: string | null; alt: string }) {
  if (!path) {
    return (
      <span className="flex h-[60px] w-12 items-center justify-center border border-dashed border-linea-fuerte bg-papel-alt px-1 text-center text-[9px] leading-tight font-semibold tracking-wide text-tinta-suave uppercase">
        Sin foto
      </span>
    )
  }
  return (
    <span className="block h-[60px] w-12 overflow-hidden border border-linea bg-crema">
      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura pequeña */}
      <img src={urlPublica(path)} alt={alt} loading="lazy" className="h-full w-full object-cover" />
    </span>
  )
}

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
      orden: 'position',
      pagina: Number(q.pagina ?? 1),
    }),
    listarCategoriasAdmin(),
  ])

  if (!resultado) return <SinBackend faltantes={faltantesDeBackend()} />

  const hayFiltrosActivos = Boolean(q.estado || q.categoria)

  return (
    <>
      <CabeceraAdmin
        titulo="Productos"
        descripcion={`${resultado.total} ${resultado.total === 1 ? 'producto' : 'productos'} en el catálogo.`}
        acciones={
          <>
            <Link href="/admin/productos/ordenar" className={BOTON_SECUNDARIO}>
              Ordenar productos
            </Link>
            <Link href="/admin/productos/nuevo" className={BOTON_PRIMARIO}>
              Nuevo producto
            </Link>
          </>
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
              placeholder="Buscar producto"
              className="min-h-[44px] border border-linea-fuerte bg-papel px-3 text-sm focus:border-verde focus:outline-none"
            />
          </label>

          <FiltrosColapsables abiertosAlInicio={hayFiltrosActivos}>
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
                  <option key={e} value={e}>
                    {ETIQUETA_ESTADO_PRODUCTO[e]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
                Categoría
              </span>
              <select
                name="categoria"
                defaultValue={q.categoria ?? ''}
                className="min-h-[44px] border border-linea-fuerte bg-papel px-3 text-sm"
              >
                <option value="">Todas</option>
                {(categorias ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </FiltrosColapsables>

          <button type="submit" className={BOTON_PRIMARIO}>
            Buscar
          </button>
        </form>

        <Tabla
          filas={resultado.productos}
          claveFila={(p) => p.id}
          vacio={
            <VacioAdmin
              titulo="Todavía no hay productos"
              texto="Creá el primero para que aparezca en la tienda."
              accion={
                <Link href="/admin/productos/nuevo" className={BOTON_PRIMARIO}>
                  Crear primer producto
                </Link>
              }
            />
          }
          columnas={[
            {
              clave: 'foto',
              etiqueta: 'Foto',
              render: (p) => <Miniatura path={p.imagen} alt={p.name} />,
            },
            {
              clave: 'nombre',
              etiqueta: 'Producto',
              render: (p) => (
                <Link
                  href={`/admin/productos/${p.id}`}
                  className="inline-flex min-h-[44px] items-center py-1 font-medium text-verde"
                >
                  {p.name}
                </Link>
              ),
            },
            {
              clave: 'categoria',
              etiqueta: 'Categoría',
              render: (p) => p.categories?.name ?? '—',
            },
            {
              clave: 'precio',
              etiqueta: 'Precio',
              render: (p) => (
                <span className="flex flex-col items-start gap-0.5 lg:items-start">
                  <span className="tnum text-[13.5px]">
                    {p.price_cents != null ? formatearImporte(p.price_cents) : 'A consultar'}
                  </span>
                  <span className="text-[10px] font-semibold tracking-[0.06em] text-tinta-suave uppercase">
                    {ETIQUETA_MODALIDAD_CORTA[p.sale_mode]}
                  </span>
                </span>
              ),
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
              clave: 'acciones',
              etiqueta: 'Acciones',
              alineacion: 'derecha',
              render: (p) => (
                <AccionesProducto id={p.id} slug={p.slug} nombre={p.name} estado={p.status} />
              ),
            },
          ]}
        />
      </div>
    </>
  )
}
