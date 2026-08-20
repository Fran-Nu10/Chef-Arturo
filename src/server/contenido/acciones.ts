'use server'

import { revalidatePath } from 'next/cache'
import { clienteServidor } from '@/lib/supabase/servidor'
import { exigirAdmin, exigirOwner } from '@/server/autorizacion'
import { rechazoDemo } from '@/server/demo/guardia'
import { confirmarEscritura } from '@/server/resultados'
import type { Resultado } from '@/server/resultados'
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

  const mediaIds = mediosDeSeccion(validacion.datos)
  const resultado = await confirmarEscritura(
    supabase
      .from('site_sections')
      .update({
        draft: validacion.datos as Record<string, unknown>,
        media_ids: mediaIds,
      })
      .eq('key', clave)
      .select('key'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado

  // Las imágenes subidas desde el editor nacen marcadas como temporales;
  // guardar el borrador que las referencia las confirma. Mejor esfuerzo: si
  // esta escritura falla, sólo queda una marca conservadora de más.
  if (mediaIds.length > 0) {
    await supabase.from('media_assets').update({ is_temporary: false }).in('id', mediaIds)
  }

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
