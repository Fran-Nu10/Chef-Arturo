'use client'

import { useEffect, useState } from 'react'

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Setiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

/** Índice 0 = lunes, para que la grilla arranque donde la muestra el diseño. */
function primerDiaDeLaSemana(anio: number, mes: number) {
  return (new Date(anio, mes, 1).getDay() + 6) % 7
}

/**
 * Calendario del paso 2 del checkout.
 *
 * Ningún día se afirma como disponible o no disponible: la disponibilidad real
 * es contenido pendiente de validación y se resuelve al confirmar el pedido.
 * El mes se calcula recién al montar, así el HTML servido no depende del reloj.
 */
export function Calendario({
  valor,
  onElegir,
}: {
  valor: string
  onElegir: (iso: string) => void
}) {
  const [cursor, setCursor] = useState<{ anio: number; mes: number } | null>(null)

  useEffect(() => {
    const hoy = new Date()
    setCursor({ anio: hoy.getFullYear(), mes: hoy.getMonth() })
  }, [])

  const mover = (delta: number) =>
    setCursor((c) => {
      if (!c) return c
      const d = new Date(c.anio, c.mes + delta, 1)
      return { anio: d.getFullYear(), mes: d.getMonth() }
    })

  const celdas: (number | null)[] = []
  if (cursor) {
    const total = new Date(cursor.anio, cursor.mes + 1, 0).getDate()
    for (let i = 0; i < primerDiaDeLaSemana(cursor.anio, cursor.mes); i++)
      celdas.push(null)
    for (let d = 1; d <= total; d++) celdas.push(d)
  }

  const iso = (dia: number) =>
    cursor
      ? `${cursor.anio}-${String(cursor.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
      : ''

  return (
    <div className="flex flex-col gap-3 border border-linea bg-papel-alt p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[13.5px] font-semibold">
          {cursor ? `${MESES[cursor.mes]} ${cursor.anio}` : 'Mes de ejemplo'}
        </span>
        <span className="flex gap-1">
          <button
            type="button"
            onClick={() => mover(-1)}
            aria-label="Mes anterior"
            disabled={!cursor}
            className="flex h-11 w-11 items-center justify-center text-[15px] font-semibold text-caramelo-texto"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => mover(1)}
            aria-label="Mes siguiente"
            disabled={!cursor}
            className="flex h-11 w-11 items-center justify-center text-[15px] font-semibold text-caramelo-texto"
          >
            →
          </button>
        </span>
      </div>

      <div
        className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-tinta-tenue"
        aria-hidden="true"
      >
        {DIAS.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {celdas.map((dia, i) =>
          dia === null ? (
            <span
              key={`v-${i}`}
              className="flex min-h-[44px] items-center justify-center text-[12.5px] text-linea"
            >
              ·
            </span>
          ) : (
            <button
              key={iso(dia)}
              type="button"
              onClick={() => onElegir(iso(dia))}
              aria-pressed={valor === iso(dia)}
              className={`tnum min-h-[44px] text-[12.5px] font-medium ${
                valor === iso(dia)
                  ? 'bg-verde text-papel'
                  : 'text-tinta hover:bg-verde/[0.07]'
              }`}
            >
              {dia}
            </button>
          ),
        )}
      </div>

      <p className="m-0 text-[11px] text-caramelo-texto">
        Días y disponibilidad: pendientes de validación.
      </p>
    </div>
  )
}
