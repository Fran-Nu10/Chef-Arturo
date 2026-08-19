'use server'

import { revalidatePath } from 'next/cache'
import { clienteServidor } from '@/lib/supabase/servidor'
import { exigirAdmin, exigirOwner } from '@/server/autorizacion'
import { rechazoDemo } from '@/server/demo/guardia'
import { confirmarEscritura } from '@/server/resultados'
import type { Resultado } from '@/server/resultados'
import { Uuid } from '@/server/validacion'
import { esClaveSeccion, mediosDeSeccion, validarSeccion } from './esquemas'

const NO_ALCANZO =
  'No se guardó: la sección no existe o tu usuario no tiene permiso para modificarla.'

/**
 * Guarda el borrador de una sección.
 *
 * El contenido llega como JSON desde el formulario estructurado del panel y se
 * valida contra el esquema Zod de esa clave. Lo que no encaje se rechaza con
 * el error apuntando al campo: nunca se guarda una forma arbitraria.
 */
export async function guardarBorradorSeccion(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  await exigirAdmin()

  const clave = String(datos.get('clave') ?? '')
  if (!esClaveSeccion(clave)) return { error: 'Sección desconocida.' }

  let contenido: unknown
  try {
    contenido = JSON.parse(String(datos.get('contenido') ?? '{}'))
  } catch {
    return { error: 'El contenido enviado no es válido.' }
  }

  const validacion = validarSeccion(clave, contenido)
  if (!validacion.ok) {
    const errores: Record<string, string> = {}
    for (const e of validacion.errores) errores[e.campo] ??= e.mensaje
    return { errores }
  }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const resultado = await confirmarEscritura(
    supabase
      .from('site_sections')
      .update({
        draft: validacion.datos as Record<string, unknown>,
        media_ids: mediosDeSeccion(validacion.datos),
      })
      .eq('key', clave)
      .select('key'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado

  revalidatePath('/admin/contenido')
  return resultado
}

/** Publica el borrador. Es el único momento en que el storefront ve el cambio. */
export async function publicarSeccion(_previo: Resultado, datos: FormData): Promise<Resultado> {
  await exigirAdmin()

  const clave = String(datos.get('clave') ?? '')
  if (!esClaveSeccion(clave)) return { error: 'Sección desconocida.' }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const { data: seccion } = await supabase
    .from('site_sections')
    .select('draft')
    .eq('key', clave)
    .maybeSingle()

  if (!seccion) return { error: 'La sección no existe.' }

  // Se revalida al publicar: un borrador guardado antes de un cambio de
  // esquema no debe llegar al sitio público.
  const validacion = validarSeccion(clave, seccion.draft)
  if (!validacion.ok) {
    return {
      error: 'El borrador ya no cumple el contrato de la sección. Revisá los campos.',
    }
  }

  // Se publica `validacion.datos`, no `seccion.draft`. Zod descarta las claves
  // que no están en el contrato: publicar el borrador crudo dejaba pasar al
  // storefront cualquier campo extra que hubiera quedado guardado.
  const resultado = await confirmarEscritura(
    supabase
      .from('site_sections')
      .update({
        published: validacion.datos as Record<string, unknown>,
        published_at: new Date().toISOString(),
      })
      .eq('key', clave)
      .select('key'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado

  revalidatePath('/')
  revalidatePath('/admin/contenido')
  return resultado
}

export async function alternarSeccion(clave: string, habilitada: boolean): Promise<Resultado> {
  await exigirAdmin()
  if (!esClaveSeccion(clave)) return { error: 'Sección desconocida.' }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const resultado = await confirmarEscritura(
    supabase.from('site_sections').update({ is_enabled: habilitada }).eq('key', clave).select('key'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado
  revalidatePath('/')
  revalidatePath('/admin/contenido')
  return resultado
}

/**
 * Borra un archivo de medios.
 *
 * Antes comprueba que no esté en uso: si un producto o una sección lo
 * referencia, se rechaza con el detalle de quién lo usa.
 */
export async function borrarMedio(mediaId: string): Promise<Resultado> {
  await exigirAdmin()
  const id = Uuid.safeParse(mediaId)
  if (!id.success) return { error: 'Archivo inválido.' }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const { data: usos, error: errorUsos } = await supabase.rpc('media_asset_usage', {
    p_media_id: id.data,
  })
  // Si no se puede comprobar el uso, no se borra: el riesgo es dejar un hueco
  // roto en el sitio.
  if (errorUsos) return { error: 'No se pudo comprobar si el archivo está en uso.' }
  if (usos && usos.length > 0) {
    const donde = usos.map((u) => u.usage_label).slice(0, 5).join(', ')
    return { error: `No se puede borrar: lo usa ${donde}.` }
  }

  const { data: medio } = await supabase
    .from('media_assets')
    .select('bucket, path')
    .eq('id', id.data)
    .maybeSingle()

  // Primero la fila, después el objeto. Al revés —como estaba— un borrado que
  // RLS bloqueaba en silencio ya había destruido el archivo: quedaba la fila
  // apuntando a un objeto inexistente y la acción decía que todo salió bien.
  const resultado = await confirmarEscritura(
    supabase.from('media_assets').delete().eq('id', id.data).select('id'),
    'No se borró: el archivo no existe o no tenés permiso para eliminarlo.',
  )
  if (!resultado.ok) return resultado

  if (medio) {
    const { error: errorStorage } = await supabase.storage
      .from(medio.bucket)
      .remove([medio.path])
    if (errorStorage) {
      // La fila ya no está; el objeto sí. Se dice, porque queda ocupando
      // espacio y hay que limpiarlo a mano.
      return {
        ok: true,
        error: `Se quitó del listado, pero el archivo sigue en Storage (${medio.bucket}/${medio.path}). Borralo desde Supabase.`,
      }
    }
  }

  revalidatePath('/admin/medios')
  return resultado
}

/** Ajustes del sitio. Configuración crítica: sólo el dueño. */
export async function guardarAjuste(_previo: Resultado, datos: FormData): Promise<Resultado> {
  await exigirOwner()

  const clave = String(datos.get('clave') ?? '')
  if (!/^[a-z0-9_]+$/.test(clave)) return { error: 'Clave de ajuste inválida.' }

  let valor: unknown
  try {
    valor = JSON.parse(String(datos.get('valor') ?? '{}'))
  } catch {
    return { error: 'El valor enviado no es válido.' }
  }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const resultado = await confirmarEscritura(
    supabase
      .from('site_settings')
      .upsert({ key: clave, value: valor as Record<string, unknown> }, { onConflict: 'key' })
      .select('key'),
    'No se guardó el ajuste.',
  )
  if (!resultado.ok) return resultado

  revalidatePath('/admin/ajustes')
  revalidatePath('/')
  return resultado
}
