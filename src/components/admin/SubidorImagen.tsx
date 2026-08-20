'use client'

import { useEffect, useRef, useState, type DragEvent } from 'react'
import { clienteNavegador } from '@/lib/supabase/navegador'
import {
  detectarFormatoImagen,
  MENSAJE_FORMATO,
  MENSAJE_SUBIDA,
  MENSAJE_TAMANO,
  rutaDeSubida,
  TAMANO_MAXIMO_IMAGEN,
  type CarpetaDeSubida,
  type MimeImagen,
} from '@/lib/imagenes'

/**
 * Subida de imágenes del panel, en dos tiempos.
 *
 * Al elegir el archivo no se sube nada: se valida (formato real por firma
 * binaria, tamaño) y se muestra la previsualización local. La subida ocurre
 * recién al guardar el formulario —`prepararEnvio`—: el navegador manda el
 * archivo directo a Storage con la sesión del administrador (RLS mediante) y
 * la Server Action recibe sólo la ruta. Si el guardado falla, el servidor
 * borra el archivo subido y el formulario conserva todo lo escrito.
 *
 * El operador nunca ve un id, una ruta ni un bucket: ve su foto.
 */

export interface ImagenExistente {
  url: string
  alt: string
}

export interface ControlSubidor {
  imagenActual: ImagenExistente | null
  /** Lo que se muestra ahora mismo: previsualización local o imagen guardada. */
  vista: string | null
  pendiente: boolean
  quitar: boolean
  subiendo: boolean
  error: string | null
  elegirArchivo: (archivo: File) => Promise<void>
  marcarQuitar: () => void
  deshacerQuitar: () => void
  /** Descarta el archivo elegido y vuelve a la imagen guardada (si había). */
  descartar: () => void
  /** Sube el archivo pendiente y completa el FormData. `false` = no enviar. */
  prepararEnvio: (datos: FormData) => Promise<boolean>
  /** Limpia el estado pendiente después de un guardado exitoso. */
  confirmarGuardado: () => void
}

async function dimensiones(archivo: File): Promise<{ width?: number; height?: number }> {
  try {
    const mapa = await createImageBitmap(archivo)
    const medidas = { width: mapa.width, height: mapa.height }
    mapa.close()
    return medidas
  } catch {
    // AVIF en navegadores viejos: la imagen sube igual, sin medidas.
    return {}
  }
}

export function useSubidorImagen(opciones: {
  carpeta: CarpetaDeSubida
  imagenActual?: ImagenExistente | null
}): ControlSubidor {
  const { carpeta, imagenActual = null } = opciones
  const [archivo, setArchivo] = useState<{ archivo: File; mime: MimeImagen } | null>(null)
  const [previsualizacion, setPrevisualizacion] = useState<string | null>(null)
  const [quitar, setQuitar] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(
    () => () => {
      if (previsualizacion) URL.revokeObjectURL(previsualizacion)
    },
    [previsualizacion],
  )

  async function elegirArchivo(nuevo: File) {
    setError(null)
    if (nuevo.size > TAMANO_MAXIMO_IMAGEN) {
      setError(MENSAJE_TAMANO)
      return
    }

    // El tipo declarado por el navegador se puede falsear con renombrar el
    // archivo; la firma binaria de los primeros bytes, no.
    let mime: MimeImagen | null = null
    try {
      mime = detectarFormatoImagen(new Uint8Array(await nuevo.slice(0, 16).arrayBuffer()))
    } catch {
      mime = null
    }
    if (!mime) {
      setError(MENSAJE_FORMATO)
      return
    }

    setArchivo({ archivo: nuevo, mime })
    setQuitar(false)
    setPrevisualizacion(URL.createObjectURL(nuevo))
  }

  async function prepararEnvio(datos: FormData): Promise<boolean> {
    setError(null)

    if (archivo) {
      const supabase = clienteNavegador()
      if (!supabase) {
        setError('Para subir fotos, el backend tiene que estar conectado.')
        return false
      }

      setSubiendo(true)
      try {
        const ruta = rutaDeSubida(carpeta, crypto.randomUUID(), archivo.mime)
        const { error: errorSubida } = await supabase.storage
          .from('media')
          .upload(ruta, archivo.archivo, { contentType: archivo.mime, upsert: false })

        if (errorSubida) {
          setError(MENSAJE_SUBIDA)
          return false
        }

        const medidas = await dimensiones(archivo.archivo)
        datos.set('imagenNueva', ruta)
        if (medidas.width) datos.set('imagenAncho', String(medidas.width))
        if (medidas.height) datos.set('imagenAlto', String(medidas.height))
        datos.set('imagenPeso', String(archivo.archivo.size))
        return true
      } finally {
        setSubiendo(false)
      }
    }

    if (quitar) datos.set('imagenQuitar', '1')
    return true
  }

  return {
    imagenActual,
    vista: quitar ? null : (previsualizacion ?? imagenActual?.url ?? null),
    pendiente: archivo !== null,
    quitar,
    subiendo,
    error,
    elegirArchivo,
    marcarQuitar: () => {
      setArchivo(null)
      setPrevisualizacion(null)
      setQuitar(true)
      setError(null)
    },
    deshacerQuitar: () => setQuitar(false),
    descartar: () => {
      setArchivo(null)
      setPrevisualizacion(null)
      setQuitar(false)
      setError(null)
    },
    prepararEnvio,
    confirmarGuardado: () => {
      setArchivo(null)
      setQuitar(false)
      setError(null)
    },
  }
}

const BOTON_SECUNDARIO =
  'inline-flex min-h-[44px] items-center border border-linea-fuerte bg-papel px-4 text-[13px] font-medium text-tinta transition-colors hover:border-verde hover:text-verde'

export function SubidorImagen({
  control,
  etiqueta,
  ayuda = 'Usá una foto clara y vertical. JPG, PNG, WebP o AVIF, hasta 10 MB.',
}: {
  control: ControlSubidor
  etiqueta: string
  ayuda?: string
}) {
  const entrada = useRef<HTMLInputElement>(null)
  const [arrastrando, setArrastrando] = useState(false)

  function soltar(evento: DragEvent) {
    evento.preventDefault()
    setArrastrando(false)
    const archivo = evento.dataTransfer.files?.[0]
    if (archivo) void control.elegirArchivo(archivo)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
        {etiqueta}
      </span>

      <div className="flex flex-wrap items-start gap-4">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setArrastrando(true)
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={soltar}
          className={`relative aspect-[4/5] w-[180px] flex-none overflow-hidden border ${
            control.vista
              ? 'border-linea bg-crema'
              : `border-dashed ${arrastrando ? 'border-verde bg-verde/[0.05]' : 'border-linea-fuerte bg-papel-alt'}`
          }`}
        >
          {control.vista ? (
            /* La previsualización local es un blob: y next/image no la sirve. */
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={control.vista}
              alt={control.imagenActual?.alt ?? 'Foto elegida'}
              className="h-full w-full object-cover"
            />
          ) : (
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center"
            >
              <span aria-hidden="true" className="font-display text-2xl text-caramelo">
                +
              </span>
              <span className="text-[12.5px] leading-snug font-medium text-tinta-suave">
                {control.quitar ? 'Sin foto' : 'Arrastrá una foto acá o tocá para elegirla'}
              </span>
            </button>
          )}

          {control.subiendo && (
            <div
              role="status"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-papel/85 px-4"
            >
              <span className="text-[12.5px] font-semibold text-verde">Subiendo la foto…</span>
              <span className="h-1 w-3/4 overflow-hidden bg-linea">
                <span className="block h-full w-1/3 animate-pulse bg-verde" />
              </span>
            </div>
          )}
        </div>

        <div className="flex min-w-[180px] flex-1 flex-col items-start gap-2">
          <input
            ref={entrada}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif"
            className="sr-only"
            onChange={(e) => {
              const archivo = e.target.files?.[0]
              if (archivo) void control.elegirArchivo(archivo)
              e.target.value = ''
            }}
          />

          <button
            type="button"
            onClick={() => entrada.current?.click()}
            disabled={control.subiendo}
            className={BOTON_SECUNDARIO}
          >
            {control.vista ? 'Reemplazar foto' : control.imagenActual ? 'Elegir otra foto' : 'Elegir foto'}
          </button>

          {control.vista && !control.pendiente && control.imagenActual && (
            <button
              type="button"
              onClick={control.marcarQuitar}
              disabled={control.subiendo}
              className="min-h-[44px] px-1 text-[12.5px] font-medium text-tinta-suave underline underline-offset-[3px]"
            >
              Quitar foto
            </button>
          )}
          {control.pendiente && (
            <button
              type="button"
              onClick={control.descartar}
              disabled={control.subiendo}
              className="min-h-[44px] px-1 text-[12.5px] font-medium text-tinta-suave underline underline-offset-[3px]"
            >
              Descartar esta foto
            </button>
          )}

          {control.pendiente && (
            <p className="m-0 border border-dashed border-caramelo px-2.5 py-1.5 text-[12px] text-caramelo-texto">
              La foto se sube al guardar.
            </p>
          )}
          {control.quitar && (
            <p className="m-0 flex flex-wrap items-center gap-2 border border-dashed border-caramelo px-2.5 py-1.5 text-[12px] text-caramelo-texto">
              La foto se quitará al guardar.
              <button
                type="button"
                onClick={control.deshacerQuitar}
                className="font-medium underline underline-offset-[3px]"
              >
                Deshacer
              </button>
            </p>
          )}

          <p className="m-0 text-[11.5px] leading-relaxed text-tinta-suave">{ayuda}</p>
          {control.error && (
            <p role="alert" className="m-0 border border-alerta bg-alerta-fondo px-2.5 py-1.5 text-[12.5px] text-alerta">
              {control.error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
