'use client'

import { ContenidoCarrito } from '@/components/layout/Carrito'
import { Actual, BarraContexto } from '@/components/pantallas/BarraContexto'
import { usePedido } from '@/lib/estado-pedido'

/**
 * Pantallas 9 y 10 · Carrito como página.
 *
 * `/carrito` sigue existiendo como URL directa —hay enlaces compartidos y
 * accesos guardados— pero ya no es un paso del flujo normal: el header y la
 * barra inferior abren el drawer. Para que no haya dos carritos distintos,
 * esta página renderiza exactamente el mismo contenido que el drawer.
 */
export function VistaCarrito() {
  const { cantidad, hidratado } = usePedido()

  return (
    <div className="flex min-h-[70svh] flex-col">
      <BarraContexto volverA="/catalogo">
        <Actual>Tu carrito</Actual>
        {hidratado && cantidad > 0 && (
          <span className="tnum">
            · {cantidad} {cantidad === 1 ? 'producto' : 'productos'}
          </span>
        )}
      </BarraContexto>

      <ContenidoCarrito />
    </div>
  )
}
