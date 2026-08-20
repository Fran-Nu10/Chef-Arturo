import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { CategoriaSlug } from '@/content/tipos'
import { catalogoPublico } from '@/server/storefront/consultas'
import { Catalogo } from '@/components/pantallas/Catalogo'
import { BarraContexto, Actual } from '@/components/pantallas/BarraContexto'
import { Pantalla } from '@/components/pantallas/Estructura'

// Sin `generateStaticParams`: las categorías salen de la base y cambian desde
// el panel, así que la ruta se resuelve en cada visita.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string }>
}): Promise<Metadata> {
  const { categoria } = await params
  const { categorias } = await catalogoPublico()
  return { title: categorias.find((c) => c.slug === categoria)?.nombre ?? 'Catálogo' }
}

/** Pantalla 2 · Catálogo filtrado por categoría. */
export default async function PaginaCategoria({
  params,
}: {
  params: Promise<{ categoria: string }>
}) {
  const { categoria } = await params
  const { categorias, productos, caido } = await catalogoPublico()
  const encontrada = categorias.find((c) => c.slug === categoria)
  if (!encontrada) notFound()

  return (
    <Pantalla ancho="ancho">
      <BarraContexto volverA="/catalogo">
        <span>Catálogo /</span>
        <Actual>{encontrada.nombre}</Actual>
      </BarraContexto>
      <Catalogo
        categoria={categoria as CategoriaSlug}
        categorias={categorias}
        productos={productos}
        caido={caido}
      />
    </Pantalla>
  )
}
