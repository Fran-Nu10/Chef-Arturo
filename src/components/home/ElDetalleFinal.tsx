'use client'

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { useRef, type ReactNode } from 'react'
import { MarcaVideo, MediaPendiente } from '@/components/ui/MediaPendiente'
import { tramo, useMedidas } from '@/lib/movimiento'

const TITULO = 'El detalle también forma parte del pedido'

/** Copy temporal: no se afirma ninguna historia artesanal ni método de elaboración. */
const FRASES = [
  {
    texto: 'El detalle también forma parte del pedido.',
    desde: 0.42,
    tono: 'verde' as const,
  },
  {
    texto: 'Contenido de proceso pendiente de validación.',
    desde: 0.55,
    tono: 'verde' as const,
  },
  {
    texto: 'RETIRO EN FLORIDA · ENTREGA A TU PUERTA',
    desde: 0.68,
    tono: 'caramelo' as const,
  },
]

function claseFrase(tono: 'verde' | 'caramelo') {
  return tono === 'verde'
    ? 'bg-verde-profundo/80 font-display text-[clamp(17px,2vw,24px)] text-papel'
    : 'bg-caramelo/90 text-xs font-semibold tracking-[0.08em] text-papel'
}

function VentanaVideo({ contraescala }: { contraescala?: MotionValue<number> }) {
  const compensar = (nodo: ReactNode) =>
    contraescala ? (
      <motion.span style={{ scale: contraescala }} className="inline-block">
        {nodo}
      </motion.span>
    ) : (
      nodo
    )

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MediaPendiente
        etiqueta={compensar('Poster temporal — video de terminación o armado')}
        className="h-full w-full rounded-none border-0"
        marca={
          <MarcaVideo posicion="izquierda">
            {compensar('VIDEO DE TERMINACIÓN O ARMADO · PENDIENTE')}
          </MarcaVideo>
        }
      />
    </div>
  )
}

/**
 * 04 · EL DETALLE FINAL — segundo pico de movimiento.
 *
 * Track de 200svh con la ventana sticky. Arranca como una ventana chica
 * integrada en el fondo crema, se expande hasta casi todo el viewport, entran
 * tres frases breves y entrega la pantalla a la sección siguiente.
 * Es un rectángulo con matte, no un arco: no repite el hero.
 */
export function ElDetalleFinal() {
  const reducido = useReducedMotion()
  const track = useRef<HTMLElement>(null)
  const sticky = useRef<HTMLDivElement>(null)
  const caja = useRef<HTMLDivElement>(null)
  const medidas = useMedidas(caja, sticky)

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ['start start', 'end end'],
  })

  // 0.10–0.52 · la ventana se expande hasta ~94% del viewport.
  const escalaMax = medidas
    ? Math.max(medidas.vw / medidas.ancho, (medidas.vh * 0.94) / medidas.alto) * 1.02
    : 1
  const avance = useTransform(scrollYProgress, (p) => tramo(p, 0.1, 0.52))
  const escala = useTransform(avance, (e) => 1 + e * (escalaMax - 1))
  // Las leyendas de asset pendiente no deben crecer con la ventana.
  const contraescala = useTransform(escala, (s) => 1 / s)
  const borde = useTransform(avance, (e) => `rgba(30,75,64,${0.5 * (1 - e)})`)

  // 0.12–0.27 · el título sale cuando la ventana empieza a ocupar la pantalla.
  const tituloOpacidad = useTransform(scrollYProgress, (p) => 1 - tramo(p, 0.12, 0.27))
  const tituloY = useTransform(scrollYProgress, (p) => -16 * tramo(p, 0.12, 0.27))

  if (reducido) {
    return (
      <section
        aria-label="El detalle final"
        className="flex flex-col items-center justify-center gap-[26px] bg-papel px-5 py-[clamp(56px,7vw,96px)]"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-[11px] font-semibold tracking-[0.16em] text-caramelo-texto">
            04 — EL DETALLE FINAL
          </div>
          <h2 className="m-0 font-display text-seccion font-normal text-verde">
            {TITULO}
          </h2>
        </div>
        <div className="relative box-border h-[min(46svh,400px)] w-[min(86vw,640px)] border border-verde/50 bg-crema p-2">
          <VentanaVideo />
        </div>
        <div className="flex flex-col items-start gap-2">
          {FRASES.map((f) => (
            <span key={f.texto} className={`px-3.5 py-[7px] ${claseFrase(f.tono)}`}>
              {f.texto}
            </span>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section
      ref={track}
      aria-label="El detalle final"
      className="relative h-[200svh] bg-papel"
    >
      <div
        ref={sticky}
        className="sticky top-0 flex h-[100svh] flex-col items-center justify-center gap-[26px] overflow-hidden"
      >
        {/*
          Las frases quedan fuera del elemento que escala: si viajaran dentro,
          la misma transformación las agrandaría hasta 2,5× y dejarían de leerse
          como frases breves.
        */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-2 flex justify-center">
          <div className="flex w-[min(94vw,900px)] flex-col items-start gap-2 px-4 pb-[6svh]">
            {FRASES.map((frase) => (
              <Frase key={frase.texto} progreso={scrollYProgress} {...frase} />
            ))}
          </div>
        </div>

        <motion.div
          style={{ opacity: tituloOpacidad, y: tituloY }}
          className="flex flex-col items-center gap-2 px-5 text-center"
        >
          <div className="text-[11px] font-semibold tracking-[0.16em] text-caramelo-texto">
            04 — EL DETALLE FINAL
          </div>
          <h2 className="m-0 font-display text-seccion font-normal text-verde">
            {TITULO}
          </h2>
        </motion.div>

        <div ref={caja} className="h-[min(46svh,400px)] w-[min(86vw,640px)]">
          <motion.div
            style={{ scale: escala, borderColor: borde }}
            className="relative box-border h-full w-full border bg-crema p-2 will-change-transform"
          >
            <VentanaVideo contraescala={contraescala} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Frase({
  texto,
  desde,
  tono,
  progreso,
}: {
  texto: string
  desde: number
  tono: 'verde' | 'caramelo'
  progreso: ReturnType<typeof useScroll>['scrollYProgress']
}) {
  const opacidad = useTransform(progreso, (p) => tramo(p, desde, desde + 0.1))
  const y = useTransform(progreso, (p) => (1 - tramo(p, desde, desde + 0.1)) * 14)

  return (
    <motion.span
      style={{ opacity: opacidad, y }}
      className={`px-3.5 py-[7px] ${claseFrase(tono)}`}
    >
      {texto}
    </motion.span>
  )
}
