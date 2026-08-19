import { notFound } from 'next/navigation'
import { CabeceraAdmin, SinBackend } from '@/components/admin/Chasis'
import { FormularioProducto } from '@/components/admin/FormularioProducto'
import { faltantesDeBackend, hayBackend } from '@/lib/supabase/env'
import { exigirAdmin } from '@/server/autorizacion'
import { listarCategoriasAdmin, productoPorId } from '@/server/catalogo/repositorio'
import type { FilaProducto } from '@/lib/supabase/tipos'

export const metadata = { title: 'Editar producto' }

export default async function PaginaProducto({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!hayBackend()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  const { id } = await params
  const [producto, categorias] = await Promise.all([
    productoPorId(id),
    listarCategoriasAdmin(),
  ])
  if (!producto) notFound()

  return (
    <>
      <CabeceraAdmin
        titulo={producto.name}
        migas={[
          { etiqueta: 'Productos', href: '/admin/productos' },
          { etiqueta: producto.name },
        ]}
      />
      <div className="px-4 py-6 lg:px-8">
        <FormularioProducto
          producto={producto as unknown as FilaProducto}
          categorias={categorias ?? []}
        />
      </div>
    </>
  )
}
