import { CabeceraAdmin, SinBackend, VacioAdmin } from '@/components/admin/Chasis'
import {
  OrdenarProductos,
  type GrupoDeOrden,
} from '@/components/admin/OrdenarProductos'
import { faltantesDeBackend, panelOperativo } from '@/lib/supabase/env'
import { exigirAdmin } from '@/server/autorizacion'
import {
  listarCategoriasAdmin,
  listarProductosParaOrdenar,
  urlPublica,
} from '@/server/catalogo/repositorio'

export const metadata = { title: 'Ordenar productos' }

export default async function PaginaOrdenarProductos() {
  if (!panelOperativo()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  const [productos, categorias] = await Promise.all([
    listarProductosParaOrdenar(),
    listarCategoriasAdmin(),
  ])
  if (!productos || !categorias) return <SinBackend faltantes={faltantesDeBackend()} />

  const grupos: GrupoDeOrden[] = categorias
    .map((c) => ({
      id: c.id,
      nombre: c.name,
      productos: productos
        .filter((p) => p.category_id === c.id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          imagenUrl: p.imagen ? urlPublica(p.imagen) : null,
        })),
    }))
    .concat([
      {
        id: 'sin-categoria',
        nombre: 'Sin categoría',
        productos: productos
          .filter((p) => !p.category_id || !categorias.some((c) => c.id === p.category_id))
          .map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            imagenUrl: p.imagen ? urlPublica(p.imagen) : null,
          })),
      },
    ])

  return (
    <>
      <CabeceraAdmin
        titulo="Ordenar productos"
        migas={[{ etiqueta: 'Productos', href: '/admin/productos' }, { etiqueta: 'Ordenar' }]}
        descripcion="Arrastrá cada producto, o usá Subir y Bajar. Este orden es el que ve el cliente en la tienda."
      />
      <div className="px-4 py-6 lg:px-8">
        {productos.length === 0 ? (
          <VacioAdmin
            titulo="Todavía no hay productos"
            texto="Cuando haya productos en el catálogo, acá se ordenan."
          />
        ) : (
          <OrdenarProductos grupos={grupos} />
        )}
      </div>
    </>
  )
}
