'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Producto } from '@/content/tipos'
import { usePedido } from './estado-pedido'

export type EstadoAgregado = 'reposo' | 'agregando' | 'agregado'

interface Aspecto {
  etiqueta: string
  /** Variante visual del botón, resuelta contra los tokens del sistema. */
  clase: string
  deshabilitado: boolean
}

/**
 * Ciclo de "Agregar al carrito": reposo → agregando → agregado ✓ (1.6s) →
 * reposo. Es feedback funcional, así que también existe con reduced motion.
 *
 * El producto entra al carrito **en el mismo toque**, no al terminar la
 * animación. Antes se esperaban 700ms antes de llamar a `agregar()`: durante
 * ese rato el badge no se movía y el toque parecía ignorado. Ahora el estado
 * cambia primero y la etiqueta "Agregando…" acompaña, no bloquea.
 */
export function useAgregar(producto: Producto | undefined) {
  const { agregar } = usePedido()
  const [estado, setEstado] = useState<EstadoAgregado>('reposo')
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const pendientes = temporizadores.current
    return () => pendientes.forEach(clearTimeout)
  }, [])

  // Cambiar de producto reinicia el ciclo.
  useEffect(() => {
    setEstado('reposo')
  }, [producto?.slug])

  const agotado =
    !producto ||
    producto.disponibilidad === 'agotado' ||
    producto.disponibilidad === 'no-disponible'

  const activar = useCallback(() => {
    if (agotado || estado !== 'reposo' || !producto) return
    // Primero el carrito, después el gesto.
    agregar(producto.slug)
    setEstado('agregado')
    temporizadores.current.push(setTimeout(() => setEstado('reposo'), 1600))
  }, [agotado, estado, producto, agregar])

  const aspecto: Aspecto = agotado
    ? {
        etiqueta:
          producto?.disponibilidad === 'agotado' ? 'Agotado hoy' : 'No disponible',
        clase: 'bg-crema text-tinta-tenue border border-linea cursor-not-allowed',
        deshabilitado: true,
      }
    : estado === 'agregando'
      ? {
          etiqueta: 'Agregando…',
          clase: 'bg-[#2C5A4E] text-papel border border-[#2C5A4E]',
          deshabilitado: true,
        }
      : estado === 'agregado'
        ? {
            etiqueta: 'Agregado ✓',
            clase: 'bg-caramelo text-papel border border-caramelo',
            deshabilitado: true,
          }
        : {
            etiqueta: 'Agregar al carrito',
            clase: 'bg-verde text-papel border border-verde hover:bg-verde-profundo',
            deshabilitado: false,
          }

  return { estado, activar, aspecto }
}
