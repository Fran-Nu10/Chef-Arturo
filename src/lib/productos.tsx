'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Producto } from '@/content/tipos'

/**
 * El catálogo de productos, disponible en todo el árbol.
 *
 * El carrito, el resumen de compra y la barra de contexto del checkout
 * necesitan resolver un `productoSlug` guardado en el pedido —el estado del
 * carrito sólo guarda el slug y la cantidad— a un producto con nombre, precio
 * y modalidad para poder mostrarlo. Antes lo resolvían contra
 * `PRODUCTOS` de `src/content/datos.ts`, el fixture de doce productos de
 * ejemplo del prototipo original.
 *
 * Desde que el catálogo se carga en Supabase, ese fixture ya no tiene los
 * productos reales: un producto agregado al carrito desde `/catalogo`
 * simplemente desaparecía de la vista del carrito sin ningún aviso —
 * `if (!producto) return null` silencioso—. Por eso el carrito ahora resuelve
 * contra el mismo catálogo que ya se lee en el layout raíz para las
 * categorías: mismo origen de datos, ninguna consulta extra.
 *
 * Igual que `categorias.tsx`, se resuelve una vez en el layout raíz —de
 * servidor— y baja por contexto: un componente cliente no puede volver a
 * consultar la base sin un viaje de red, y el carrito se abre y cierra
 * seguido.
 */
const Contexto = createContext<Producto[]>([])

export function ProveedorProductos({
  productos,
  children,
}: {
  productos: Producto[]
  children: ReactNode
}) {
  return <Contexto.Provider value={productos}>{children}</Contexto.Provider>
}

export function useProductos(): Producto[] {
  return useContext(Contexto)
}

export function useProductoPorSlug(slug: string): Producto | undefined {
  const productos = useContext(Contexto)
  return productos.find((p) => p.slug === slug)
}
