'use client'

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { useRef } from 'react'
import { NEGOCIO } from '@/content/datos'
import { BotonEnlace } from '@/components/ui/Boton'
import { IconoFlechaAbajo } from '@/components/ui/Iconos'
import { MarcaVideo, MediaPendiente } from '@/components/ui/MediaPendiente'
import { tramo, useMedidas } from '@/lib/movimiento'

const TITULAR = (
  <>
    Pastelería, merienda y <em>lunch</em> para fiestas
  </>
)

const BAJADA =
  'Comprá del día con Mercado Pago, encargá para una fecha o consultá por tu evento. Retiro en Florida o entrega a tu puerta.'

/** Contrato del asset, mientras no llegue el video real. */
const POSTER_PENDIENTE = 'Poster temporal — video 9:16 / 16:10 pendiente'

function CopyHero() {
  return (
    <>
      <div className="text-[11.5px] font-semibold tracking-[0.16em] text-caramelo-texto uppercase">
        {NEGOCIO.ciudad} · {NEGOCIO.entrega}
      </div>
      <h1 className="m-0 font-display text-display font-normal text-verde">{TITULAR}</h1>
      <p className="m-0 max-w-[430px] text-cuerpo text-tinta-media">{BAJADA}</p>
      <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
        <BotonEnlace href="/catalogo">Ver catálogo</BotonEnlace>
        <BotonEnlace href={NEGOCIO.whatsapp} variante="secundario">
          Pedir por WhatsApp
        </BotonEnlace>
      </div>
    </>
  )
}

/**
 * La ventana arqueada del hero. El radio del recorte interior acompaña al del
 * marco: al escalar, el arco se abre hasta el rectángulo pleno del viewport.
 */
function ArcoHero({
  radio,
  contraescala,
}: {
  radio?: MotionValue<string>
  /** Deshace la escala del arco para que las leyendas no se agiganten. */
  contraescala?: MotionValue<number>
}) {
  const leyenda = contraescala ? (
    <motion.span style={{ scale: contraescala }} className="inline-block">
      {POSTER_PENDIENTE}
    </motion.span>
  ) : (
    POSTER_PENDIENTE
  )

  return (
    <motion.div
      style={radio ? { borderRadius: radio } : undefined}
      className={`h-full w-full overflow-hidden ${radio ? '' : 'rounded-t-[999px] rounded-b-[3px]'}`}
    >
      <MediaPendiente
        etiqueta={leyenda}
        className="h-full w-full rounded-none border-0"
        marca={
          <MarcaVideo posicion="abajo">
            <motion.span
              style={contraescala ? { scale: contraescala } : undefined}
              className="inline-block"
            >
              VIDEO PENDIENTE · POSTER TEMPORAL
            </motion.span>
          </MarcaVideo>
        }
      />
    </motion.div>
  )
}

/**
 * 01 · LA VITRINA VIVA — primer pico de movimiento.
 *
 * Track de 175svh con el hero sticky. A lo largo del progreso: entra el titular
 * y la ventana, el contenido dentro del arco se acerca, el arco escala hasta
 * cubrir el viewport perdiendo su borde y su radio, y el texto sale antes de
 * que el medio lo tape. Sin rotaciones 3D, sin bloquear el scroll.
 */
export function VitrinaViva() {
  const reducido = useReducedMotion()
  const track = useRef<HTMLElement>(null)
  const sticky = useRef<HTMLDivElement>(null)
  const caja = useRef<HTMLDivElement>(null)
  const medidas = useMedidas(caja, sticky)

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ['start start', 'end end'],
  })

  // 0.35–0.55 · el texto y los CTA salen antes de que el medio los cubra.
  const copiaOpacidad = useTransform(scrollYProgress, (p) => 1 - tramo(p, 0.35, 0.55))
  const copiaY = useTransform(scrollYProgress, (p) => -24 * tramo(p, 0.35, 0.55))
  const copiaEventos = useTransform(scrollYProgress, (p) =>
    tramo(p, 0.35, 0.55) > 0.5 ? 'none' : 'auto',
  )

  // 0–0.06 · el indicador de scroll se retira apenas empieza el movimiento.
  const pistaOpacidad = useTransform(scrollYProgress, (p) => 1 - tramo(p, 0, 0.06))

  // 0.30–0.78 · el arco escala hasta cubrir el viewport y pierde su borde.
  const escalaMax = medidas
    ? Math.max(medidas.vw / medidas.ancho, medidas.vh / medidas.alto) * 1.06
    : 1
  const avance = useTransform(scrollYProgress, (p) => tramo(p, 0.3, 0.78))
  const arcoEscala = useTransform(avance, (e) => 1 + e * (escalaMax - 1))
  const arcoX = useTransform(avance, (e) =>
    medidas ? e * (medidas.vw / 2 - medidas.cx) : 0,
  )
  const arcoY = useTransform(avance, (e) =>
    medidas ? e * (medidas.vh / 2 - medidas.cy) : 0,
  )
  const arcoBorde = useTransform(avance, (e) => `rgba(247,243,234,${0.35 * (1 - e)})`)
  const arcoHairline = useTransform(avance, (e) => `rgba(217,210,194,${1 - e})`)
  const arcoRadio = useTransform(avance, (e) => {
    const r = (1 - e) * 999
    return `${r + 6}px ${r + 6}px 6px 6px`
  })
  const clipRadio = useTransform(avance, (e) => {
    const r = (1 - e) * 999
    return `${r}px ${r}px 3px 3px`
  })

  // 0.20–0.55 · el contenido gastronómico dentro del arco se acerca.
  const medioEscala = useTransform(scrollYProgress, (p) => 1 + 0.16 * tramo(p, 0.2, 0.55))

  // Las leyendas de asset pendiente no deben crecer con el arco.
  const contraescala = useTransform(
    [arcoEscala, medioEscala],
    ([a, m]: number[]) => 1 / (a * m),
  )

  // Versión estática completa: toda la información visible, sin track de scroll.
  if (reducido) {
    return (
      <section
        aria-label="La vitrina viva"
        className="-mt-[76px] flex min-h-[100svh] flex-col items-center justify-center gap-6 px-5 pt-[86px] pb-10 text-center lg:grid lg:grid-cols-[1fr_520px] lg:items-center lg:gap-16 lg:px-[72px] lg:pt-[76px] lg:pb-0 lg:text-left"
      >
        <div className="flex max-w-[560px] flex-col items-center gap-[18px] lg:items-start">
          <CopyHero />
        </div>
        <div className="flex justify-center">
          <div className="h-[min(58svh,430px)] w-[min(78vw,340px)] rounded-t-[1005px] rounded-b-[6px] border border-papel/35 bg-crema p-2 outline outline-linea">
            <ArcoHero />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={track}
      aria-label="La vitrina viva"
      className="relative -mt-[76px] h-[175svh]"
    >
      <div
        ref={sticky}
        className="sticky top-0 flex h-[100svh] items-center overflow-hidden"
      >
        <div className="box-border flex w-full flex-col items-center gap-[26px] px-5 pt-[86px] pb-10 text-center lg:grid lg:grid-cols-[1fr_520px] lg:items-center lg:gap-16 lg:px-[72px] lg:pt-[76px] lg:pb-0 lg:text-left">
          <motion.div
            style={{
              opacity: copiaOpacidad,
              y: copiaY,
              pointerEvents: copiaEventos,
            }}
            className="relative z-2 flex max-w-[560px] flex-col items-center gap-[18px] lg:items-start"
          >
            <CopyHero />
          </motion.div>

          <div className="flex justify-center">
            {/* Caja de referencia: nunca se transforma, sólo se mide. */}
            <div ref={caja} className="h-[min(58svh,430px)] w-[min(78vw,340px)]">
              <motion.div
                style={{
                  scale: arcoEscala,
                  x: arcoX,
                  y: arcoY,
                  borderColor: arcoBorde,
                  outlineColor: arcoHairline,
                  borderRadius: arcoRadio,
                }}
                className="box-border h-full w-full border bg-crema p-2 outline outline-linea will-change-transform"
              >
                <motion.div style={{ scale: medioEscala }} className="h-full w-full">
                  <ArcoHero radio={clipRadio} contraescala={contraescala} />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div
          style={{ opacity: pistaOpacidad }}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[70px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-[10.5px] font-semibold tracking-[0.14em] text-caramelo-texto lg:bottom-[18px]"
        >
          DESLIZÁ
          <IconoFlechaAbajo size={14} />
        </motion.div>
      </div>
    </section>
  )
}
