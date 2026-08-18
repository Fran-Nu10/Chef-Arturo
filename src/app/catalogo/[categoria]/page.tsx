import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CATEGORIAS, categoriaPorSlug } from '@/content/datos'
import type { CategoriaSlug } from '@/content/tipos'
import { Catalogo } from '@/components/pantallas/Catalogo'
import { BarraContexto, Actual } from '@/components/pantallas/BarraContexto'
import { Pantalla } from '@/components/pantallas/Estructura'

export function generateStaticParams() {
  return CATEGORIAS.map((c) => ({ categoria: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string }>
}): Promise<Metadata> {
  const { categoria } = await params
  return { title: categoriaPorSlug(categoria)?.nombre ?? 'Catálogo' }
}

/** Pantalla 2 · Catálogo filtrado por categoría. */
export default async function PaginaCategoria({
  params,
}: {
  params: Promise<{ categoria: string }>
}) {
  const { categoria } = await params
  const encontrada = categoriaPorSlug(categoria)
  if (!encontrada) notFound()

  return (
    <Pantalla ancho="ancho">
      <BarraContexto volverA="/catalogo">
        <span>Catálogo /</span>
        <Actual>{encontrada.nombre}</Actual>
      </BarraContexto>
      <Catalogo categoria={categoria as CategoriaSlug} />
    </Pantalla>
  )
}
