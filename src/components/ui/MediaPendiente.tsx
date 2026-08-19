import Image from 'next/image'
import type { ReactNode } from 'react'
import { fotoDeSlot } from '@/content/imagenes'

export interface MediaPendienteProps {
  /**
   * Qué asset falta. Se muestra en el hueco, nunca se deja un vacío mudo.
   * Acepta un nodo para que los huecos que escalan puedan contrarrestar la
   * escala y mantener la leyenda legible.
   */
  etiqueta: ReactNode
  /**
   * El arco de vitrina. Es la firma visual de la casa y por eso está racionado:
   * sólo la ventana del hero y el producto protagonista de "Del mostrador de
   * hoy" pueden llevarlo. Todo lo demás usa marco rectangular editorial.
   */
  arco?: boolean
  /**
   * Proporción del marco, en la forma `4/5`. Reserva la caja —evita CLS— y se
   * elige según el sujeto de cada fotografía, no por uniformidad.
   */
  ratio?: string
  /** Dimensiones o ajustes extra. */
  className?: string
  /** Marca superpuesta, p. ej. "VIDEO PENDIENTE". */
  marca?: ReactNode
  /** Apaga el color, para campañas finalizadas o productos no disponibles. */
  apagado?: boolean
  /** Identificador del hueco dentro del contrato de imágenes. */
  slot?: string
  /** Sólo el hero carga con prioridad; todo lo demás es lazy. */
  prioridad?: boolean
  /** `sizes` responsive de `next/image`. */
  sizes?: string
  /** Dibuja el hairline del sistema. Se omite cuando la foto se basta sola. */
  conBorde?: boolean
  children?: ReactNode
}

const SIZES_POR_DEFECTO = '(max-width: 1023px) 100vw, 33vw'

/**
 * Hueco de imagen o video con dimensiones reservadas.
 *
 * Con una fotografía asignada renderiza `next/image` con el `object-fit` y el
 * `object-position` que declara el manifiesto para esa foto en particular; sin
 * ella conserva el placeholder con la leyenda de qué falta. En ambos casos la
 * caja mide lo mismo, así que colocar una foto no mueve el layout.
 */
export function MediaPendiente({
  etiqueta,
  arco = false,
  ratio,
  className = '',
  marca,
  apagado = false,
  slot,
  prioridad = false,
  sizes,
  conBorde = true,
  children,
}: MediaPendienteProps) {
  const foto = slot ? fotoDeSlot(slot) : undefined
  const ajuste = foto?.objectFit ?? 'cover'
  const proporcion = ratio ?? foto?.ratio

  // Radio: el arco de vitrina, o el rectángulo editorial de 0–4px del sistema.
  const forma = arco ? 'rounded-t-[999px] rounded-b-borde' : 'rounded-borde'

  return (
    <div
      style={proporcion ? { aspectRatio: proporcion } : undefined}
      className={`relative flex items-center justify-center overflow-hidden ${forma} ${
        // `contain` necesita un fondo detrás; `cover` lo tapa entero.
        ajuste === 'contain' || !foto ? 'bg-crema' : ''
      } ${conBorde ? 'border border-linea' : ''} ${apagado ? 'saturate-50' : ''} ${className}`}
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
            objectFit: ajuste,
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
