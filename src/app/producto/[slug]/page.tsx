import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { catalogoPublico, productoPublico } from '@/server/storefront/consultas'
import { Actual, BarraContexto } from '@/components/pantallas/BarraContexto'
import { Pantalla } from '@/components/pantallas/Estructura'
import { FichaProducto } from '@/components/pantallas/FichaProducto'

// Sin `generateStaticParams`: los productos salen de la base y se publican
// desde el panel, así que la ficha se resuelve en cada visita.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return { title: (await productoPublico(slug))?.nombre ?? 'Producto' }
}

/** Pantallas 4–7 · Ficha directa, por encargo, con fecha requerida y no disponible. */
export default async function PaginaProducto({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const producto = await productoPublico(slug)
  if (!producto) notFound()

  const { categorias } = await catalogoPublico()
  const categoria = categorias.find((c) => c.slug === producto.categoria)

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
