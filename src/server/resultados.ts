import 'server-only'

import type { z } from 'zod'

/**
 * Resultado de una acción del panel.
 *
 * Estaba definido en `catalogo/acciones.ts` y lo importaban módulos que no
 * tienen nada que ver con el catálogo. Vive acá junto con las dos utilidades
 * que lo acompañan.
 */
export interface Resultado {
  /** `true` o, directamente, el mensaje de éxito que debe ver el operador. */
  ok?: boolean | string
  error?: string
  errores?: Record<string, string>
  id?: string
}

export function erroresDeZod(error: z.ZodError): Record<string, string> {
  const mapa: Record<string, string> = {}
  for (const issue of error.issues) {
    const campo = issue.path.join('.') || 'general'
    mapa[campo] ??= issue.message
  }
  return mapa
}

/** Traduce los errores de Postgres a algo que el operador entienda. */
export function mensajeDeBase(error: { code?: string; message: string }): string {
  if (error.code === '23505') return 'Ya existe otro registro con ese valor único.'
  if (error.code === '23503') return 'Hay un registro relacionado que lo impide.'
  if (error.code === '23514') return 'Los datos no cumplen una regla de la base.'
  if (error.code === '42501') return 'No tenés permiso para esta operación.'
  if (error.code === '22P02') return 'Uno de los valores tiene un formato inválido.'
  return error.message
}

interface RespuestaSupabase {
  data: unknown[] | null
  error: { code?: string; message: string } | null
}

/**
 * Confirma que una escritura realmente tocó una fila.
 *
 * Es la corrección más importante de la auditoría, y hay que explicar por qué.
 *
 * Con RLS activo, un `UPDATE` o un `DELETE` que ninguna política autoriza **no
 * devuelve error**: afecta cero filas y termina bien. (El `INSERT` sí falla,
 * por el `with check`.) El código anterior sólo miraba `error`, así que
 * devolvía `{ ok: true }` y el panel decía "Cambios guardados" cuando no se
 * había guardado nada. Lo mismo pasaba con un id inexistente.
 *
 * La única forma de distinguir un caso del otro es pedir las filas devueltas
 * y contarlas. Por eso cada escritura ahora lleva `.select(...)` y pasa por
 * acá: cero filas es un error, y se dice.
 *
 * Uso:
 *
 *     return confirmarEscritura(
 *       supabase.from('products').update(fila).eq('id', id).select('id'),
 *       'El producto no existe o no tenés permiso para modificarlo.',
 *     )
 */
export async function confirmarEscritura(
  consulta: PromiseLike<RespuestaSupabase>,
  mensajeSiNoAlcanzo: string,
): Promise<Resultado> {
  const { data, error } = await consulta

  if (error) return { error: mensajeDeBase(error) }
  if (!data || data.length === 0) return { error: mensajeSiNoAlcanzo }

  const fila = data[0]
  const id =
    fila && typeof fila === 'object' && 'id' in fila ? String((fila as { id: unknown }).id) : undefined

  return { ok: true, id }
}
