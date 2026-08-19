'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { CATEGORIAS } from '@/content/datos'
import type { CategoriaSlug } from '@/content/tipos'
import { MediaPendiente } from '@/components/ui/MediaPendiente'
import { EncabezadoSeccion } from '@/components/ui/Reveal'

/**
 * 02 · ELEGÍ TU OCASIÓN — navegación comercial entre las tres categorías.
 *
 * Desktop: tres ventanas editoriales, una activa que crece (flex-grow 1 → 1.8)
 * y cambia el peso del copy al pasar el mouse o hacer click.
 * Mobile: carrusel horizontal con scroll-snap nativo, una tarjeta dominante,
 * parte de la siguiente visible, e indicadores de posición.
 */
export function ElegiTuOcasion({ inicial = 'pasteleria' }: { inicial?: CategoriaSlug }) {
  const [activa, setActiva] = useState<CategoriaSlug>(inicial)
  const [indice, setIndice] = useState(0)
  const riel = useRef<HTMLDivElement>(null)

  // En mobile el indicador sigue al scroll nativo del carrusel.
  useEffect(() => {
    const el = riel.current
    if (!el) return
    const alScrollear = () => {
      if (window.innerWidth >= 1024) return
      const recorrido = el.scrollWidth - el.clientWidth
      const i =
        recorrido > 0
          ? Math.round((el.scrollLeft / recorrido) * (CATEGORIAS.length - 1))
          : 0
      setIndice(Math.min(CATEGORIAS.length - 1, Math.max(0, i)))
    }
    el.addEventListener('scroll', alScrollear, { passive: true })
    return () => el.removeEventListener('scroll', alScrollear)
  }, [])

  return (
    <section
      aria-label="Elegí tu ocasión"
      className="relative z-2 bg-papel pt-[clamp(56px,8vw,104px)] pb-[clamp(40px,5vw,72px)]"
    >
      <div className="px-[clamp(16px,3.4vw,48px)]">
        <EncabezadoSeccion numero="02" kicker="NAVEGACIÓN" titulo="Elegí tu ocasión" />
      </div>

      <div
        ref={riel}
        className="riel flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-[clamp(16px,3.4vw,48px)] pt-[26px] pb-2 lg:snap-none lg:gap-5 lg:overflow-visible lg:px-[clamp(16px,3.4vw,48px)]"
      >
        {CATEGORIAS.map((categoria) => {
          const esActiva = activa === categoria.slug
          return (
            <Link
              key={categoria.slug}
              href={`/catalogo/${categoria.slug}`}
              onMouseEnter={() => setActiva(categoria.slug)}
              onFocus={() => setActiva(categoria.slug)}
              aria-current={esActiva ? 'true' : undefined}
              style={{ flexGrow: esActiva ? 1.8 : 1 }}
              className={`box-border flex min-w-[76%] shrink-0 snap-center flex-col gap-3.5 border bg-papel-alt px-[18px] pt-[18px] pb-5 no-underline transition-[flex-grow,border-color] duration-500 ease-editorial lg:min-w-0 lg:shrink lg:basis-0 ${
                esActiva ? 'border-verde' : 'border-linea'
              }`}
            >
              <MediaPendiente
                etiqueta={categoria.imagenPendiente}
                slot={`home-categoria-${categoria.slug}`}
                sizes="(max-width: 1023px) 76vw, 33vw"
                forma="arco"
                className="h-[clamp(220px,26vw,320px)]"
              />
              <div className="flex items-baseline justify-between gap-2.5">
                <span className="font-display text-subtitulo text-tinta">
                  {categoria.nombre}
                </span>
                <span className="tnum font-display text-lg text-caramelo">
                  {categoria.numero}
                </span>
              </div>
              <p
                className={`m-0 text-[13px] leading-relaxed text-tinta-suave transition-opacity duration-[400ms] ${
                  esActiva ? 'opacity-100' : 'opacity-55'
                }`}
              >
                {categoria.descripcion}
              </p>
              <span className="text-[13px] font-semibold text-caramelo-texto underline underline-offset-[3px]">
                {categoria.cta}
              </span>
            </Link>
          )
        })}
      </div>

      <div
        className="flex justify-center gap-2 pt-3.5 lg:hidden"
        role="group"
        aria-label="Posición del carrusel"
      >
        {CATEGORIAS.map((categoria, i) => (
          <span
            key={categoria.slug}
            aria-label={`${categoria.nombre}${i === indice ? ' (visible)' : ''}`}
            className={`h-[3px] w-[26px] transition-colors duration-300 ${
              i === indice ? 'bg-caramelo' : 'bg-linea'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
