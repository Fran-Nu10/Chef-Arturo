'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { PASOS_PEDIDO } from '@/content/datos'
import { EncabezadoSeccion } from '@/components/ui/Reveal'

/**
 * 07 · DE LA COCINA A TU MESA.
 *
 * Una línea que avanza con el progreso de la sección y números editoriales.
 * El avance de la línea es el único movimiento: todo el contenido es legible
 * sin animación alguna. No se afirman tiempos, costos ni zonas.
 */
export function DeLaCocinaATuMesa() {
  const reducido = useReducedMotion()
  const lista = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: lista,
    offset: ['start 85%', 'end 65%'],
  })
  const avance = useTransform(
    scrollYProgress,
    (p) => `${Math.max(0, Math.min(1, p)) * 100}%`,
  )

  return (
    <section
      aria-label="De la cocina a tu mesa"
      className="px-[clamp(16px,3.4vw,48px)] py-[clamp(56px,7vw,96px)]"
    >
      <EncabezadoSeccion
        numero="07"
        kicker="CÓMO FUNCIONA"
        titulo="De la cocina a tu mesa"
        className="mb-[34px]"
      />

      <div ref={lista} className="relative flex flex-col lg:flex-row">
        {/* Riel: vertical en mobile, horizontal en desktop. */}
        <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-linea lg:right-0 lg:bottom-auto lg:h-0.5 lg:w-auto" />
        {/* En mobile la línea avanza en alto; en desktop, en ancho. */}
        <motion.div
          aria-hidden="true"
          className="absolute top-0 left-0 w-0.5 bg-caramelo lg:hidden"
          style={{ height: reducido ? '100%' : avance }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute top-0 left-0 hidden h-0.5 bg-caramelo lg:block"
          style={{ width: reducido ? '100%' : avance }}
        />

        <ol className="m-0 flex list-none flex-col p-0 lg:flex-1 lg:flex-row">
          {PASOS_PEDIDO.map((paso, i) => (
            <li
              key={paso.numero}
              className={`flex flex-1 flex-col gap-1.5 border-l-2 border-transparent pl-[26px] lg:border-l-0 lg:pt-[22px] lg:pl-0 ${
                i === PASOS_PEDIDO.length - 1 ? 'pt-1.5 pb-1.5' : 'pt-1.5 pb-[26px]'
              }`}
            >
              <span className="tnum font-display text-[30px] text-caramelo">
                {paso.numero}
              </span>
              <span className="text-[15px] font-semibold">{paso.titulo}</span>
              <span className="max-w-[220px] text-[12.5px] leading-relaxed text-tinta-suave">
                {paso.detalle}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
