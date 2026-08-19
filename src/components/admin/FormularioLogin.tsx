'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { ingresar, recuperarContrasena, type ResultadoAuth } from '@/server/acciones-auth'

const CAMPO =
  'min-h-[48px] w-full border border-linea-fuerte bg-papel-alt px-3 text-sm text-tinta focus:border-verde focus:outline-none'
const ETIQUETA =
  'text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase'

function BotonEnvio({ children }: { children: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-[50px] items-center justify-center border border-verde bg-verde px-6 text-sm font-semibold text-papel transition-colors hover:bg-verde-profundo disabled:opacity-60"
    >
      {pending ? 'Verificando…' : children}
    </button>
  )
}

function Aviso({ resultado }: { resultado: ResultadoAuth }) {
  if (resultado.error) {
    return (
      <p role="alert" className="m-0 border border-alerta bg-alerta-fondo px-3 py-2.5 text-[13px] text-alerta">
        {resultado.error}
      </p>
    )
  }
  if (resultado.ok) {
    return (
      <p role="status" className="m-0 border border-verde bg-verde/[0.07] px-3 py-2.5 text-[13px] text-verde">
        {resultado.ok}
      </p>
    )
  }
  return null
}

export function FormularioLogin({ errorInicial }: { errorInicial?: string }) {
  const [modo, setModo] = useState<'ingresar' | 'recuperar'>('ingresar')
  const [entrada, accionEntrada] = useActionState(ingresar, {
    error: errorInicial,
  } satisfies ResultadoAuth)
  const [recupero, accionRecupero] = useActionState(recuperarContrasena, {} as ResultadoAuth)

  if (modo === 'recuperar') {
    return (
      <form action={accionRecupero} className="flex flex-col gap-4 border border-linea bg-papel-alt p-5">
        <h1 className="m-0 font-display text-xl font-normal">Recuperar contraseña</h1>
        <p className="m-0 text-[13px] leading-relaxed text-tinta-suave">
          Te enviamos un enlace para elegir una contraseña nueva.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className={ETIQUETA}>Email</span>
          <input name="email" type="email" autoComplete="email" required className={CAMPO} />
        </label>
        <Aviso resultado={recupero} />
        <BotonEnvio>Enviar enlace</BotonEnvio>
        <button
          type="button"
          onClick={() => setModo('ingresar')}
          className="min-h-[44px] text-[13px] font-medium text-caramelo-texto underline underline-offset-[3px]"
        >
          Volver al ingreso
        </button>
      </form>
    )
  }

  return (
    <form action={accionEntrada} className="flex flex-col gap-4 border border-linea bg-papel-alt p-5">
      <h1 className="m-0 font-display text-xl font-normal">Ingresar</h1>
      <label className="flex flex-col gap-1.5">
        <span className={ETIQUETA}>Email</span>
        <input name="email" type="email" autoComplete="email" required className={CAMPO} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={ETIQUETA}>Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={CAMPO}
        />
      </label>
      <Aviso resultado={entrada} />
      <BotonEnvio>Ingresar</BotonEnvio>
      <button
        type="button"
        onClick={() => setModo('recuperar')}
        className="min-h-[44px] text-[13px] font-medium text-caramelo-texto underline underline-offset-[3px]"
      >
        Olvidé mi contraseña
      </button>
    </form>
  )
}
