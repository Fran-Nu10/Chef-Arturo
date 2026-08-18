import Link from 'next/link'
import type { ReactNode } from 'react'
import { IconoAtras } from '@/components/ui/Iconos'

/**
 * Barra de contexto de las pantallas interiores: volver + rastro de navegación.
 * Acompaña al header del sitio, no lo reemplaza.
 */
export function BarraContexto({
  volverA,
  children,
}: {
  volverA: string
  children: ReactNode
}) {
  return (
    <div className="flex h-14 items-center gap-3 border-b border-linea px-4 lg:px-[clamp(16px,3.4vw,48px)]">
      <Link
        href={volverA}
        aria-label="Volver"
        className="-ml-2.5 flex min-h-[44px] min-w-[44px] items-center justify-center text-tinta no-underline"
      >
        <IconoAtras size={18} />
      </Link>
      <div className="flex items-center gap-2 text-xs text-tinta-suave">{children}</div>
    </div>
  )
}

/** Sección actual dentro del rastro. */
export function Actual({ children }: { children: ReactNode }) {
  return <span className="text-[13px] font-semibold text-verde">{children}</span>
}
