'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type MouseEvent } from 'react'
import { Marca } from '@/components/layout/Header'
import { salir } from '@/server/acciones-auth'
import type { SesionAdmin } from '@/server/autorizacion'
import { esRutaActiva, NAVEGACION } from '@/components/admin/navegacion'

/**
 * Navegación cliente del panel.
 *
 * El layout de Next se conserva entre rutas, por eso la sección activa no
 * puede depender de una cabecera calculada una sola vez en el servidor.
 * usePathname() mantiene el estado sincronizado y el destino pendiente da
 * feedback desde el primer clic, antes de que llegue el nuevo Server Component.
 */
export function BarraLateral({ sesion }: { sesion: SesionAdmin }) {
  const rutaActual = usePathname()
  const [navegacion, setNavegacion] = useState<{
    destino: string
    origen: string
  } | null>(null)

  // Al cambiar el pathname, la navegación anterior deja de estar pendiente sin
  // necesitar un efecto ni un render adicional.
  const destinoPendiente =
    navegacion?.origen === rutaActual ? navegacion.destino : null
  const rutaVisual = destinoPendiente ?? rutaActual
  const visibles = NAVEGACION.filter((item) => !item.soloOwner || sesion.rol === 'owner')

  function iniciarNavegacion(
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    // Abrir en otra pestaña no debe alterar el estado de esta.
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return
    }

    if (href === rutaActual || destinoPendiente === href) {
      event.preventDefault()
      return
    }

    setNavegacion({ destino: href, origen: rutaActual })
  }

  return (
    <nav
      aria-label="Secciones del panel"
      aria-busy={Boolean(destinoPendiente)}
      className="flex gap-1 overflow-x-auto border-b border-linea bg-papel-alt px-3 py-2 lg:h-screen lg:w-[220px] lg:flex-col lg:gap-0 lg:overflow-visible lg:border-r lg:border-b-0 lg:px-0 lg:py-0"
    >
      <div className="hidden border-b border-linea px-5 py-5 lg:block">
        <Link href="/admin" className="no-underline">
          <Marca tamano={22} />
        </Link>
        <p className="mt-2 mb-0 text-[10px] font-semibold tracking-[0.16em] text-caramelo-texto uppercase">
          Panel
        </p>
      </div>

      <ul className="m-0 flex list-none gap-1 p-0 lg:flex-1 lg:flex-col lg:gap-0 lg:py-2">
        {visibles.map((item) => {
          const activo = esRutaActiva(rutaVisual, item)
          const cargando = destinoPendiente === item.href

          return (
            <li key={item.href} className="flex-none">
              <Link
                href={item.href}
                prefetch
                aria-current={activo && !cargando ? 'page' : undefined}
                onClick={(event) => iniciarNavegacion(event, item.href)}
                className={`flex min-h-[44px] items-center gap-2 px-4 text-[13.5px] no-underline transition-colors lg:border-l-[3px] ${
                  activo
                    ? 'bg-verde/[0.07] font-semibold text-verde lg:border-l-caramelo'
                    : 'font-medium text-tinta hover:bg-verde/[0.04] lg:border-l-transparent'
                }`}
              >
                <span>{item.etiqueta}</span>
                {cargando && (
                  <>
                    <span
                      aria-hidden="true"
                      className="ml-auto size-1.5 rounded-full bg-caramelo animate-pulse"
                    />
                    <span className="sr-only">Cargando</span>
                  </>
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="hidden border-t border-linea px-4 py-4 lg:block">
        <p className="m-0 truncate text-[12px] font-medium text-tinta">
          {sesion.nombre ?? sesion.email}
        </p>
        <p className="m-0 text-[11px] text-tinta-suave">
          {sesion.esDemo ? 'Demostración' : sesion.rol === 'owner' ? 'Dueño' : 'Equipo'}
        </p>
        <form action={salir}>
          <button
            type="submit"
            className="mt-2 min-h-[44px] text-[12.5px] font-medium text-caramelo-texto underline underline-offset-[3px]"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </nav>
  )
}
