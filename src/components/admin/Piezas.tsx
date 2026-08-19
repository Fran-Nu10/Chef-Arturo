'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

/** Botón de envío con estado de guardado. */
export function BotonGuardar({
  children = 'Guardar',
  variante = 'primario',
}: {
  children?: string
  variante?: 'primario' | 'secundario' | 'peligro'
}) {
  const { pending } = useFormStatus()
  const estilo =
    variante === 'peligro'
      ? 'border-alerta bg-alerta text-papel hover:opacity-90'
      : variante === 'secundario'
        ? 'border-verde bg-transparent text-verde hover:bg-verde/[0.07]'
        : 'border-verde bg-verde text-papel hover:bg-verde-profundo'

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-[44px] items-center justify-center border px-5 text-[13.5px] font-semibold transition-colors disabled:opacity-60 ${estilo}`}
    >
      {pending ? 'Guardando…' : children}
    </button>
  )
}

/** Confirmación para acciones destructivas o difíciles de revertir. */
export function BotonConfirmar({
  children,
  pregunta,
  variante = 'peligro',
}: {
  children: string
  pregunta: string
  variante?: 'primario' | 'secundario' | 'peligro'
}) {
  const [confirmando, setConfirmando] = useState(false)
  const { pending } = useFormStatus()

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="inline-flex min-h-[44px] items-center border border-linea-fuerte px-4 text-[13px] font-medium text-tinta hover:bg-verde/[0.05]"
      >
        {children}
      </button>
    )
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 border border-alerta bg-alerta-fondo px-3 py-2">
      <span className="text-[12.5px] text-alerta">{pregunta}</span>
      <button
        type="submit"
        disabled={pending}
        className={`inline-flex min-h-[44px] items-center border px-4 text-[13px] font-semibold disabled:opacity-60 ${
          variante === 'peligro'
            ? 'border-alerta bg-alerta text-papel'
            : 'border-verde bg-verde text-papel'
        }`}
      >
        {pending ? 'Aplicando…' : 'Sí, confirmar'}
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        className="min-h-[44px] px-2 text-[13px] font-medium text-tinta-suave underline"
      >
        Cancelar
      </button>
    </span>
  )
}

/** Feedback tras guardar. `role` correcto para que lo anuncie el lector. */
export function Feedback({
  estado,
  mensajeOk = 'Cambios guardados.',
}: {
  // `ok` acepta texto para que una acción pueda devolver su propio mensaje,
  // como la recuperación de contraseña.
  estado: { ok?: boolean | string; error?: string; errores?: Record<string, string> }
  mensajeOk?: string
}) {
  if (estado.error) {
    return (
      <p role="alert" className="m-0 border border-alerta bg-alerta-fondo px-3 py-2.5 text-[13px] text-alerta">
        {estado.error}
      </p>
    )
  }
  if (estado.errores && Object.keys(estado.errores).length > 0) {
    return (
      <div role="alert" className="border border-alerta bg-alerta-fondo px-3 py-2.5">
        <p className="m-0 text-[13px] font-semibold text-alerta">Revisá estos campos:</p>
        <ul className="m-0 mt-1 flex list-none flex-col gap-0.5 p-0">
          {Object.entries(estado.errores).map(([campo, mensaje]) => (
            <li key={campo} className="text-[12.5px] text-alerta">
              <span className="font-mono">{campo}</span>: {mensaje}
            </li>
          ))}
        </ul>
      </div>
    )
  }
  if (estado.ok) {
    return (
      <p role="status" className="m-0 border border-verde bg-verde/[0.07] px-3 py-2.5 text-[13px] text-verde">
        {typeof estado.ok === 'string' ? estado.ok : mensajeOk}
      </p>
    )
  }
  return null
}

/**
 * Aviso de cambios sin guardar.
 *
 * Escucha los eventos del formulario y engancha `beforeunload`. Se desactiva
 * al enviar para no molestar en el guardado legítimo.
 */
export function AvisoSinGuardar({ formId }: { formId: string }) {
  const [sucio, setSucio] = useState(false)

  useEffect(() => {
    const form = document.getElementById(formId)
    if (!(form instanceof HTMLFormElement)) return

    const ensuciar = () => setSucio(true)
    const limpiar = () => setSucio(false)

    form.addEventListener('input', ensuciar)
    form.addEventListener('change', ensuciar)
    form.addEventListener('submit', limpiar)

    return () => {
      form.removeEventListener('input', ensuciar)
      form.removeEventListener('change', ensuciar)
      form.removeEventListener('submit', limpiar)
    }
  }, [formId])

  useEffect(() => {
    if (!sucio) return
    const alSalir = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', alSalir)
    return () => window.removeEventListener('beforeunload', alSalir)
  }, [sucio])

  if (!sucio) return null
  return (
    <p role="status" className="m-0 border border-dashed border-caramelo px-3 py-2 text-[12.5px] text-caramelo-texto">
      Tenés cambios sin guardar.
    </p>
  )
}

// ── Campos ──────────────────────────────────────────────────────────────────

const CAMPO =
  'min-h-[44px] w-full border border-linea-fuerte bg-papel px-3 text-sm text-tinta focus:border-verde focus:outline-none'
const ETIQUETA = 'text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase'

export function Campo({
  etiqueta,
  ayuda,
  error,
  children,
}: {
  etiqueta: string
  ayuda?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={ETIQUETA}>{etiqueta}</span>
      {children}
      {ayuda && !error && <span className="text-[11.5px] text-tinta-suave">{ayuda}</span>}
      {error && <span className="text-[11.5px] text-alerta">{error}</span>}
    </label>
  )
}

export function Entrada(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CAMPO} ${props.className ?? ''}`} />
}

export function AreaTexto(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${CAMPO} resize-y py-2.5 ${props.className ?? ''}`} />
}

export function Seleccion(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${CAMPO} ${props.className ?? ''}`} />
}

export function Casilla({
  etiqueta,
  ...props
}: { etiqueta: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-[13.5px] font-medium">
      <input type="checkbox" {...props} className="h-4 w-4 accent-[#1e4b40]" />
      {etiqueta}
    </label>
  )
}
