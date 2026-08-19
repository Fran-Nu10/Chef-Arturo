'use server'

import { revalidatePath } from 'next/cache'
import { clienteServidor } from '@/lib/supabase/servidor'
import { exigirAdmin, exigirOwner } from '@/server/autorizacion'
import type { Resultado } from '@/server/catalogo/acciones'
import { Uuid } from '@/server/validacion'
import { esClaveSeccion, mediosDeSeccion, validarSeccion } from './esquemas'

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

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const { error } = await supabase
    .from('site_sections')
    .update({
      draft: validacion.datos as Record<string, unknown>,
      media_ids: mediosDeSeccion(validacion.datos),
    })
    .eq('key', clave)

  if (error) return { error: error.message }

  revalidatePath('/admin/contenido')
  return { ok: true }
}

/** Publica el borrador. Es el único momento en que el storefront ve el cambio. */
export async function publicarSeccion(_previo: Resultado, datos: FormData): Promise<Resultado> {
  await exigirAdmin()

  const clave = String(datos.get('clave') ?? '')
  if (!esClaveSeccion(clave)) return { error: 'Sección desconocida.' }

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

  const { error } = await supabase
    .from('site_sections')
    .update({ published: seccion.draft, published_at: new Date().toISOString() })
    .eq('key', clave)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/admin/contenido')
  return { ok: true }
}

export async function alternarSeccion(clave: string, habilitada: boolean): Promise<Resultado> {
  await exigirAdmin()
  if (!esClaveSeccion(clave)) return { error: 'Sección desconocida.' }

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const { error } = await supabase
    .from('site_sections')
    .update({ is_enabled: habilitada })
    .eq('key', clave)

  if (error) return { error: error.message }
  revalidatePath('/')
  revalidatePath('/admin/contenido')
  return { ok: true }
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

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const { data: usos } = await supabase.rpc('media_asset_usage', { p_media_id: id.data })
  if (usos && usos.length > 0) {
    const donde = usos.map((u) => u.usage_label).slice(0, 5).join(', ')
    return { error: `No se puede borrar: lo usa ${donde}.` }
  }

  const { data: medio } = await supabase
    .from('media_assets')
    .select('bucket, path')
    .eq('id', id.data)
    .maybeSingle()

  if (medio) {
    await supabase.storage.from(medio.bucket).remove([medio.path])
  }

  const { error } = await supabase.from('media_assets').delete().eq('id', id.data)
  if (error) return { error: error.message }

  revalidatePath('/admin/medios')
  return { ok: true }
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

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: clave, value: valor as Record<string, unknown> }, { onConflict: 'key' })

  if (error) return { error: error.message }

  revalidatePath('/admin/ajustes')
  revalidatePath('/')
  return { ok: true }
}
