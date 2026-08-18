'use client'

import { useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { GALERIA_RIEL_1, GALERIA_RIEL_2, NEGOCIO } from '@/content/datos'
import type { ItemGaleria } from '@/content/tipos'
import { MarcaVideo, MediaPendiente } from '@/components/ui/MediaPendiente'
import { EncabezadoSeccion } from '@/components/ui/Reveal'

/** Deriva de cada riel respecto del deltaY del scroll (Especificación § 3). */
const DERIVA = { riel1: 0.3, riel2: -0.22 }

const TAMANO = {
  riel1: { vertical: 'w-[210px] h-[270px]', horizontal: 'w-[340px] h-[270px]' },
  riel2: { vertical: 'w-[170px] h-[200px]', horizontal: 'w-[300px] h-[200px]' },
} as const

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

function Pieza({ item, riel }: { item: ItemGaleria; riel: 'riel1' | 'riel2' }) {
  return (
    <MediaPendiente
      etiqueta={item.alt}
      className={`flex-none ${TAMANO[riel][item.orientacion]} ${
        item.tipo === 'video' ? 'border-verde' : ''
      }`}
      marca={
        item.tipo === 'video' ? (
          <MarcaVideo posicion="izquierda">VIDEO</MarcaVideo>
        ) : undefined
      }
    />
  )
}

/**
 * 08 · LA MESA DE CHEF ARTURO — galería administrable de fotos reales.
 *
 * No incrusta el feed de Instagram: es una colección propia (src, ratio, alt,
 * orden, tipo, link opcional) para no depender de una integración externa.
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
        className="riel flex cursor-grab gap-3.5 overflow-x-auto px-[clamp(16px,3.4vw,48px)] pt-[26px] pb-2"
      >
        {GALERIA_RIEL_1.map((item) => (
          <Pieza key={item.id} item={item} riel="riel1" />
        ))}
      </div>

      <div
        ref={riel2}
        className="riel flex cursor-grab gap-3.5 overflow-x-auto px-[clamp(16px,3.4vw,48px)] pt-3.5 pb-2"
      >
        {GALERIA_RIEL_2.map((item) => (
          <Pieza key={item.id} item={item} riel="riel2" />
        ))}
        <a
          href={NEGOCIO.whatsapp}
          className="flex h-[200px] w-[170px] flex-none items-center justify-center rounded-borde border border-linea bg-crema px-3.5 text-center text-xs font-semibold text-caramelo-texto"
        >
          Ver más en Instagram →
        </a>
      </div>
    </section>
  )
}
