'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Categoria } from '@/content/tipos'

/**
 * Las categorías del catálogo, disponibles en todo el árbol.
 *
 * El header las necesita para su navegación, y el header aparece dentro de
 * `Pantalla`, que se usa desde ocho componentes cliente. Un componente cliente
 * no puede renderizar uno de servidor, así que `Pantalla` no puede leer la
 * base por su cuenta y pasarlas por props implicaría tocar quince páginas.
 *
 * Se resuelven una vez en el layout raíz —que sí es de servidor— y viajan por
 * contexto. Son datos públicos: es lo mismo que el visitante ve en el menú.
 */
const Contexto = createContext<Categoria[]>([])

export function ProveedorCategorias({
  categorias,
  children,
}: {
  categorias: Categoria[]
  children: ReactNode
}) {
  return <Contexto.Provider value={categorias}>{children}</Contexto.Provider>
}

export function useCategorias(): Categoria[] {
  return useContext(Contexto)
}
