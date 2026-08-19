import Image from 'next/image'
import type { ReactNode } from 'react'
import { fotoDeSlot } from '@/content/imagenes'

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
  /**
   * Identificador del hueco dentro del contrato de imágenes. Si `ASIGNACION`
   * tiene una fotografía para este slot, se muestra la foto; si no, la leyenda
   * del asset que falta.
   */
  slot?: string
  /** Sólo el hero carga con prioridad; todo lo demás es lazy. */
  prioridad?: boolean
  /** `sizes` responsive de `next/image`. */
  sizes?: string
  children?: ReactNode
}

/** Ancho por defecto del hueco cuando no se declara uno más preciso. */
const SIZES_POR_DEFECTO = '(max-width: 1023px) 100vw, 33vw'

/**
 * Hueco de imagen o video con dimensiones reservadas.
 *
 * Sustituye al `<image-slot>` del prototipo. Con una fotografía asignada
 * renderiza `next/image` recortado al marco editorial; sin ella conserva el
 * placeholder con la leyenda de qué falta. En ambos casos la caja mide lo mismo,
 * así que colocar una foto no mueve el layout.
 */
export function MediaPendiente({
  etiqueta,
  forma = 'rect',
  className = '',
  marca,
  apagado = false,
  slot,
  prioridad = false,
  sizes,
  children,
}: MediaPendienteProps) {
  const foto = slot ? fotoDeSlot(slot) : undefined

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-linea bg-crema ${FORMA[forma]} ${apagado ? 'saturate-50' : ''} ${className}`}
    >
      {foto ? (
        <Image
          src={`/${foto.archivo.replace(/^\/+/, '')}`}
          alt={foto.alt}
          fill
          sizes={sizes ?? SIZES_POR_DEFECTO}
          priority={prioridad}
          loading={prioridad ? undefined : 'lazy'}
          style={{
            objectFit: foto.objectFit ?? 'cover',
            objectPosition: foto.objectPosition ?? 'center',
          }}
        />
      ) : (
        <span className="px-3 text-center text-[10px] leading-snug font-normal text-tinta-tenue">
          {etiqueta}
        </span>
      )}
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
