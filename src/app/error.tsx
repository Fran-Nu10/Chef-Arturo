'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/**
 * Límite de error del storefront.
 *
 * No existía ninguno en toda la aplicación: cualquier fallo de un componente
 * de servidor —una consulta a Supabase que no responde, por ejemplo— dejaba la
 * pantalla en blanco, sin texto y sin salida. Este es el piso mínimo: decir
 * qué pasó, no mostrar el detalle técnico, y ofrecer dos maneras de salir.
 */
export default function ErrorStorefront({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Queda en el registro del servidor para poder investigarlo; a la persona
    // no se le muestra el mensaje interno.
    console.error('[storefront] error no controlado:', error)
  }, [error])

  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="m-0 font-display text-[28px] font-normal text-verde">
        Algo se nos cayó
      </h1>
      <p className="m-0 max-w-[42ch] text-[14px] leading-relaxed text-tinta-suave">
        No pudimos cargar esta pantalla. Volvé a intentar en un momento; si sigue
        pasando, escribinos y te atendemos igual.
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
          href="/"
          className="inline-flex min-h-[48px] items-center justify-center border border-verde px-6 text-sm font-medium text-verde no-underline"
        >
          ← Volver a la tienda
        </Link>
      </div>
    </div>
  )
}
