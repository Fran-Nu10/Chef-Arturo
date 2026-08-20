'use server'

import { z } from 'zod'
import { clienteServidor } from '@/lib/supabase/servidor'
import { exigirAdmin } from '@/server/autorizacion'
import { rechazoDemo } from '@/server/demo/guardia'
import { esRutaDeSubida, TAMANO_MAXIMO_IMAGEN } from '@/lib/imagenes'
import { registrarImagenDeContenido } from './imagenes'
import type { Resultado } from '@/server/resultados'

const Entrada = z.object({
  path: z.string().max(200),
  alt: z.string().trim().max(300).default(''),
  width: z.number().int().positive().max(100_000).nullable().default(null),
  height: z.number().int().positive().max(100_000).nullable().default(null),
  bytes: z.number().int().positive().max(TAMANO_MAXIMO_IMAGEN).nullable().default(null),
})

/**
 * Registra una imagen del editor de contenido, recién subida a Storage.
 *
 * El editor guarda su borrador como JSON en el cliente, así que la imagen se
 * registra al elegirla —no al guardar—: el identificador tiene que existir
 * para poder viajar dentro del borrador. Nace `is_temporary` y se confirma
 * cuando el borrador se guarda. El dueño nunca ve ese identificador.
 */
export async function registrarImagenDeContenidoAccion(entrada: {
  path: string
  alt: string
  width: number | null
  height: number | null
  bytes: number | null
}): Promise<Resultado> {
  await exigirAdmin()

  const analisis = Entrada.safeParse(entrada)
  if (!analisis.success || !esRutaDeSubida(analisis.data.path, 'contenido')) {
    return { error: 'La imagen enviada no es válida.' }
  }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const registro = await registrarImagenDeContenido(
    supabase,
    {
      path: analisis.data.path,
      width: analisis.data.width,
      height: analisis.data.height,
      bytes: analisis.data.bytes,
    },
    analisis.data.alt,
  )
  if ('error' in registro) return { error: registro.error }

  return { ok: true, id: registro.id }
}
