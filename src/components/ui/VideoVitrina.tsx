'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

const TIPO_POR_EXTENSION: Record<string, string> = {
  webm: 'video/webm',
  mp4: 'video/mp4',
}

/** Gestos que devuelven el permiso de reproducir cuando el navegador lo negó. */
const GESTOS = ['pointerdown', 'touchstart', 'keydown', 'scroll'] as const

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
 * Video de vitrina: reproduce solo, en silencio, en bucle y sin botón de play.
 *
 * Autoplay no es una garantía. El navegador lo puede negar o deshacer en
 * cualquier momento, y cuando lo hace el video queda pausado con el triángulo
 * de WebKit encima. En una tienda eso se lee como algo roto. Los casos reales,
 * todos en teléfono:
 *
 *   · El iPhone está en modo de bajo consumo. Safari niega el autoplay incluso
 *     en silencio, y lo niega desde el principio.
 *   · La persona cambia de app o de pestaña y vuelve. iOS pausa el video al
 *     irse y no lo reanuda al volver.
 *   · Se vuelve con el botón "atrás". La página sale de la caché de Safari con
 *     el video como estaba: pausado.
 *   · La conexión no dio para arrancar en el primer intento.
 *
 * Así que acá no se llama a `play()` una vez y se espera lo mejor: se insiste
 * en cada momento en que el permiso puede haber cambiado, y si el navegador lo
 * niega se espera al primer gesto de la persona, que es lo que Safari acepta
 * como permiso. Si aun así no reproduce, queda el póster —una fotografía de la
 * casa— y el CSS se encarga de que no aparezca ningún triángulo encima.
 *
 * Con `prefers-reduced-motion` no se monta el `<video>` en absoluto: pausarlo
 * después de arrancar ya habría producido el movimiento que la preferencia
 * pide evitar.
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

    // Mientras el video está fuera de pantalla se pausa a propósito, y ahí una
    // pausa no es un problema que haya que corregir. Esta bandera distingue las
    // dos situaciones.
    let deberiaReproducir = true
    let esperandoGesto = false
    let vivo = true

    const alGesto = () => {
      esperandoGesto = false
      quitarGestos()
      void reproducir()
    }

    const quitarGestos = () => {
      for (const g of GESTOS) document.removeEventListener(g, alGesto)
    }

    /**
     * Reproduce, y si el navegador dice que no, espera al primer gesto.
     *
     * Un gesto —tocar, desplazar, teclear— devuelve el permiso en Safari, así
     * que basta con volver a intentarlo entonces. Se registra una sola vez: no
     * tiene sentido acumular escuchas por cada intento fallido.
     */
    const reproducir = async () => {
      if (!vivo || !deberiaReproducir || !video.paused) return
      // Safari mira la propiedad, no el atributo, y una extensión o el propio
      // usuario pueden haberla cambiado. Un video con sonido no autoreproduce
      // en ningún navegador.
      video.muted = true
      try {
        await video.play()
      } catch {
        if (esperandoGesto) return
        esperandoGesto = true
        for (const g of GESTOS) {
          document.addEventListener(g, alGesto, { once: true, passive: true })
        }
      }
    }

    // Momentos en los que el permiso o el estado pueden haber cambiado.
    const alVolverALaPestana = () => {
      if (document.visibilityState === 'visible') void reproducir()
    }
    // `pageshow` cubre la vuelta con el botón "atrás": Safari restaura la
    // página desde su caché con el video tal como quedó, es decir pausado.
    const alRestaurar = () => void reproducir()
    // Si algo pausó el video mientras está a la vista, no fuimos nosotros.
    const alPausar = () => void reproducir()

    video.addEventListener('canplay', alRestaurar)
    video.addEventListener('loadeddata', alRestaurar)
    video.addEventListener('pause', alPausar)
    document.addEventListener('visibilitychange', alVolverALaPestana)
    window.addEventListener('pageshow', alRestaurar)

    // Sin IntersectionObserver —navegadores viejos, o entornos de prueba— el
    // video reproduce siempre. Es el comportamiento degradado correcto: se ve,
    // aunque no se pause al salir de pantalla.
    const observador =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            ([entrada]) => {
              deberiaReproducir = entrada.isIntersecting
              if (deberiaReproducir) void reproducir()
              else video.pause()
            },
            // Un video decodificando fuera de pantalla gasta batería y CPU
            // durante todo el scroll de la home. Se pausa recién cuando no
            // queda nada a la vista, para que un desplazamiento corto no lo
            // corte.
            { threshold: 0 },
          )

    observador?.observe(video)
    void reproducir()

    return () => {
      vivo = false
      observador?.disconnect()
      quitarGestos()
      video.removeEventListener('canplay', alRestaurar)
      video.removeEventListener('loadeddata', alRestaurar)
      video.removeEventListener('pause', alPausar)
      document.removeEventListener('visibilitychange', alVolverALaPestana)
      window.removeEventListener('pageshow', alRestaurar)
    }
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
      // `video-vitrina` no da estilo: le quita a WebKit el botón de arranque
      // que dibuja encima cuando el video queda pausado. Está en globals.css,
      // porque son pseudoelementos y Tailwind no los alcanza.
      className={`video-vitrina pointer-events-none h-full w-full ${className}`}
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
