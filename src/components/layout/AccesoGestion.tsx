'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

/**
 * Enlace al panel, en el pie de la tienda.
 *
 * Es para quien atiende el negocio, no para quien compra: por eso dice
 * "Acceso de gestión" y no "Iniciar sesión", va en el pie y no en el header,
 * y tiene el peso tipográfico del resto de la leyenda.
 *
 * El estado de sesión se lee después de montar, desde una cookie pública que
 * sólo vale `1` y no autoriza nada —la de sesión es `HttpOnly` y no se toca—.
 * Resolverlo en el servidor obligaría al pie a leer cookies y volvería
 * dinámico todo el storefront.
 *
 * Es un `<Link>` a secas. Se probó envolver la navegación en `useTransition`
 * para poder mostrar "Abriendo…" en el mismo toque, y fue peor: `/admin`
 * responde con un redirect del servidor, y empujarlo desde una transición
 * dejaba la navegación colgada treinta segundos. La espera se resolvió donde
 * estaba el problema —el layout raíz ya no bloquea las rutas del panel con la
 * consulta del catálogo— en vez de disfrazarla.
 */
export function AccesoGestion({ oscuro }: { oscuro: boolean }) {
  const [conSesion, setConSesion] = useState(false)

  useEffect(() => {
    setConSesion(
      document.cookie.split('; ').some((c) => c.startsWith('chef_arturo_panel=1')),
    )
  }, [])

  return (
    <Link
      href="/admin"
      prefetch={false}
      className={`inline-flex min-h-[44px] items-center underline decoration-dotted underline-offset-[3px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
        oscuro
          ? 'text-crema/75 hover:text-papel focus-visible:outline-papel'
          : 'text-tinta-suave hover:text-verde focus-visible:outline-verde'
      }`}
    >
      {conSesion ? 'Ir al panel' : 'Acceso de gestión'}
    </Link>
  )
}
