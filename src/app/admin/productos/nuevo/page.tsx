import { CabeceraAdmin, SinBackend } from '@/components/admin/Chasis'
import { FormularioProducto } from '@/components/admin/FormularioProducto'
import { faltantesDeBackend, panelOperativo } from '@/lib/supabase/env'
import { exigirAdmin } from '@/server/autorizacion'
import { listarCategoriasAdmin } from '@/server/catalogo/repositorio'

export const metadata = { title: 'Nuevo producto' }

export default async function PaginaNuevoProducto() {
  if (!panelOperativo()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()
  const categorias = await listarCategoriasAdmin()

  return (
    <>
      <CabeceraAdmin
        titulo="Nuevo producto"
        migas={[{ etiqueta: 'Productos', href: '/admin/productos' }, { etiqueta: 'Nuevo' }]}
        descripcion="Se crea como borrador salvo que elijas otro estado."
      />
      <div className="px-4 py-6 lg:px-8">
        <FormularioProducto categorias={categorias ?? []} />
      </div>
    </>
  )
}
