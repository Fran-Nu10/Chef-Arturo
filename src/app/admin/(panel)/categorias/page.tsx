import Link from 'next/link'
import { CabeceraAdmin, SinBackend, VacioAdmin } from '@/components/admin/Chasis'
import { ListaCategorias } from '@/components/admin/ListaCategorias'
import { faltantesDeBackend, panelOperativo } from '@/lib/supabase/env'
import { exigirAdmin } from '@/server/autorizacion'
import { listarCategoriasConDetalle, urlPublica } from '@/server/catalogo/repositorio'

export const metadata = { title: 'Categorías' }

const BOTON_PRIMARIO =
  'inline-flex min-h-[44px] items-center border border-verde bg-verde px-5 text-[13.5px] font-semibold text-papel no-underline'

export default async function PaginaCategorias({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  if (!panelOperativo()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  const [categorias, q] = await Promise.all([listarCategoriasConDetalle(), searchParams])
  if (!categorias) return <SinBackend faltantes={faltantesDeBackend()} />

  return (
    <>
      <CabeceraAdmin
        titulo="Categorías"
        descripcion="Ordenan la tienda. Arrastralas o usá Subir y Bajar para cambiar el orden."
        acciones={
          <Link href="/admin/categorias/nueva" className={BOTON_PRIMARIO}>
            Nueva categoría
          </Link>
        }
      />
      <div className="flex flex-col gap-4 px-4 py-6 lg:px-8">
        {q.creada === '1' && (
          <p
            role="status"
            className="m-0 border border-verde bg-verde/[0.07] px-3 py-2.5 text-[13px] text-verde"
          >
            Categoría creada.
          </p>
        )}
        {categorias.length === 0 ? (
          <VacioAdmin
            titulo="Todavía no hay categorías"
            texto="Creá la primera para poder organizar los productos."
            accion={
              <Link href="/admin/categorias/nueva" className={BOTON_PRIMARIO}>
                Nueva categoría
              </Link>
            }
          />
        ) : (
          <ListaCategorias
            categorias={categorias.map((c) => ({
              id: c.id,
              nombre: c.name,
              slug: c.slug,
              imagenUrl: c.imagen ? urlPublica(c.imagen) : null,
              cantidadProductos: c.cantidadProductos,
              visible: c.is_active,
            }))}
          />
        )}
      </div>
    </>
  )
}
