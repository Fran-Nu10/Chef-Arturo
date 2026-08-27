'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { CAMPANAS } from '@/content/datos'
import type { EstadoCampana } from '@/content/tipos'
import { MediaPendiente } from '@/components/ui/MediaPendiente'
import { EncabezadoSeccion } from '@/components/ui/Reveal'

/** Cada estado tiene su propio peso visual dentro del archivo editorial. */
const ESTADO: Record<
  EstadoCampana,
  {
    etiqueta: string
    chip: string
    tarjeta: string
    referencia: string
    titulo: string
    texto: string
    condicion: string
    boton?: string
  }
> = {
  activa: {
    etiqueta: 'ACTIVA',
    chip: 'bg-verde text-papel',
    tarjeta: 'border-verde bg-papel-alt',
    referencia: 'text-caramelo',
    titulo: 'text-tinta',
    texto: 'text-tinta-suave',
    condicion: 'text-caramelo-texto',
    boton: 'bg-verde text-papel border border-verde hover:bg-verde-profundo',
  },
  programada: {
    etiqueta: 'PROGRAMADA',
    chip: 'border border-verde text-verde',
    tarjeta: 'border-linea bg-papel-alt',
    referencia: 'text-caramelo',
    titulo: 'text-tinta',
    texto: 'text-tinta-suave',
    condicion: 'text-caramelo-texto',
    boton: 'border border-verde text-verde hover:bg-verde/[0.07]',
  },
  finalizada: {
    etiqueta: 'FINALIZADA',
    chip: 'border border-linea-fuerte text-tinta-suave',
    tarjeta: 'border-linea bg-crema-apagado opacity-[0.72]',
    referencia: 'text-linea-fuerte',
    titulo: 'text-tinta-suave',
    texto: 'text-tinta-tenue',
    condicion: 'text-tinta-tenue',
  },
}

/** Padding lateral de la sección. El carril lo repite para alinearse con el título. */
const PADDING = 'clamp(16px,3.4vw,48px)'

/**
 * 06 · FECHAS QUE IMPORTAN — las tres formas de comprar.
 *
 * Hasta `md` es un carril horizontal con scroll nativo y snap; desde `md`, una
 * grilla de tres columnas sin carril ni ayudas de deslizamiento.
 *
 * El carril sangra hasta el borde derecho de la pantalla —el padding lo lleva
 * él, no la sección— para que la tarjeta siguiente asome de verdad en lugar de
 * anunciarse sólo con puntos.
 */
export function FechasQueImportan() {
  const carril = useRef<HTMLDivElement>(null)
  const [activa, setActiva] = useState(0)
  const [montado, setMontado] = useState(false)
  const reducido = useReducedMotion()

  useEffect(() => setMontado(true), [])

  // Qué tarjeta se está mirando. Con IntersectionObserver en vez de escuchar
  // `scroll`: no corre en cada cuadro y da la respuesta ya calculada.
  useEffect(() => {
    const pista = carril.current
    if (!pista || typeof IntersectionObserver === 'undefined') return

    const tarjetas = [...pista.querySelectorAll<HTMLElement>('[data-campana]')]
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            setActiva(tarjetas.indexOf(entrada.target as HTMLElement))
          }
        }
      },
      // 0.6 con tarjetas al 86% del ancho: en cualquier posición de snap hay
      // exactamente una que supera el umbral.
      { root: pista, threshold: 0.6 },
    )

    for (const t of tarjetas) observador.observe(t)
    return () => observador.disconnect()
  }, [])

  const irA = (indice: number) => {
    const pista = carril.current
    if (!pista) return
    const tarjetas = pista.querySelectorAll<HTMLElement>('[data-campana]')
    const destino = tarjetas[indice]
    const primera = tarjetas[0]
    if (!destino || !primera) return
    // `offsetLeft` de la primera equivale al padding inicial del carril, así
    // que restarlo deja la tarjeta elegida justo sobre ese borde.
    pista.scrollTo({
      left: destino.offsetLeft - primera.offsetLeft,
      behavior: reducido ? 'auto' : 'smooth',
    })
  }

  return (
    <section
      aria-label="Fechas que importan"
      className="border-b border-linea pt-[clamp(56px,7vw,96px)] pb-[clamp(48px,6vw,80px)]"
    >
      <div className="px-[clamp(16px,3.4vw,48px)]">
        <EncabezadoSeccion
          numero="06"
          kicker="CAMPAÑAS"
          titulo="Fechas que importan"
          bajada="Las tres formas de comprar: del día, por encargo con fecha, o cotizado para tu evento."
        />
      </div>

      {/*
        El carril lleva su propio padding en vez de heredar el de la sección:
        así el contenido arranca alineado con el título y el track llega hasta
        el borde derecho. `scroll-pl` alinea el snap con ese mismo padding, y
        `pr` al 14% del ancho es lo que le permite a la tercera tarjeta quedar
        pegada al borde izquierdo cuando se llega al final.
      */}
      <div
        ref={carril}
        role="group"
        aria-label="Campañas, carrusel de 3"
        tabIndex={0}
        className="riel flex snap-x snap-mandatory items-stretch gap-[14px] overflow-x-auto pt-[26px] pb-2.5 pl-[clamp(16px,3.4vw,48px)] pr-[14vw] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-caramelo md:grid md:grid-cols-3 md:gap-[18px] md:overflow-visible md:pr-[clamp(16px,3.4vw,48px)]"
        style={{ scrollPaddingLeft: PADDING }}
      >
        {CAMPANAS.map((campana, i) => {
          const estilo = ESTADO[campana.estado]
          return (
            <article
              key={campana.id}
              data-campana
              aria-roledescription="campaña"
              aria-label={`${campana.titulo}, ${i + 1} de ${CAMPANAS.length}`}
              className={`flex w-[86vw] shrink-0 snap-start flex-col gap-3 border px-4 pt-4 pb-5 transition-colors duration-200 md:w-auto md:shrink ${estilo.tarjeta} ${
                montado && activa === i ? 'border-verde' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-[5px] text-[10px] font-bold tracking-[0.12em] ${estilo.chip}`}
                >
                  {estilo.etiqueta}
                </span>
                <span className={`tnum font-display text-base ${estilo.referencia}`}>
                  {campana.referencia}
                </span>
              </div>

              {/* A sangre dentro de la tarjeta: la foto manda sobre el texto. */}
              <MediaPendiente
                slot={`campana-${campana.id}`}
                etiqueta={campana.imagenPendiente}
                ratio="3/2"
                conBorde={false}
                // La tarjeta mide 86vw en el carril y un tercio de la fila en
                // grilla, más los 32px que la foto sangra a los lados. Declarar
                // menos hace que el navegador pida un candidato más chico del
                // que necesita y la foto se vea blanda en pantallas 2x.
                sizes="(max-width: 767px) 86vw, (max-width: 1023px) 32vw, 34vw"
                className="-mx-4 w-[calc(100%+2rem)] rounded-none"
                apagado={campana.estado === 'finalizada'}
              />

              <h3
                className={`m-0 font-display text-[22px] leading-tight font-normal ${estilo.titulo}`}
              >
                {campana.titulo}
              </h3>
              <p className={`m-0 text-[12.5px] leading-relaxed ${estilo.texto}`}>
                {campana.descripcion}
              </p>
              <p
                className={`m-0 mt-auto pt-1 text-[11.5px] font-semibold tracking-[0.04em] ${estilo.condicion}`}
              >
                {campana.rango}
              </p>

              {campana.cta && estilo.boton && (
                <button
                  type="button"
                  className={`inline-flex min-h-[46px] items-center justify-center px-6 text-[13px] font-semibold transition-colors duration-200 ${estilo.boton}`}
                >
                  {campana.cta}
                </button>
              )}
            </article>
          )
        })}
      </div>

      {/*
        Ayudas de deslizamiento: sólo donde hay carril. La leyenda se sirve
        siempre porque es cierta sin JavaScript; el contador y los puntos
        aparecen al hidratar, que es cuando pueden decir la verdad.
      */}
      <div className="flex items-center justify-between gap-4 px-[clamp(16px,3.4vw,48px)] pt-3.5 md:hidden">
        <p className="m-0 flex items-center gap-1.5 text-[12px] text-tinta-suave">
          Deslizá para ver más
          <svg
            width="20"
            height="10"
            viewBox="0 0 20 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="text-caramelo-texto"
          >
            <path d="M1 5h17m0 0l-4-4m4 4l-4 4" />
          </svg>
        </p>

        {montado && (
          <div className="flex items-center gap-3">
            <span className="tnum text-[12px] font-semibold text-caramelo-texto">
              {activa + 1} de {CAMPANAS.length}
            </span>
            <div className="flex items-center gap-1">
              {CAMPANAS.map((campana, i) => (
                <button
                  key={campana.id}
                  type="button"
                  onClick={() => irA(i)}
                  aria-label={`Ver ${campana.titulo}`}
                  aria-current={activa === i ? 'true' : undefined}
                  className="group flex h-11 w-6 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-caramelo"
                >
                  {/*
                    El punto activo se distingue por tamaño y por relleno, no
                    sólo por color: se alarga y se rellena de verde.
                  */}
                  <span
                    className={`h-[7px] rounded-full transition-all duration-200 ${
                      activa === i
                        ? 'w-[18px] bg-verde'
                        : 'w-[7px] border border-linea-fuerte bg-transparent group-hover:bg-linea-fuerte'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
