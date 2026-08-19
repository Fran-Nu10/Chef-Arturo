import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { entornoPublico, hayBackend } from './env'
import type { Database } from './tipos'

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 *
 * Usa la clave publicable y la sesión del usuario: sigue sujeto a RLS. Es el
 * cliente por defecto de todo el panel — que un administrador esté logueado no
 * significa saltarse las políticas, sólo que las políticas lo reconocen.
 *
 * `server-only` corta el build si alguien lo importa desde un componente
 * cliente por error.
 */
export async function clienteServidor() {
  if (!hayBackend()) return null
  const almacen = await cookies()

  return createServerClient<Database>(
    entornoPublico.supabaseUrl,
    entornoPublico.supabaseKey,
    {
      cookies: {
        getAll() {
          return almacen.getAll()
        },
        setAll(nuevas) {
          try {
            for (const { name, value, options } of nuevas) {
              almacen.set(name, value, options)
            }
          } catch {
            // Un Server Component no puede escribir cookies. La renovación de
            // sesión la hace el middleware; acá se ignora sin romper el render.
          }
        },
      },
    },
  )
}

/**
 * Cliente con la clave de servicio. **Saltea RLS.**
 *
 * Reservado para lo que ninguna política puede autorizar desde fuera: el
 * webhook de pagos y el alta del primer administrador. Nunca se expone a una
 * ruta que dependa de datos del usuario sin validarlos antes.
 */
export function clienteServicio() {
  const clave = process.env.SUPABASE_SECRET_KEY
  if (!entornoPublico.supabaseUrl || !clave) return null

  return createServerClient<Database>(entornoPublico.supabaseUrl, clave, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
