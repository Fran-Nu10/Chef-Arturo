import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { clienteServidor } from '@/lib/supabase/servidor'
import { modoDemo } from '@/lib/supabase/env'
import { sesionDemo } from '@/server/demo/sesion'
import type { RolAdmin } from '@/lib/supabase/tipos'

export interface SesionAdmin {
  userId: string
  email: string
  rol: RolAdmin
  nombre: string | null
  /**
   * Sesión de demostración, no de Supabase. El panel la usa para mostrar el
   * banner y para rechazar cualquier escritura.
   */
  esDemo: boolean
}

/** Por qué no hay sesión utilizable. Lo necesita el panel para dar el mensaje justo. */
export type EstadoAcceso = 'sin-backend' | 'sin-sesion' | 'sin-permiso' | 'ok'

interface Resolucion {
  estado: EstadoAcceso
  sesion: SesionAdmin | null
}

/**
 * Resuelve la identidad una sola vez por petición.
 *
 * `getClaims()` verifica la firma y expiración del JWT. Con las claves asimétricas
 * actuales usa WebCrypto y una JWKS cacheada, evitando una ida al servidor de
 * Auth en cada clic. `cache()` de React colapsa las consultas repetidas del
 * layout y la página dentro de la misma petición. El rol sigue consultándose
 * en `admin_users` y protegido por RLS; nunca se confía en metadata editable.
 */
const resolver = cache(async (): Promise<Resolucion> => {
  // Modo demostración. `modoDemo()` ya exige que NO haya backend configurado,
  // así que esta rama y la real nunca conviven: en cuanto se conectan las
  // variables de Supabase, la cookie de demostración deja de valer sola.
  if (modoDemo()) {
    const demo = await sesionDemo()
    if (!demo) return { estado: 'sin-sesion', sesion: null }
    return {
      estado: 'ok',
      sesion: {
        userId: 'demo',
        email: demo.email,
        // Rol de dueño para que se pueda recorrer todo el panel, incluida la
        // configuración. No da acceso a nada: no hay base detrás.
        rol: 'owner',
        nombre: 'Demostración',
        esDemo: true,
      },
    }
  }

  const supabase = await clienteServidor()
  if (!supabase) return { estado: 'sin-backend', sesion: null }

  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  const userId = typeof claims?.sub === 'string' ? claims.sub : null
  if (error || !userId) return { estado: 'sin-sesion', sesion: null }

  // El rol se lee de `admin_users` en cada petición. No se toma del JWT ni de
  // la metadata del usuario: eso lo puede editar el propio usuario y no sirve
  // para autorizar. La consulta pasa por RLS igual que cualquier otra.
  const { data: admin } = await supabase
    .from('admin_users')
    .select('role, is_active, display_name')
    .eq('id', userId)
    .maybeSingle()

  if (!admin || !admin.is_active) return { estado: 'sin-permiso', sesion: null }

  return {
    estado: 'ok',
    sesion: {
      userId,
      email: typeof claims.email === 'string' ? claims.email : '',
      rol: admin.role,
      nombre: admin.display_name,
      esDemo: false,
    },
  }
})

/** Quién está operando el panel, o `null`. */
export async function sesionAdmin(): Promise<SesionAdmin | null> {
  return (await resolver()).sesion
}

/**
 * Exige sesión administrativa. Redirige del lado servidor si no la hay, así
 * el HTML protegido nunca llega a enviarse.
 */
export async function exigirAdmin(): Promise<SesionAdmin> {
  const sesion = await sesionAdmin()
  if (!sesion) redirect('/admin/login')
  return sesion
}

/** Exige rol de dueño para la configuración crítica. */
export async function exigirOwner(): Promise<SesionAdmin> {
  const sesion = await exigirAdmin()
  if (sesion.rol !== 'owner') redirect('/admin?sin_permiso=1')
  return sesion
}

/** Distingue "no configurado" de "no autorizado" para dar el mensaje correcto. */
export async function estadoDeAcceso(): Promise<EstadoAcceso> {
  return (await resolver()).estado
}
