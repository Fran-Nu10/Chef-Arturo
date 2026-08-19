/**
 * Lectura tipada del entorno.
 *
 * La aplicación tiene que compilar y arrancar sin credenciales: el storefront
 * sigue sirviendo los fixtures y el panel avisa que falta configurar el
 * backend. Por eso nada de esto lanza al importarse.
 */

/** Variables que pueden viajar al navegador. */
export const entornoPublico = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const

/** ¿Hay backend configurado? Decide entre modo real y modo demo. */
export function hayBackend(): boolean {
  return Boolean(entornoPublico.supabaseUrl && entornoPublico.supabaseKey)
}

/**
 * Qué falta para salir del modo demo. Lo muestra el panel; nunca revela
 * valores, sólo nombres de variables.
 */
export function faltantesDeBackend(): string[] {
  const faltan: string[] = []
  if (!entornoPublico.supabaseUrl) faltan.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!entornoPublico.supabaseKey) faltan.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  return faltan
}
