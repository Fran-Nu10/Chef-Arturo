'use client'

import type { ReactNode } from 'react'

const ETIQUETA = 'text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase'

/** Campo de texto sobre papel. Compatible con el teclado de mobile. */
export function CampoTexto({
  etiqueta,
  ayuda,
  multilinea = false,
  ...props
}: {
  etiqueta: string
  ayuda?: string
  multilinea?: boolean
} & React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const clase =
    'w-full border bg-papel-alt px-3 text-sm font-medium text-tinta placeholder:text-tinta-tenue border-linea-fuerte focus:border-verde'
  return (
    <label className="flex flex-col gap-1.5">
      <span className={ETIQUETA}>{etiqueta}</span>
      {multilinea ? (
        <textarea rows={3} className={`${clase} resize-y py-3`} {...props} />
      ) : (
        <input className={`${clase} min-h-[48px]`} {...props} />
      )}
      {ayuda && <span className="text-[11.5px] text-tinta-suave">{ayuda}</span>}
    </label>
  )
}

/** Opción de radio con caja: retiro/entrega, medio de pago, modalidad. */
export function OpcionCaja({
  name,
  titulo,
  detalle,
  seleccionada,
  onSelect,
  children,
}: {
  name: string
  titulo: string
  detalle?: string
  seleccionada: boolean
  onSelect: () => void
  children?: ReactNode
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3.5 border px-3.5 py-4 ${
        seleccionada ? 'border-verde bg-verde/[0.07]' : 'border-linea-fuerte'
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={seleccionada}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border-[1.5px] ${
          seleccionada ? 'border-verde' : 'border-linea-fuerte'
        }`}
      >
        {seleccionada && <span className="h-2 w-2 rounded-full bg-verde" />}
      </span>
      <span className="flex-1">
        <b className="text-[14.5px] font-semibold">{titulo}</b>
        {detalle && (
          <span className="mt-[3px] block text-[12.5px] leading-relaxed text-tinta-suave">
            {detalle}
          </span>
        )}
        {children}
      </span>
    </label>
  )
}

/** Control segmentado: franja horaria, preferencia, retiro o entrega. */
export function Segmentado({
  etiqueta,
  opciones,
  valor,
  onElegir,
  ayuda,
}: {
  etiqueta?: string
  opciones: readonly string[]
  valor: string | null
  onElegir: (v: string) => void
  ayuda?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      {etiqueta && <span className={ETIQUETA}>{etiqueta}</span>}
      <div className="flex gap-2">
        {opciones.map((opcion) => {
          const activa = valor === opcion
          return (
            <button
              key={opcion}
              type="button"
              onClick={() => onElegir(opcion)}
              aria-pressed={activa}
              className={`flex min-h-[46px] flex-1 items-center justify-center px-3 text-center text-[13px] leading-tight transition-colors duration-200 ${
                activa
                  ? 'bg-verde font-semibold text-papel'
                  : 'border border-linea-fuerte font-medium text-tinta hover:bg-verde/[0.07]'
              }`}
            >
              {opcion}
            </button>
          )
        })}
      </div>
      {ayuda && <span className="text-[11px] text-tinta-suave">{ayuda}</span>}
    </div>
  )
}

/** Aviso enmarcado: seña, anticipación, disponibilidad a confirmar. */
export function Aviso({
  tono = 'caramelo',
  children,
}: {
  tono?: 'caramelo' | 'alerta'
  children: ReactNode
}) {
  return (
    <p
      className={`m-0 border border-dashed px-3 py-2.5 text-[11.5px] leading-relaxed font-medium ${
        tono === 'caramelo'
          ? 'border-caramelo text-caramelo-texto'
          : 'border-alerta bg-alerta-fondo text-alerta'
      }`}
    >
      {children}
    </p>
  )
}

/** Filas de resumen: clave a la izquierda, valor a la derecha. */
export function Resumen({
  filas,
  total,
}: {
  filas: { k: string; v: ReactNode }[]
  total?: ReactNode
}) {
  return (
    <dl className="m-0 border border-linea bg-papel-alt">
      {filas.map((fila) => (
        <div
          key={fila.k}
          className="flex justify-between gap-2.5 border-b border-linea px-3.5 py-3 text-[12.5px]"
        >
          <dt className="text-tinta-suave">{fila.k}</dt>
          <dd className="m-0 text-right font-medium">{fila.v}</dd>
        </div>
      ))}
      {total && (
        <div className="flex justify-between gap-2.5 px-3.5 py-3">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-sm font-semibold text-verde">{total}</span>
        </div>
      )}
    </dl>
  )
}
