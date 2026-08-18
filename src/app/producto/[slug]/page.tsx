import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PRODUCTOS, categoriaPorSlug, productoPorSlug } from '@/content/datos'
import { Actual, BarraContexto } from '@/components/pantallas/BarraContexto'
import { Pantalla } from '@/components/pantallas/Estructura'
import { FichaProducto } from '@/components/pantallas/FichaProducto'

export function generateStaticParams() {
  return PRODUCTOS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return { title: productoPorSlug(slug)?.nombre ?? 'Producto' }
}

/** Pantallas 4–7 · Ficha directa, por encargo, con fecha requerida y no disponible. */
export default async function PaginaProducto({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const producto = productoPorSlug(slug)
  if (!producto) notFound()

  const categoria = categoriaPorSlug(producto.categoria)

  return (
    <Pantalla>
      <BarraContexto volverA={`/catalogo/${producto.categoria}`}>
        <span>{categoria?.nombre}</span>
        {producto.modalidad === 'encargo' && (
          <>
            <span>/</span>
            <Actual>Por encargo</Actual>
          </>
        )}
      </BarraContexto>
      <FichaProducto producto={producto} />
    </Pantalla>
  )
}
