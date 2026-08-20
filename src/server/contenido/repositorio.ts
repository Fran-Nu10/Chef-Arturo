import 'server-only'

import { modoDemo } from '@/lib/supabase/env'
import {
  listarMediosDemo,
  seccionPorClaveDemo,
  todasLasSeccionesDemo,
} from '@/server/demo/consultas'

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
  if (modoDemo()) return todasLasSeccionesDemo()

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
  if (modoDemo()) return seccionPorClaveDemo(clave)

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
  if (modoDemo()) return listarMediosDemo()

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

