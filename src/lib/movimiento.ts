'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

/** Interpolación suave (smoothstep) usada por los dos picos de movimiento. */
export function suave(t: number): number {
  const c = Math.max(0, Math.min(1, t))
  return c * c * (3 - 2 * c)
}

/** `suave` sobre un tramo [desde, hasta] del progreso de scroll. */
export function tramo(p: number, desde: number, hasta: number): number {
  return suave((p - desde) / (hasta - desde))
}

export interface Medidas {
  /** Centro del elemento en el viewport, sin transformar. */
  cx: number
  cy: number
  ancho: number
  alto: number
  vw: number
  vh: number
}

/**
 * Mide un elemento que nunca se transforma, para poder llevar su gemelo animado
 * al centro exacto del viewport. Se recalcula al montar y al redimensionar.
 *
 * Las medidas son *relativas al contenedor sticky*: mientras el tramo está
 * pineado ese contenedor coincide con el viewport, así que el resultado no
 * depende de cuánto se haya scrolleado al medir.
 */
export function useMedidas(
  ref: RefObject<HTMLElement | null>,
  refSticky: RefObject<HTMLElement | null>,
): Medidas | null {
  const [medidas, setMedidas] = useState<Medidas | null>(null)
  const pendiente = useRef(false)

  useEffect(() => {
    const medir = () => {
      const el = ref.current
      const sticky = refSticky.current
      if (!el || !sticky) return
      const r = el.getBoundingClientRect()
      const s = sticky.getBoundingClientRect()
      setMedidas({
        cx: r.left - s.left + r.width / 2,
        cy: r.top - s.top + r.height / 2,
        ancho: r.width || 1,
        alto: r.height || 1,
        vw: s.width || 1,
        vh: s.height || 1,
      })
    }

    const alRedimensionar = () => {
      if (pendiente.current) return
      pendiente.current = true
      requestAnimationFrame(() => {
        pendiente.current = false
        medir()
      })
    }

    medir()
    window.addEventListener('resize', alRedimensionar, { passive: true })
    return () => window.removeEventListener('resize', alRedimensionar)
  }, [ref, refSticky])

  return medidas
}
