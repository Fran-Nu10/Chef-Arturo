'use client'

import { useState, type ReactNode } from 'react'

/**
 * En mobile los filtros secundarios viven detrás de un botón «Filtros»; en
 * desktop están siempre a la vista. El buscador queda afuera: buscar es lo
 * primero que se hace, no un filtro secundario.
 */
export function FiltrosColapsables({
  children,
  abiertosAlInicio = false,
}: {
  children: ReactNode
  /** Con un filtro ya aplicado se muestran abiertos, para poder quitarlo. */
  abiertosAlInicio?: boolean
}) {
  const [abiertos, setAbiertos] = useState(abiertosAlInicio)

  return (
    <>
      <button
        type="button"
        aria-expanded={abiertos}
        onClick={() => setAbiertos((v) => !v)}
        className="inline-flex min-h-[44px] items-center gap-1.5 border border-linea-fuerte px-4 text-[13px] font-medium text-tinta lg:hidden"
      >
        Filtros
        <span aria-hidden="true" className="text-caramelo-texto">
          {abiertos ? '−' : '+'}
        </span>
      </button>
      <div className={`${abiertos ? 'flex' : 'hidden'} w-full flex-wrap items-end gap-3 lg:flex lg:w-auto`}>
        {children}
      </div>
    </>
  )
}
