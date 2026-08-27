'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Límite de error del panel.
 *
 * Este es el que arregla la pantalla en blanco al entrar a gestión: sin él,
 * un fallo al resolver la sesión —Supabase que no responde, un JWT que no se
 * puede verificar, una variable de entorno ausente en el despliegue— tiraba la
 * página entera sin renderizar nada. Ahora se ve qué pasó y cómo salir.
 */
export default function ErrorAdmin({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[panel] error no controlado:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-papel px-6 py-16 text-center">
      <div className="leading-none">
        <span className="block text-[9.5px] font-semibold tracking-[0.3em] text-verde">
          CHEF
        </span>
        <span className="font-display text-[26px] text-verde italic">Arturo</span>
      </div>
      <h1 className="m-0 font-display text-[24px] font-normal text-verde">
        No pudimos abrir el panel
      </h1>
      <p className="m-0 max-w-[46ch] text-[13.5px] leading-relaxed text-tinta-suave">
        Puede ser una sesión vencida o un problema momentáneo de conexión con la
        base. Probá de nuevo o volvé a entrar con tu usuario.
      </p>
      <div className="flex flex-wrap justify-center gap-2.5">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[48px] items-center justify-center border border-verde bg-verde px-6 text-sm font-semibold text-papel"
        >
          Reintentar
        </button>
        <Link
          href="/admin/login"
          className="inline-flex min-h-[48px] items-center justify-center border border-verde px-6 text-sm font-medium text-verde no-underline"
        >
          Ir al login
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center justify-center px-4 text-sm font-medium text-tinta-suave no-underline underline underline-offset-[3px]"
        >
          ← Volver a la tienda
        </Link>
      </div>
    </div>
  )
}
