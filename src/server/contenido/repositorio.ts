import 'server-only'

import { clienteServidor } from '@/lib/supabase/servidor'
import type { FilaSeccion } from '@/lib/supabase/tipos'
import { CLAVES_SECCION, type ClaveSeccion } from './esquemas'

/** Secciones publicadas, para el storefront. */
export async function seccionesPublicadas(): Promise<Record<string, unknown> | null> {
  const supabase = await clienteServidor()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('site_sections')
    .select('key, published, is_enabled')
    .eq('is_enabled', true)
    .not('published', 'is', null)

  if (error) throw error

  const mapa: Record<string, unknown> = {}
  for (const fila of data ?? []) mapa[fila.key] = fila.published
  return mapa
}

/** Todas las secciones, para el panel. */
export async function todasLasSecciones(): Promise<FilaSeccion[] | null> {
  const supabase = await clienteServidor()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('site_sections')
    .select('*')
    .order('position', { ascending: true })

  if (error) throw error

  // Se devuelven sólo las claves que la aplicación sabe renderizar: una fila
  // huérfana en la base no debe romper el panel.
  return (data ?? []).filter((s): s is FilaSeccion =>
    CLAVES_SECCION.includes(s.key as ClaveSeccion),
  )
}

export async function seccionPorClave(clave: ClaveSeccion): Promise<FilaSeccion | null> {
  const supabase = await clienteServidor()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('site_sections')
    .select('*')
    .eq('key', clave)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function listarMedios() {
  const supabase = await clienteServidor()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) throw error
  return data
}

/** Dónde se usa un archivo. El panel lo consulta antes de ofrecer el borrado. */
export async function usoDeMedio(mediaId: string) {
  const supabase = await clienteServidor()
  if (!supabase) return null

  const { data, error } = await supabase.rpc('media_asset_usage', { p_media_id: mediaId })
  if (error) throw error
  return data
}
