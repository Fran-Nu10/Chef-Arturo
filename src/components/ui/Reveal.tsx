'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Reveal de encabezado: opacity 0→1 + 16px, 600ms, una sola vez.
 * Sólo se aplica a encabezados de sección — no se anima cada card.
 * Con reduced motion no hay reveal: todo el contenido está visible desde el inicio.
 */
export function Reveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const reducido = useReducedMotion()

  if (reducido) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** Encabezado editorial de sección: número + kicker sobre el título serif. */
export function EncabezadoSeccion({
  numero,
  kicker,
  titulo,
  bajada,
  tono = 'papel',
  className = '',
}: {
  numero: string
  kicker: string
  titulo: string
  bajada?: string
  tono?: 'papel' | 'verde'
  className?: string
}) {
  const oscuro = tono === 'verde'
  return (
    <Reveal className={`flex flex-col gap-2 ${className}`}>
      <div
        className={`text-[11px] font-semibold tracking-[0.16em] ${oscuro ? 'text-caramelo-claro' : 'text-caramelo-texto'}`}
      >
        <span className="tnum">{numero}</span> — {kicker}
      </div>
      <h2
        className={`m-0 font-display text-titulo font-normal ${oscuro ? 'text-papel' : 'text-tinta'}`}
      >
        {titulo}
      </h2>
      {bajada && (
        <p
          className={`m-0 max-w-[520px] text-[13px] leading-relaxed ${oscuro ? 'text-crema' : 'text-tinta-suave'}`}
        >
          {bajada}
        </p>
      )}
    </Reveal>
  )
}
