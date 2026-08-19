'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { clienteServidor } from '@/lib/supabase/servidor'
import { entornoPublico } from '@/lib/supabase/env'

const Credenciales = z.object({
  email: z.string().email('Ingresá un email válido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
})

export interface ResultadoAuth {
  error?: string
  ok?: string
}

/**
 * Ingreso al panel.
 *
 * Dos comprobaciones distintas y dos mensajes distintos: credenciales
 * incorrectas y cuenta sin acceso al panel. Si el usuario existe en `auth`
 * pero no es administrador activo, se cierra la sesión antes de responder para
 * no dejar una sesión válida colgando en el navegador.
 */
export async function ingresar(
  _previo: ResultadoAuth,
  datos: FormData,
): Promise<ResultadoAuth> {
  const analisis = Credenciales.safeParse({
    email: datos.get('email'),
    password: datos.get('password'),
  })
  if (!analisis.success) {
    return { error: analisis.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const { data, error } = await supabase.auth.signInWithPassword(analisis.data)

  if (error || !data.user) {
    // Mensaje deliberadamente igual para email inexistente y contraseña
    // equivocada: distinguirlos permitiría enumerar cuentas.
    return { error: 'Email o contraseña incorrectos.' }
  }

  const { data: admin } = await supabase
    .from('admin_users')
    .select('is_active')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!admin) {
    await supabase.auth.signOut()
    return { error: 'Esta cuenta no tiene acceso al panel.' }
  }
  if (!admin.is_active) {
    await supabase.auth.signOut()
    return { error: 'Tu cuenta está desactivada. Pedile al dueño que la reactive.' }
  }

  redirect('/admin')
}

export async function salir() {
  const supabase = await clienteServidor()
  if (supabase) await supabase.auth.signOut()
  redirect('/admin/login')
}

const Email = z.object({ email: z.string().email('Ingresá un email válido') })

/**
 * Recuperación de contraseña.
 *
 * La respuesta es siempre la misma exista o no la cuenta: lo contrario
 * convertiría el formulario en un enumerador de emails registrados.
 */
export async function recuperarContrasena(
  _previo: ResultadoAuth,
  datos: FormData,
): Promise<ResultadoAuth> {
  const analisis = Email.safeParse({ email: datos.get('email') })
  if (!analisis.success) {
    return { error: analisis.error.issues[0]?.message ?? 'Email inválido' }
  }

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  await supabase.auth.resetPasswordForEmail(analisis.data.email, {
    redirectTo: `${entornoPublico.siteUrl}/admin/recuperar`,
  })

  return {
    ok: 'Si esa dirección corresponde a una cuenta del panel, te llega un correo con el enlace.',
  }
}

const NuevaContrasena = z
  .object({
    password: z.string().min(10, 'Usá al menos 10 caracteres'),
    repetir: z.string(),
  })
  .refine((v) => v.password === v.repetir, {
    message: 'Las contraseñas no coinciden',
    path: ['repetir'],
  })

export async function cambiarContrasena(
  _previo: ResultadoAuth,
  datos: FormData,
): Promise<ResultadoAuth> {
  const analisis = NuevaContrasena.safeParse({
    password: datos.get('password'),
    repetir: datos.get('repetir'),
  })
  if (!analisis.success) {
    return { error: analisis.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const { error } = await supabase.auth.updateUser({
    password: analisis.data.password,
  })
  if (error) return { error: 'No se pudo cambiar la contraseña. Pedí un enlace nuevo.' }

  redirect('/admin')
}
