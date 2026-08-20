import type { Metadata } from 'next'
import { Catalogo } from '@/components/pantallas/Catalogo'
import { Pantalla } from '@/components/pantallas/Estructura'
import { catalogoPublico } from '@/server/storefront/consultas'

export const metadata: Metadata = { title: 'Catálogo' }

/** Pantallas 1 y 3 · Catálogo general y búsqueda sin resultados. */
export default async function PaginaCatalogo() {
  const { categorias, productos, caido } = await catalogoPublico()

  return (
    <Pantalla ancho="ancho">
      <Catalogo categorias={categorias} productos={productos} caido={caido} />
    </Pantalla>
  )
}
