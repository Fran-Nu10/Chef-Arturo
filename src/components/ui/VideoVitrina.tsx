'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

const TIPO_POR_EXTENSION: Record<string, string> = {
  webm: 'video/webm',
  mp4: 'video/mp4',
}

export interface VideoVitrinaProps {
  /**
   * Fuentes en orden de preferencia, ya con la barra inicial. El navegador se
   * queda con la primera que sepa decodificar: VP9 para Chrome, Firefox y
   * Android —que pesa bastante menos— y H.264 para Safari.
   */
  fuentes: readonly string[]
  /** Primer frame del video. Evita el parpadeo entre el póster y el arranque. */
  poster: string
  /** Describe la escena para quien no puede verla. */
  alt: string
  /** Punto focal del recorte, igual que en las fotografías. */
  objectPosition?: string
  /** `sizes` de `next/image`, para el póster con movimiento reducido. */
  sizes?: string
  className?: string
}

/**
 * Video de vitrina: reproduce solo, en silencio y en bucle.
 *
 * Se pausa cuando sale del viewport. No es una optimización cosmética: un video
 * decodificando fuera de pantalla gasta batería y CPU durante todo el scroll de
 * la home, y en mobile eso se nota.
 *
 * Con `prefers-reduced-motion` no se monta el `<video>` en absoluto —queda el
 * póster— porque pausarlo después de arrancar ya habría producido el
 * movimiento que la preferencia pide evitar.
 */
export function VideoVitrina({
  fuentes,
  poster,
  alt,
  objectPosition = 'center',
  sizes,
  className = '',
}: VideoVitrinaProps) {
  const referencia = useRef<HTMLVideoElement>(null)
  const reducido = useReducedMotion()

  useEffect(() => {
    const video = referencia.current
    if (!video) return

    // Sin IntersectionObserver —navegadores viejos, o entornos de prueba— el
    // video reproduce siempre. Es el comportamiento degradado correcto: se ve,
    // aunque no se pause al salir de pantalla.
    if (typeof IntersectionObserver === 'undefined') {
      void video.play().catch(() => {})
      return
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          // `play()` devuelve una promesa que se rechaza si el navegador
          // bloquea el autoplay. No es un error a propagar: queda el póster.
          void video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.01 },
    )

    observador.observe(video)
    return () => observador.disconnect()
  }, [reducido])

  const ajuste = { objectFit: 'cover' as const, objectPosition }

  if (reducido) {
    return (
      <Image
        src={poster}
        alt={alt}
        fill
        sizes={sizes}
        priority
        className={className}
        style={ajuste}
      />
    )
  }

  return (
    <video
      ref={referencia}
      poster={poster}
      role="img"
      aria-label={alt}
      autoPlay
      muted
      loop
      playsInline
      // `metadata` y no `auto`: el póster cubre el arranque y el archivo tiene
      // el átomo `moov` al principio, así que reproduce mientras descarga en
      // lugar de competir con el resto de la home por el ancho de banda.
      preload="metadata"
      disablePictureInPicture
      tabIndex={-1}
      className={`pointer-events-none h-full w-full ${className}`}
      style={ajuste}
    >
      {fuentes.map((fuente) => (
        <source
          key={fuente}
          src={fuente}
          type={TIPO_POR_EXTENSION[fuente.split('.').pop() ?? '']}
        />
      ))}
    </video>
  )
}
