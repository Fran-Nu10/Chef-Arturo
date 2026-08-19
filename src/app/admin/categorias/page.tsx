import { CabeceraAdmin, SinBackend } from '@/components/admin/Chasis'
import { EditorCategorias } from '@/components/admin/EditorCategorias'
import { faltantesDeBackend, panelOperativo } from '@/lib/supabase/env'
import { exigirAdmin } from '@/server/autorizacion'
import { listarCategoriasAdmin } from '@/server/catalogo/repositorio'

export const metadata = { title: 'Categorías' }

export default async function PaginaCategorias() {
  if (!panelOperativo()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  const categorias = await listarCategoriasAdmin()
  if (!categorias) return <SinBackend faltantes={faltantesDeBackend()} />

  return (
    <>
      <CabeceraAdmin
        titulo="Categorías"
        descripcion="Ordenan el catálogo y la sección «Elegí tu ocasión» de la home."
      />
      <div className="px-4 py-6 lg:px-8">
        <EditorCategorias categorias={categorias} />
      </div>
    </>
  )
}
