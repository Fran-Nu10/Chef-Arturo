import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

/**
 * Botones del sistema. Verde lleno para la acción primaria, borde verde para la
 * secundaria; sobre fondo verde se invierten a papel. Nunca relleno de acento.
 */
export type VarianteBoton =
  | 'primario'
  | 'secundario'
  | 'primario-invertido'
  | 'secundario-invertido'
  | 'deshabilitado'

const VARIANTE: Record<VarianteBoton, string> = {
  primario:
    'bg-verde text-papel border border-verde hover:bg-verde-profundo font-semibold',
  secundario:
    'bg-transparent text-verde border border-verde hover:bg-verde/[0.07] font-medium',
  'primario-invertido':
    'bg-papel text-verde border border-papel hover:bg-crema font-semibold',
  'secundario-invertido':
    'bg-transparent text-papel border border-papel/50 hover:bg-papel/10 font-medium',
  deshabilitado: 'bg-crema text-tinta-tenue border border-linea cursor-not-allowed',
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-none px-6 text-center text-sm tracking-[0.03em] transition-colors duration-200'

/** Área táctil mínima de 44 × 44 px en todo control. */
const ALTURA = 'min-h-[50px]'
const ALTURA_COMPACTA = 'min-h-[44px]'

interface Comun {
  variante?: VarianteBoton
  compacto?: boolean
  className?: string
  children: ReactNode
}

export function Boton({
  variante = 'primario',
  compacto = false,
  className = '',
  children,
  ...props
}: Comun & ComponentProps<'button'>) {
  return (
    <button
      className={`${BASE} ${compacto ? ALTURA_COMPACTA : ALTURA} ${VARIANTE[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function BotonEnlace({
  variante = 'primario',
  compacto = false,
  className = '',
  children,
  ...props
}: Comun & ComponentProps<typeof Link>) {
  return (
    <Link
      className={`${BASE} no-underline ${compacto ? ALTURA_COMPACTA : ALTURA} ${VARIANTE[variante]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  )
}

/** Enlace editorial: subrayado caramelo, sin caja. */
export function EnlaceEditorial({
  className = '',
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      className={`inline-flex min-h-[44px] items-center text-[13px] font-semibold text-caramelo-texto underline underline-offset-[3px] hover:text-tinta ${className}`}
      {...props}
    >
      {children}
    </Link>
  )
}
