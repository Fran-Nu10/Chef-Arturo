import 'server-only'

import { modoDemo } from '@/lib/supabase/env'
import type { Resultado } from '@/server/resultados'

export const MENSAJE_DEMO =
  'Modo demostración: este cambio no se guarda. Conectá Supabase para operar de verdad.'

/**
 * Corta cualquier escritura mientras el panel esté en demostración.
 *
 * Va **después** de validar y **antes** de tocar la base. Ese orden es a
 * propósito: durante una presentación se pueden mostrar los mensajes de
 * validación de cada campo, y recién cuando el formulario está bien aparece el
 * aviso de que no se guarda. Un corte al principio de la acción haría que
 * todos los formularios respondieran lo mismo sin importar lo que se escriba.
 *
 * En rigor es un segundo cerrojo: en modo demo `clienteServidor()` ya devuelve
 * `null` porque no hay backend, así que ninguna escritura llegaría a ningún
 * lado. Existe para que el mensaje diga la verdad —"esto es una demostración"—
 * en lugar de "el backend no está configurado", que es cierto pero no ayuda.
 */
export function rechazoDemo(): Resultado | null {
  return modoDemo() ? { error: MENSAJE_DEMO } : null
}
