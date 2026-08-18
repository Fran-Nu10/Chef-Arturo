import type { Metadata } from 'next'
import { Pantalla } from '@/components/pantallas/Estructura'
import { VistaCarrito } from '@/components/pantallas/VistaCarrito'

export const metadata: Metadata = { title: 'Tu carrito' }

/** Pantallas 9 y 10 · Carrito vacío y carrito con productos. */
export default function PaginaCarrito() {
  return (
    <Pantalla>
      <VistaCarrito />
    </Pantalla>
  )
}
