'use client'

import { createBrowserClient } from '@supabase/ssr'
import { entornoPublico, hayBackend } from './env'
import type { Database } from './tipos'

/**
 * Cliente de Supabase para el navegador.
 *
 * Sólo lleva la clave publicable: todo lo que pueda hacer está limitado por
 * RLS. Devuelve `null` en modo demo para que quien lo use tenga que decidir
 * explícitamente qué mostrar cuando no hay backend.
 */
export function clienteNavegador() {
  if (!hayBackend()) return null
  return createBrowserClient<Database>(
    entornoPublico.supabaseUrl,
    entornoPublico.supabaseKey,
  )
}
