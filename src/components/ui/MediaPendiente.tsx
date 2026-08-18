import type { ReactNode } from 'react'

type Forma = 'arco' | 'rect'

const FORMA: Record<Forma, string> = {
  /* El arco de vitrina: único radio grande del sistema. */
  arco: 'rounded-t-[999px] rounded-b-borde',
  rect: 'rounded-borde',
}

export interface MediaPendienteProps {
  /**
   * Qué asset falta. Se muestra en el hueco, nunca se deja un vacío mudo.
   * Acepta un nodo para que los huecos que escalan puedan contrarrestar la
   * escala y mantener la leyenda legible.
   */
  etiqueta: ReactNode
  forma?: Forma
  /** Dimensiones reservadas — evitan CLS cuando llegue la foto real. */
  className?: string
  /** Marca superpuesta, p. ej. "VIDEO PENDIENTE · POSTER TEMPORAL". */
  marca?: ReactNode
  /** Apaga el color, para campañas finalizadas o productos no disponibles. */
  apagado?: boolean
  children?: ReactNode
}

/**
 * Hueco de imagen o video con dimensiones reservadas.
 *
 * Sustituye al `<image-slot>` del prototipo: cuando lleguen las fotos y videos
 * reales, este componente pasa a envolver `next/image` o `<video>` con el mismo
 * recorte y la misma caja, sin tocar la composición.
 */
export function MediaPendiente({
  etiqueta,
  forma = 'rect',
  className = '',
  marca,
  apagado = false,
  children,
}: MediaPendienteProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-linea bg-crema ${FORMA[forma]} ${apagado ? 'saturate-50' : ''} ${className}`}
    >
      <span className="px-3 text-center text-[10px] leading-snug font-normal text-tinta-tenue">
        {etiqueta}
      </span>
      {marca}
      {children}
    </div>
  )
}

/**
 * Marca de asset pendiente para las ventanas de video.
 *
 * `abajo` es la posición correcta dentro de un arco: arriba, la curva recorta
 * la marca a menos de la mitad de su ancho.
 */
export function MarcaVideo({
  children,
  posicion = 'centro',
}: {
  children: ReactNode
  posicion?: 'centro' | 'izquierda' | 'abajo'
}) {
  const POSICION = {
    centro: 'top-3 left-1/2 -translate-x-1/2',
    izquierda: 'top-3 left-3',
    abajo: 'bottom-3 left-1/2 -translate-x-1/2',
  }
  return (
    <span
      className={`pointer-events-none absolute bg-verde-profundo/80 px-2.5 py-[5px] text-[9.5px] font-semibold tracking-[0.1em] whitespace-nowrap text-papel ${POSICION[posicion]}`}
    >
      {children}
    </span>
  )
}
