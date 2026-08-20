import 'server-only'

import {
  esRutaDeSubida,
  mimeDeRuta,
  TAMANO_MAXIMO_IMAGEN,
  type CarpetaDeSubida,
} from '@/lib/imagenes'
import type { clienteServidor } from '@/lib/supabase/servidor'
import { confirmarEscritura, mensajeDeBase, type Resultado } from '@/server/resultados'

type Cliente = NonNullable<Awaited<ReturnType<typeof clienteServidor>>>

/**
 * La imagen que llega junto con un formulario del panel.
 *
 * El archivo ya está en Storage cuando la acción se ejecuta: lo subió el
 * navegador con la sesión del administrador, gobernado por RLS. Acá sólo
 * llega la ruta —que se valida contra la forma exacta `<carpeta>/<uuid>.<ext>`
 * que genera el propio panel— y los metadatos informativos.
 */
export interface EnvioDeImagen {
  nueva: { path: string; width: number | null; height: number | null; bytes: number | null } | null
  quitar: boolean
}

const NO_SE_GUARDO = 'No se guardaron los cambios. Tu información sigue en el formulario.'

/** Lee y valida los campos de imagen del formulario. */
export function leerImagenDelFormulario(
  datos: FormData,
  carpeta: CarpetaDeSubida,
): EnvioDeImagen | { error: string } {
  const path = datos.get('imagenNueva')
  const quitar = datos.get('imagenQuitar') === '1'

  if (typeof path !== 'string' || path === '') return { nueva: null, quitar }

  // La ruta la generó este mismo panel. Cualquier otra forma —un `..`, una
  // carpeta ajena, un nombre libre— es un formulario adulterado.
  if (!esRutaDeSubida(path, carpeta)) return { error: 'La imagen enviada no es válida.' }

  const numero = (clave: string, maximo: number) => {
    const crudo = Number(datos.get(clave))
    return Number.isInteger(crudo) && crudo > 0 && crudo <= maximo ? crudo : null
  }

  return {
    nueva: {
      path,
      width: numero('imagenAncho', 100_000),
      height: numero('imagenAlto', 100_000),
      bytes: numero('imagenPeso', TAMANO_MAXIMO_IMAGEN),
    },
    quitar,
  }
}

/** Borra de Storage un archivo recién subido cuyo guardado falló. */
async function borrarObjetoSubido(supabase: Cliente, path: string): Promise<void> {
  const { error } = await supabase.storage.from('media').remove([path])
  if (error) {
    // No se le puede hacer nada desde acá: se deja constancia para limpiarlo.
    console.error(`[medios] quedó un archivo huérfano en media/${path}:`, error.message)
  }
}

/** Registra el archivo subido en `media_assets` y devuelve su id. */
async function registrarMedio(
  supabase: Cliente,
  nueva: NonNullable<EnvioDeImagen['nueva']>,
  alt: string,
): Promise<{ id: string } | { error: string }> {
  const mime = mimeDeRuta(nueva.path)
  if (!mime) return { error: 'La imagen enviada no es válida.' }

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      bucket: 'media',
      path: nueva.path,
      alt,
      mime_type: mime,
      width: nueva.width,
      height: nueva.height,
      bytes: nueva.bytes,
      source: 'own',
      is_temporary: false,
    })
    .select('id')
    .single()

  if (error) {
    await borrarObjetoSubido(supabase, nueva.path)
    return { error: mensajeDeBase(error) }
  }
  return { id: data.id }
}

/** Deshace un registro recién creado cuando el paso siguiente falló. */
async function deshacerRegistro(supabase: Cliente, mediaId: string, path: string): Promise<void> {
  await supabase.from('media_assets').delete().eq('id', mediaId)
  await borrarObjetoSubido(supabase, path)
}

/**
 * Borra un medio sólo si ya nada lo referencia.
 *
 * Se consulta `media_asset_usage` —productos, categorías y secciones— después
 * de haber actualizado la relación. Si el archivo se usa en otro lado, se deja
 * intacto: una imagen compartida jamás se borra. Si la comprobación falla, no
 * se borra nada: el costo de un archivo de más es menor que el de un hueco
 * roto en el sitio.
 */
async function limpiarMedioSiHuerfano(supabase: Cliente, mediaId: string): Promise<void> {
  const { data: usos, error } = await supabase.rpc('media_asset_usage', { p_media_id: mediaId })
  if (error || !usos || usos.length > 0) return

  const { data: medio } = await supabase
    .from('media_assets')
    .select('bucket, path')
    .eq('id', mediaId)
    .maybeSingle()

  const { error: errorFila } = await supabase.from('media_assets').delete().eq('id', mediaId)
  if (errorFila || !medio) return

  await borrarObjetoSubido(supabase, medio.path)
}

/**
 * Aplica el cambio de foto de un producto.
 *
 * Se llama después de que el producto en sí ya se guardó. El orden importa:
 *
 *   1. Registrar el archivo nuevo en `media_assets`.
 *   2. Crear o actualizar la relación en `product_images`.
 *   3. Recién entonces, borrar la imagen anterior — y sólo si quedó huérfana.
 *
 * Si el paso 1 o el 2 fallan, el archivo recién subido se elimina de Storage:
 * no quedan huérfanos y el formulario conserva lo que el operador escribió.
 */
export async function aplicarImagenDeProducto(
  supabase: Cliente,
  productoId: string,
  nombreProducto: string,
  envio: EnvioDeImagen,
): Promise<Resultado> {
  if (!envio.nueva && !envio.quitar) return { ok: true }

  const { data: actual, error: errorActual } = await supabase
    .from('product_images')
    .select('id, media_id')
    .eq('product_id', productoId)
    .order('is_primary', { ascending: false })
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (errorActual) {
    if (envio.nueva) await borrarObjetoSubido(supabase, envio.nueva.path)
    return { error: NO_SE_GUARDO }
  }

  // Quitar sin reemplazo: se desvincula y después se limpia si quedó huérfana.
  if (!envio.nueva) {
    if (!actual) return { ok: true }
    const borrado = await confirmarEscritura(
      supabase.from('product_images').delete().eq('id', actual.id).select('id'),
      NO_SE_GUARDO,
    )
    if (!borrado.ok) return borrado
    await limpiarMedioSiHuerfano(supabase, actual.media_id)
    return { ok: true }
  }

  const registro = await registrarMedio(supabase, envio.nueva, nombreProducto)
  if ('error' in registro) return { error: registro.error }

  const relacion = actual
    ? await confirmarEscritura(
        supabase
          .from('product_images')
          .update({ media_id: registro.id, alt: nombreProducto, is_primary: true })
          .eq('id', actual.id)
          .select('id'),
        NO_SE_GUARDO,
      )
    : await confirmarEscritura(
        supabase
          .from('product_images')
          .insert({
            product_id: productoId,
            media_id: registro.id,
            alt: nombreProducto,
            position: 0,
            is_primary: true,
          })
          .select('id'),
        NO_SE_GUARDO,
      )

  if (!relacion.ok) {
    await deshacerRegistro(supabase, registro.id, envio.nueva.path)
    return relacion
  }

  if (actual && actual.media_id !== registro.id) {
    await limpiarMedioSiHuerfano(supabase, actual.media_id)
  }
  return { ok: true }
}

/**
 * Aplica el cambio de foto de una categoría. Mismo contrato que la de
 * producto, pero la relación es directa: `categories.image_id`.
 */
export async function aplicarImagenDeCategoria(
  supabase: Cliente,
  categoriaId: string,
  nombreCategoria: string,
  envio: EnvioDeImagen,
): Promise<Resultado> {
  if (!envio.nueva && !envio.quitar) return { ok: true }

  const { data: fila, error: errorActual } = await supabase
    .from('categories')
    .select('image_id')
    .eq('id', categoriaId)
    .maybeSingle()

  if (errorActual || !fila) {
    if (envio.nueva) await borrarObjetoSubido(supabase, envio.nueva.path)
    return { error: NO_SE_GUARDO }
  }
  const anterior = fila.image_id

  if (!envio.nueva) {
    if (!anterior) return { ok: true }
    const borrado = await confirmarEscritura(
      supabase.from('categories').update({ image_id: null }).eq('id', categoriaId).select('id'),
      NO_SE_GUARDO,
    )
    if (!borrado.ok) return borrado
    await limpiarMedioSiHuerfano(supabase, anterior)
    return { ok: true }
  }

  const registro = await registrarMedio(supabase, envio.nueva, `Categoría ${nombreCategoria}`)
  if ('error' in registro) return { error: registro.error }

  const enlace = await confirmarEscritura(
    supabase
      .from('categories')
      .update({ image_id: registro.id })
      .eq('id', categoriaId)
      .select('id'),
    NO_SE_GUARDO,
  )
  if (!enlace.ok) {
    await deshacerRegistro(supabase, registro.id, envio.nueva.path)
    return enlace
  }

  if (anterior && anterior !== registro.id) {
    await limpiarMedioSiHuerfano(supabase, anterior)
  }
  return { ok: true }
}

/**
 * Registra en `media_assets` una imagen subida desde el editor de contenido.
 *
 * A diferencia de productos y categorías, acá el vínculo vive dentro del JSON
 * del borrador de la sección, que todavía no se guardó. Por eso nace marcada
 * `is_temporary`: si el borrador nunca se guarda, queda a la vista que el
 * archivo está suelto. Al guardar el borrador, la sección la confirma.
 */
export async function registrarImagenDeContenido(
  supabase: Cliente,
  envio: NonNullable<EnvioDeImagen['nueva']>,
  alt: string,
): Promise<{ id: string } | { error: string }> {
  const mime = mimeDeRuta(envio.path)
  if (!mime) return { error: 'La imagen enviada no es válida.' }

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      bucket: 'media',
      path: envio.path,
      alt,
      mime_type: mime,
      width: envio.width,
      height: envio.height,
      bytes: envio.bytes,
      source: 'own',
      is_temporary: true,
    })
    .select('id')
    .single()

  if (error) {
    await borrarObjetoSubido(supabase, envio.path)
    return { error: mensajeDeBase(error) }
  }
  return { id: data.id }
}
