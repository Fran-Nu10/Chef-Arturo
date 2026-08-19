import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { entornoPublico, hayBackend } from '@/lib/supabase/env'

/**
 * Renovación de sesión.
 *
 * Los tokens de Supabase caducan; sin este paso, un Server Component podría
 * leer una sesión vencida. `getUser()` fuerza la validación contra el servidor
 * de auth y, si hace falta, refresca las cookies antes de que la petición
 * llegue a la página.
 *
 * No decide permisos: de eso se encarga el layout de `/admin`, del lado
 * servidor. Acá sólo se mantiene la sesión al día.
 */
export async function middleware(request: NextRequest) {
  // El layout de /admin necesita saber qué ruta se está sirviendo para no
  // envolver el login con el chasis protegido. Next no la expone a los Server
  // Components, así que se publica en una cabecera de la propia petición.
  const cabeceras = new Headers(request.headers)
  cabeceras.set('x-pathname', request.nextUrl.pathname)

  let respuesta = NextResponse.next({ request: { headers: cabeceras } })

  if (!hayBackend()) return respuesta

  const supabase = createServerClient(
    entornoPublico.supabaseUrl,
    entornoPublico.supabaseKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(nuevas) {
          for (const { name, value } of nuevas) {
            request.cookies.set(name, value)
          }
          respuesta = NextResponse.next({ request: { headers: cabeceras } })
          for (const { name, value, options } of nuevas) {
            respuesta.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // No quitar: es la llamada que dispara el refresco.
  await supabase.auth.getUser()

  return respuesta
}

export const config = {
  matcher: [
    // Todo menos estáticos e imágenes.
    '/((?!_next/static|_next/image|favicon.ico|fotos|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp4)$).*)',
  ],
}
