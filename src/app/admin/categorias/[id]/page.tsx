import { notFound } from 'next/navigation'
import { CabeceraAdmin, SinBackend } from '@/components/admin/Chasis'
import { FormularioCategoria } from '@/components/admin/FormularioCategoria'
import type { ImagenExistente } from '@/components/admin/SubidorImagen'
import { faltantesDeBackend, panelOperativo } from '@/lib/supabase/env'
import { exigirAdmin } from '@/server/autorizacion'
import { categoriaPorId, urlPublica } from '@/server/catalogo/repositorio'
import type { FilaCategoria } from '@/lib/supabase/tipos'

export const metadata = { title: 'Editar categoría' }

export default async function PaginaCategoria({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!panelOperativo()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  const { id } = await params
  const categoria = await categoriaPorId(id)
  if (!categoria) notFound()

  const imagenActual: ImagenExistente | null = categoria.media_assets
    ? { url: urlPublica(categoria.media_assets.path), alt: `Categoría ${categoria.name}` }
    : null

  return (
    <>
      <CabeceraAdmin
        titulo={categoria.name}
        migas={[
          { etiqueta: 'Categorías', href: '/admin/categorias' },
          { etiqueta: categoria.name },
        ]}
      />
      <div className="px-4 py-6 lg:px-8">
        <FormularioCategoria
          categoria={categoria as FilaCategoria}
          imagenActual={imagenActual}
        />
      </div>
    </>
  )
}
