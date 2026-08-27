import { CabeceraAdmin, SinBackend } from '@/components/admin/Chasis'
import { FormularioCategoria } from '@/components/admin/FormularioCategoria'
import { faltantesDeBackend, panelOperativo } from '@/lib/supabase/env'
import { exigirAdmin } from '@/server/autorizacion'

export const metadata = { title: 'Nueva categoría' }

export default async function PaginaNuevaCategoria() {
  if (!panelOperativo()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  return (
    <>
      <CabeceraAdmin
        titulo="Nueva categoría"
        migas={[{ etiqueta: 'Categorías', href: '/admin/categorias' }, { etiqueta: 'Nueva' }]}
        descripcion="Con foto y nombre alcanza. La descripción ayuda al cliente a ubicarse."
      />
      <div className="px-4 py-6 lg:px-8">
        <FormularioCategoria />
      </div>
    </>
  )
}
