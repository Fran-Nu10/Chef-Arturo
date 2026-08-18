/**
 * Iconos de línea del prototipo (trazo, nunca relleno), en el estilo Lucide.
 * `size` y `strokeWidth` replican los valores de cada uso en el diseño.
 */
interface IconoProps {
  size?: number
  strokeWidth?: number
  className?: string
}

function Svg({
  size = 20,
  strokeWidth = 1.7,
  className = '',
  children,
}: IconoProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

export const IconoMenu = (p: IconoProps) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </Svg>
)

export const IconoCarrito = (p: IconoProps) => (
  <Svg strokeWidth={1.6} {...p}>
    <path d="M6 8h12l-1.2 12H7.2L6 8z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </Svg>
)

export const IconoAtras = (p: IconoProps) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M15 18l-6-6 6-6" />
  </Svg>
)

export const IconoBuscar = (p: IconoProps) => (
  <Svg strokeWidth={1.8} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Svg>
)

export const IconoCalendario = (p: IconoProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="1" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
)

export const IconoAlerta = (p: IconoProps) => (
  <Svg strokeWidth={1.8} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.5v.5" />
  </Svg>
)

export const IconoReloj = (p: IconoProps) => (
  <Svg strokeWidth={1.5} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </Svg>
)

export const IconoTilde = (p: IconoProps) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M5 13l4 4 10-10" />
  </Svg>
)

export const IconoEnviar = (p: IconoProps) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </Svg>
)

export const IconoFlechaAbajo = (p: IconoProps) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M12 4v16m0 0l-6-6m6 6l6-6" />
  </Svg>
)

export const IconoCerrar = (p: IconoProps) => (
  <Svg strokeWidth={1.8} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
)
