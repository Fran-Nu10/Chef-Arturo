import 'server-only'

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { modoDemo } from '@/lib/supabase/env'

/**
 * Sesión del panel de demostración.
 *
 * No es una sesión de Supabase y no quiere parecerlo. Es una cookie firmada
 * que sólo sirve para recorrer el panel con datos de mentira mientras la base
 * real todavía no existe.
 *
 * Todas las lecturas pasan por `modoDemo()`: si alguien conserva la cookie de
 * una demostración y después se conecta Supabase, la cookie deja de valer sin
 * necesidad de borrarla. No hay un camino en el que una cookie de demo llegue
 * al backend real.
 */

const COOKIE = 'chef_arturo_demo'
const DURACION_SEGUNDOS = 2 * 60 * 60

/**
 * Clave de firma.
 *
 * `DEMO_ADMIN_SECRET` la fija si se quiere que la sesión sobreviva a un
 * reinicio del servidor o que valga en varias instancias. Sin ella se genera
 * una al azar, que es lo más seguro por defecto: al reiniciar, las sesiones de
 * demostración anteriores dejan de servir. No hay valor escrito en el
 * repositorio: sería una clave conocida por cualquiera que lea el código.
 *
 * Vive en el registro global de símbolos y no en una constante de módulo. El
 * motivo salió de probar contra un build de producción: Next empaqueta las
 * Server Actions aparte de las páginas, así que este archivo terminaba
 * cargado dos veces en el mismo proceso, con una clave distinta cada vez. La
 * cookie firmada al renderizar no validaba dentro de la acción, y cualquier
 * formulario del panel echaba al login. `Symbol.for` comparte el registro
 * entre todas las instancias del módulo dentro del proceso.
 */
const SIMBOLO_CLAVE = Symbol.for('chef-arturo.demo.clave-de-firma')

function clave(): string {
  if (process.env.DEMO_ADMIN_SECRET) return process.env.DEMO_ADMIN_SECRET

  const global = globalThis as typeof globalThis & { [SIMBOLO_CLAVE]?: string }
  global[SIMBOLO_CLAVE] ??= randomBytes(32).toString('hex')
  return global[SIMBOLO_CLAVE]
}

function firmar(carga: string): string {
  return createHmac('sha256', clave()).update(carga).digest('hex')
}

function firmaValida(carga: string, firma: string): boolean {
  const esperada = Buffer.from(firmar(carga), 'hex')
  const recibida = Buffer.from(firma, 'hex')
  if (esperada.length !== recibida.length) return false
  return timingSafeEqual(esperada, recibida)
}

export interface SesionDemo {
  email: string
  expiraEn: number
}

/**
 * Abre la sesión de demostración.
 *
 * El email se guarda sólo para mostrarlo en la barra lateral. La contraseña
 * no se guarda, no se compara con nada y no se registra en ningún lado: en
 * modo demo no hay contra qué compararla.
 */
export async function abrirSesionDemo(email: string): Promise<void> {
  if (!modoDemo()) return

  const expiraEn = Date.now() + DURACION_SEGUNDOS * 1000
  const carga = JSON.stringify({ email: email.slice(0, 120), expiraEn })
  const valor = `${Buffer.from(carga).toString('base64url')}.${firmar(carga)}`

  const almacen = await cookies()
  almacen.set(COOKIE, valor, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACION_SEGUNDOS,
  })
}

export async function cerrarSesionDemo(): Promise<void> {
  const almacen = await cookies()
  almacen.delete(COOKIE)
}

/** La sesión de demostración vigente, o `null`. */
export async function sesionDemo(): Promise<SesionDemo | null> {
  // Primera condición: sin modo demo la cookie no vale, exista o no.
  if (!modoDemo()) return null

  const almacen = await cookies()
  const crudo = almacen.get(COOKIE)?.value
  if (!crudo) return null

  const corte = crudo.lastIndexOf('.')
  if (corte < 1) return null

  const carga = Buffer.from(crudo.slice(0, corte), 'base64url').toString('utf8')
  const firma = crudo.slice(corte + 1)
  if (!/^[0-9a-f]+$/.test(firma) || !firmaValida(carga, firma)) return null

  let datos: SesionDemo
  try {
    datos = JSON.parse(carga) as SesionDemo
  } catch {
    return null
  }

  if (typeof datos.expiraEn !== 'number' || datos.expiraEn < Date.now()) return null
  if (typeof datos.email !== 'string' || datos.email.length === 0) return null

  return datos
}

/** Cuánto dura la sesión, para decirlo en pantalla. */
export const DURACION_DEMO_HORAS = DURACION_SEGUNDOS / 3600

/**
 * Pista pública de "hay sesión en este navegador".
 *
 * El pie de la tienda tiene que mostrar "Ir al panel" en lugar de "Acceso de
 * gestión" cuando hay sesión. Resolverlo del lado servidor obligaría al pie a
 * leer cookies, y eso volvería dinámico todo el storefront, que hoy se
 * prerenderiza entero.
 *
 * Por eso, además de la cookie de sesión —que sigue siendo `HttpOnly` y es la
 * única que autoriza algo—, se deja esta segunda cookie legible por JavaScript
 * con un único valor: `1`. No es un token, no autoriza nada y no se comprueba
 * en el servidor. Sólo dice "este navegador tiene una sesión abierta", que es
 * algo que quien usa el navegador ya sabe.
 */
export const COOKIE_PISTA = 'chef_arturo_panel'

export async function marcarSesionVisible(segundos = DURACION_SEGUNDOS): Promise<void> {
  const almacen = await cookies()
  almacen.set(COOKIE_PISTA, '1', {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: segundos,
  })
}

export async function borrarSesionVisible(): Promise<void> {
  const almacen = await cookies()
  almacen.delete(COOKIE_PISTA)
}
