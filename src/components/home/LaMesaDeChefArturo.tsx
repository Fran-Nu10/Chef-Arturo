'use client'

import { useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { NEGOCIO } from '@/content/datos'
import { fotoDeSlot } from '@/content/imagenes'
import { MediaPendiente } from '@/components/ui/MediaPendiente'
import { EncabezadoSeccion } from '@/components/ui/Reveal'

/** Deriva de cada riel respecto del deltaY del scroll (Especificación § 3). */
const DERIVA = { riel1: 0.3, riel2: -0.22 }

interface Pieza {
  /** Slot del manifiesto. Sin foto asignada, la pieza queda marcada como pendiente. */
  slot: string
  /** Tamaño de la pieza: el ritmo es irregular a propósito, no una grilla. */
  caja: string
  sizes: string
  /** Qué falta, cuando falta. */
  pendiente: string
}

/**
 * Composición de los dos rieles.
 *
 * Los tamaños alternan vertical, apaisado y pequeño para romper el ritmo. Las
 * fotos disponibles se colocaron en la caja que mejor les cae: los interiores
 * aguantan el recorte apaisado, el salón con ventanal pide formato vertical.
 */
const RIEL_1: Pieza[] = [
  {
    slot: 'mesa-1',
    caja: 'w-[240px] h-[320px]',
    sizes: '240px',
    pendiente: 'Foto vertical — pendiente',
  },
  {
    slot: 'mesa-2',
    caja: 'w-[380px] h-[280px]',
    sizes: '380px',
    pendiente: 'Foto horizontal — pendiente',
  },
  {
    slot: 'mesa-4',
    caja: 'w-[200px] h-[300px]',
    sizes: '200px',
    pendiente: 'Foto vertical — pendiente',
  },
]

const RIEL_2: Pieza[] = [
  {
    slot: 'mesa-3',
    caja: 'w-[210px] h-[270px]',
    sizes: '210px',
    pendiente: 'Foto vertical — pendiente',
  },
  {
    slot: 'mesa-6',
    caja: 'w-[300px] h-[210px]',
    sizes: '300px',
    pendiente: 'Foto horizontal — pendiente',
  },
]

/**
 * Dos rieles a velocidades distintas. El scroll los desplaza levemente; el drag
 * y el swipe son nativos y pausan la deriva mientras se interactúa.
 * Con reduced motion no hay deriva: sólo swipe y drag.
 */
function useDeriva(
  refs: { el: React.RefObject<HTMLDivElement | null>; factor: number }[],
  activo: boolean,
) {
  useEffect(() => {
    if (!activo) return
    let ultimoY = window.scrollY
    let enCola = false
    let pausado = false

    const aplicar = () => {
      enCola = false
      const delta = window.scrollY - ultimoY
      ultimoY = window.scrollY
      // Un salto grande (anclas, restauración de scroll) no debe arrastrar los rieles.
      if (pausado || Math.abs(delta) >= 200) return
      for (const { el, factor } of refs) {
        if (el.current) el.current.scrollLeft += delta * factor
      }
    }

    const alScrollear = () => {
      if (enCola) return
      enCola = true
      requestAnimationFrame(aplicar)
    }

    const pausar = () => (pausado = true)
    const reanudar = () => (pausado = false)

    window.addEventListener('scroll', alScrollear, { passive: true })
    const limpiezas = refs.map(({ el }) => {
      const nodo = el.current
      if (!nodo) return () => {}
      nodo.addEventListener('pointerenter', pausar)
      nodo.addEventListener('pointerleave', reanudar)
      nodo.addEventListener('touchstart', pausar, { passive: true })
      nodo.addEventListener('touchend', reanudar, { passive: true })
      return () => {
        nodo.removeEventListener('pointerenter', pausar)
        nodo.removeEventListener('pointerleave', reanudar)
        nodo.removeEventListener('touchstart', pausar)
        nodo.removeEventListener('touchend', reanudar)
      }
    })

    return () => {
      window.removeEventListener('scroll', alScrollear)
      limpiezas.forEach((fn) => fn())
    }
  }, [refs, activo])
}

function PiezaGaleria({ pieza }: { pieza: Pieza }) {
  const foto = fotoDeSlot(pieza.slot)
  return (
    <MediaPendiente
      slot={pieza.slot}
      etiqueta={pieza.pendiente}
      sizes={pieza.sizes}
      className={`flex-none ${pieza.caja} ${foto ? '' : 'border-dashed'}`}
    />
  )
}

/**
 * 08 · LA MESA DE CHEF ARTURO — galería administrable de fotos del negocio.
 *
 * No incrusta el feed de Instagram: es una colección propia (slot, ratio, alt,
 * orden) para no depender de una integración externa. Las piezas sin foto
 * quedan marcadas con borde punteado en vez de desaparecer, así se ve qué falta.
 */
export function LaMesaDeChefArturo() {
  const reducido = useReducedMotion()
  const riel1 = useRef<HTMLDivElement>(null)
  const riel2 = useRef<HTMLDivElement>(null)
  const rieles = useRef([
    { el: riel1, factor: DERIVA.riel1 },
    { el: riel2, factor: DERIVA.riel2 },
  ]).current

  useDeriva(rieles, !reducido)

  return (
    <section
      aria-label="La mesa de Chef Arturo"
      className="overflow-hidden border-t border-linea py-[clamp(48px,6vw,80px)]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4 px-[clamp(16px,3.4vw,48px)]">
        <EncabezadoSeccion numero="08" kicker="GALERÍA" titulo="La mesa de Chef Arturo" />
        <a
          href={NEGOCIO.whatsapp}
          className="inline-flex min-h-[44px] items-center text-[13px] font-semibold text-caramelo-texto underline underline-offset-[3px]"
        >
          Ver en Instagram →
        </a>
      </div>

      <div
        ref={riel1}
        className="riel flex cursor-grab items-end gap-3.5 overflow-x-auto px-[clamp(16px,3.4vw,48px)] pt-[26px] pb-2"
      >
        {RIEL_1.map((pieza) => (
          <PiezaGaleria key={pieza.slot} pieza={pieza} />
        ))}
      </div>

      <div
        ref={riel2}
        className="riel flex cursor-grab items-start gap-3.5 overflow-x-auto px-[clamp(16px,3.4vw,48px)] pt-3.5 pb-2"
      >
        {RIEL_2.map((pieza) => (
          <PiezaGaleria key={pieza.slot} pieza={pieza} />
        ))}
        <a
          href={NEGOCIO.whatsapp}
          className="flex h-[210px] w-[170px] flex-none items-center justify-center rounded-borde border border-linea bg-crema px-3.5 text-center text-xs font-semibold text-caramelo-texto"
        >
          Ver más en Instagram →
        </a>
      </div>
    </section>
  )
}
