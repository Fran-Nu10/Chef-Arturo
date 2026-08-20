import { notFound } from 'next/navigation'
import { CabeceraAdmin, SinBackend } from '@/components/admin/Chasis'
import { FormularioProducto } from '@/components/admin/FormularioProducto'
import type { ImagenExistente } from '@/components/admin/SubidorImagen'
import { faltantesDeBackend, panelOperativo } from '@/lib/supabase/env'
import { exigirAdmin } from '@/server/autorizacion'
import {
  listarCategoriasAdmin,
  productoPorId,
  urlPublica,
} from '@/server/catalogo/repositorio'
import type { FilaProducto } from '@/lib/supabase/tipos'

export const metadata = { title: 'Editar producto' }

interface ImagenRelacionada {
  id: string
  media_id: string
  alt: string
  position: number
  is_primary: boolean
  media_assets: { path: string; alt: string } | null
}

export default async function PaginaProducto({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  if (!panelOperativo()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  const [{ id }, q] = await Promise.all([params, searchParams])
  const [producto, categorias] = await Promise.all([
    productoPorId(id),
    listarCategoriasAdmin(),
  ])
  if (!producto) notFound()

  // La foto principal del producto, ya como URL: el formulario no maneja
  // rutas ni ids de Storage.
  const imagenes = (producto as unknown as { product_images?: ImagenRelacionada[] })
    .product_images ?? []
  const principal =
    imagenes.find((i) => i.is_primary) ??
    [...imagenes].sort((a, b) => a.position - b.position)[0]
  const imagenActual: ImagenExistente | null = principal?.media_assets
    ? { url: urlPublica(principal.media_assets.path), alt: principal.alt || producto.name }
    : null

  return (
    <>
      <CabeceraAdmin
        titulo={producto.name}
        migas={[
          { etiqueta: 'Productos', href: '/admin/productos' },
          { etiqueta: producto.name },
        ]}
      />
      <div className="flex flex-col gap-4 px-4 py-6 lg:px-8">
        {q.guardado === '1' && (
          <p
            role="status"
            className="m-0 mx-auto w-full max-w-[720px] border border-verde bg-verde/[0.07] px-3 py-2.5 text-[13px] text-verde"
          >
            {producto.status === 'active' ? 'Producto publicado.' : 'Producto guardado.'}
          </p>
        )}
        <FormularioProducto
          producto={producto as unknown as FilaProducto}
          categorias={categorias ?? []}
          imagenActual={imagenActual}
        />
      </div>
    </>
  )
}
