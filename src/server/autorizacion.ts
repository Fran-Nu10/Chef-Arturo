import 'server-only'

import { redirect } from 'next/navigation'
import { clienteServidor } from '@/lib/supabase/servidor'
import type { RolAdmin } from '@/lib/supabase/tipos'

export interface SesionAdmin {
  userId: string
  email: string
  rol: RolAdmin
  nombre: string | null
}

/**
 * Quién está operando el panel, o `null`.
 *
 * El rol se lee de `admin_users` en cada petición. No se toma del JWT ni de la
 * metadata del usuario: eso lo puede editar el propio usuario y no sirve para
 * autorizar. La consulta pasa por RLS igual que cualquier otra.
 */
export async function sesionAdmin(): Promise<SesionAdmin | null> {
  const supabase = await clienteServidor()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: admin } = await supabase
    .from('admin_users')
    .select('role, is_active, display_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!admin || !admin.is_active) return null

  return {
    userId: user.id,
    email: user.email ?? '',
    rol: admin.role,
    nombre: admin.display_name,
  }
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
export async function estadoDeAcceso(): Promise<
  'sin-backend' | 'sin-sesion' | 'sin-permiso' | 'ok'
> {
  const supabase = await clienteServidor()
  if (!supabase) return 'sin-backend'

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 'sin-sesion'

  const { data: admin } = await supabase
    .from('admin_users')
    .select('is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (!admin || !admin.is_active) return 'sin-permiso'
  return 'ok'
}
