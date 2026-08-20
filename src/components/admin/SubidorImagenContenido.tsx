'use client'

import { useEffect, useRef, useState } from 'react'
import { clienteNavegador } from '@/lib/supabase/navegador'
import { registrarImagenDeContenidoAccion } from '@/server/medios/acciones'
import {
  detectarFormatoImagen,
  MENSAJE_FORMATO,
  MENSAJE_SUBIDA,
  MENSAJE_TAMANO,
  rutaDeSubida,
  TAMANO_MAXIMO_IMAGEN,
  type MimeImagen,
} from '@/lib/imagenes'

/**
 * Imagen de una sección de la home, sin ids a la vista.
 *
 * El editor de contenido guarda su borrador como JSON en el navegador, así
 * que acá la foto se sube y se registra al elegirla: el identificador
 * resultante entra al borrador por dentro y el dueño sólo ve su imagen. Antes
 * este campo pedía "Id de la imagen · Copialo desde Medios".
 */
export function SubidorImagenContenido({
  etiqueta,
  mediaId,
  alt,
  urlExistente,
  onImagen,
  onAlt,
}: {
  etiqueta: string
  mediaId: string | null
  alt: string
  /** URL pública del medio ya guardado, resuelta en el servidor. */
  urlExistente: string | null
  onImagen: (mediaId: string | null) => void
  onAlt: (texto: string) => void
}) {
  const entrada = useRef<HTMLInputElement>(null)
  const [previsualizacion, setPrevisualizacion] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(
    () => () => {
      if (previsualizacion) URL.revokeObjectURL(previsualizacion)
    },
    [previsualizacion],
  )

  const vista = mediaId ? (previsualizacion ?? urlExistente) : null

  async function elegirArchivo(archivo: File) {
    setError(null)
    if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
      setError(MENSAJE_TAMANO)
      return
    }
    let mime: MimeImagen | null = null
    try {
      mime = detectarFormatoImagen(new Uint8Array(await archivo.slice(0, 16).arrayBuffer()))
    } catch {
      mime = null
    }
    if (!mime) {
      setError(MENSAJE_FORMATO)
      return
    }

    const supabase = clienteNavegador()
    if (!supabase) {
      setError('Para subir fotos, el backend tiene que estar conectado.')
      return
    }

    setSubiendo(true)
    try {
      const ruta = rutaDeSubida('contenido', crypto.randomUUID(), mime)
      const { error: errorSubida } = await supabase.storage
        .from('media')
        .upload(ruta, archivo, { contentType: mime, upsert: false })
      if (errorSubida) {
        setError(MENSAJE_SUBIDA)
        return
      }

      let medidas: { width?: number; height?: number } = {}
      try {
        const mapa = await createImageBitmap(archivo)
        medidas = { width: mapa.width, height: mapa.height }
        mapa.close()
      } catch {
        // Sin medidas también sirve.
      }

      const registro = await registrarImagenDeContenidoAccion({
        path: ruta,
        alt,
        width: medidas.width ?? null,
        height: medidas.height ?? null,
        bytes: archivo.size,
      })
      if (!registro.ok || !registro.id) {
        setError(registro.error ?? MENSAJE_SUBIDA)
        return
      }

      setPrevisualizacion(URL.createObjectURL(archivo))
      onImagen(registro.id)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <fieldset className="m-0 flex flex-col gap-3 border border-linea p-3">
      <legend className="px-1 text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
        {etiqueta}
      </legend>

      <div className="flex flex-wrap items-start gap-4">
        <div className="relative aspect-[4/5] w-[140px] flex-none overflow-hidden border border-linea bg-crema">
          {vista ? (
            /* eslint-disable-next-line @next/next/no-img-element -- previsualización local */
            <img src={vista} alt={alt || 'Imagen de la sección'} className="h-full w-full object-cover" />
          ) : (
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              className="flex h-full w-full flex-col items-center justify-center gap-1.5 border border-dashed border-linea-fuerte bg-papel-alt px-3 text-center"
            >
              <span aria-hidden="true" className="font-display text-xl text-caramelo">
                +
              </span>
              <span className="text-[11.5px] leading-snug font-medium text-tinta-suave">
                {mediaId ? 'Imagen guardada' : 'Sin imagen'}
              </span>
            </button>
          )}
          {subiendo && (
            <div
              role="status"
              className="absolute inset-0 flex items-center justify-center bg-papel/85 px-3 text-center text-[12px] font-semibold text-verde"
            >
              Subiendo la foto…
            </div>
          )}
        </div>

        <div className="flex min-w-[160px] flex-1 flex-col items-start gap-2">
          <input
            ref={entrada}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif"
            className="sr-only"
            onChange={(e) => {
              const archivo = e.target.files?.[0]
              if (archivo) void elegirArchivo(archivo)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            disabled={subiendo}
            onClick={() => entrada.current?.click()}
            className="inline-flex min-h-[44px] items-center border border-linea-fuerte bg-papel px-4 text-[13px] font-medium text-tinta transition-colors hover:border-verde hover:text-verde"
          >
            {mediaId ? 'Reemplazar foto' : 'Elegir foto'}
          </button>
          {mediaId && (
            <button
              type="button"
              disabled={subiendo}
              onClick={() => {
                setPrevisualizacion(null)
                setError(null)
                onImagen(null)
              }}
              className="min-h-[44px] px-1 text-[12.5px] font-medium text-tinta-suave underline underline-offset-[3px]"
            >
              Quitar foto
            </button>
          )}
          <p className="m-0 text-[11.5px] leading-relaxed text-tinta-suave">
            JPG, PNG, WebP o AVIF, hasta 10 MB. El cambio queda en el borrador: se ve en el
            sitio al publicar.
          </p>
          {error && (
            <p role="alert" className="m-0 border border-alerta bg-alerta-fondo px-2.5 py-1.5 text-[12.5px] text-alerta">
              {error}
            </p>
          )}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
          Texto alternativo
        </span>
        <input
          value={alt}
          onChange={(e) => onAlt(e.target.value)}
          maxLength={300}
          className="min-h-[44px] w-full border border-linea-fuerte bg-papel px-3 text-sm text-tinta focus:border-verde focus:outline-none"
        />
        <span className="text-[11.5px] text-tinta-suave">
          Describí la escena. No nombres un plato que no esté validado.
        </span>
      </label>
    </fieldset>
  )
}
