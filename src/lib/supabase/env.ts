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

/**
 * ¿Está activo el panel de demostración?
 *
 * Sirve para recorrer el panel en una presentación mientras Supabase todavía
 * no está conectado. Entra por una puerta que salta la autenticación, así que
 * las dos condiciones son igual de importantes:
 *
 *   1. `DEMO_ADMIN_BYPASS` vale exactamente `true`. Sin prefijo público: no
 *      viaja al navegador y no se puede activar desde el cliente.
 *   2. **No hay backend configurado.** Si existen las variables de Supabase,
 *      el bypass queda desactivado aunque la variable siga en `true`. Es la
 *      condición que impide que quede abierto por olvido en producción: en
 *      cuanto se conecta la base real, la puerta se cierra sola.
 *
 * De ahí se desprende algo que conviene tener presente: cuando el modo demo
 * está activo **no existe backend al que acceder**. La cookie de demostración
 * no puede alcanzar datos reales porque no hay datos reales.
 */
export function modoDemo(): boolean {
  return process.env.DEMO_ADMIN_BYPASS === 'true' && !hayBackend()
}

/**
 * ¿Se pidió el modo demo pero quedó anulado por tener backend?
 *
 * Se usa para avisarlo en el panel en lugar de dejar al operador preguntándose
 * por qué la variable no hace nada.
 */
export function demoAnuladoPorBackend(): boolean {
  return process.env.DEMO_ADMIN_BYPASS === 'true' && hayBackend()
}

/**
 * ¿El panel tiene con qué trabajar?
 *
 * Verdadero con Supabase conectado **o** en demostración. Es lo que preguntan
 * las páginas del panel antes de mostrar el aviso de "falta configurar": con
 * `hayBackend()` a secas, la demostración se quedaba en ese aviso en lugar de
 * cargar los fixtures.
 */
export function panelOperativo(): boolean {
  return hayBackend() || modoDemo()
}
