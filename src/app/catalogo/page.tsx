import type { Metadata } from 'next'
import { Catalogo } from '@/components/pantallas/Catalogo'
import { Pantalla } from '@/components/pantallas/Estructura'

export const metadata: Metadata = { title: 'Catálogo' }

/** Pantallas 1 y 3 · Catálogo general y búsqueda sin resultados. */
export default function PaginaCatalogo() {
  return (
    <Pantalla ancho="ancho">
      <Catalogo />
    </Pantalla>
  )
}
