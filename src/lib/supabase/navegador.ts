'use client'

import { createBrowserClient } from '@supabase/ssr'
import { entornoPublico, hayBackend } from './env'
import type { Database } from './tipos'

/**
 * Cliente de Supabase para el navegador.
 *
 * Existe para una sola cosa: subir imágenes directo a Storage desde el panel,
 * sin pasar el archivo por una Server Action (que las limita a 1 MB de cuerpo).
 *
 * Usa la clave publicable y la sesión del administrador logueado: la subida
 * queda gobernada por las políticas RLS de `storage.objects` —sólo un
 * administrador activo puede escribir en el bucket `media`—. La service-role
 * key no existe en este módulo ni en ningún otro código que viaje al
 * navegador.
 */
let cliente: ReturnType<typeof createBrowserClient<Database>> | null = null

export function clienteNavegador() {
  if (!hayBackend()) return null
  cliente ??= createBrowserClient<Database>(
    entornoPublico.supabaseUrl,
    entornoPublico.supabaseKey,
  )
  return cliente
}
