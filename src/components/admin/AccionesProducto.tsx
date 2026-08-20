'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import {
  archivarProducto,
  cambiarVisibilidadProducto,
  duplicarProducto,
  restaurarProducto,
  type Resultado,
} from '@/server/catalogo/acciones'
import type { EstadoProducto } from '@/lib/supabase/tipos'

/**
 * Acciones rápidas de cada producto en la lista.
 *
 * «Editar» siempre a mano; el resto —ver en la tienda, duplicar, publicar u
 * ocultar, archivar— detrás de un menú, para que la fila no sea una botonera.
 * Archivar pide confirmación dentro del propio menú.
 */
export function AccionesProducto({
  id,
  slug,
  nombre,
  estado,
}: {
  id: string
  slug: string
  nombre: string
  estado: EstadoProducto
}) {
  const router = useRouter()
  const menu = useRef<HTMLDetailsElement>(null)
  const [resultado, setResultado] = useState<Resultado>({})
  const [confirmandoArchivo, setConfirmandoArchivo] = useState(false)
  const [pendiente, iniciar] = useTransition()

  function ejecutar(accion: () => Promise<Resultado>, alTerminar?: (r: Resultado) => void) {
    iniciar(async () => {
      const r = await accion()
      setResultado(r)
      if (r.ok && menu.current) menu.current.open = false
      setConfirmandoArchivo(false)
      alTerminar?.(r)
    })
  }

  const ITEM =
    'flex min-h-[44px] w-full items-center px-3 text-left text-[13px] font-medium text-tinta no-underline transition-colors hover:bg-verde/[0.06] disabled:opacity-50'

  return (
    <div className="relative flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <Link
          href={`/admin/productos/${id}`}
          className="inline-flex min-h-[44px] items-center border border-verde px-3.5 text-[12.5px] font-semibold text-verde no-underline hover:bg-verde/[0.07]"
        >
          Editar
        </Link>
        <details ref={menu} className="group">
          <summary
            aria-label={`Más acciones para ${nombre}`}
            className="flex min-h-[44px] min-w-[44px] cursor-pointer list-none items-center justify-center border border-linea-fuerte text-[16px] leading-none font-semibold text-tinta select-none group-open:border-verde group-open:text-verde [&::-webkit-details-marker]:hidden"
          >
            ⋯
          </summary>
          <div className="absolute top-[calc(100%+4px)] right-0 z-20 flex w-[210px] flex-col border border-linea-fuerte bg-papel py-1">
            {estado === 'active' && (
              <Link
                href={`/producto/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={ITEM}
              >
                Ver en la tienda ↗
              </Link>
            )}
            <button
              type="button"
              disabled={pendiente}
              onClick={() =>
                ejecutar(
                  () => duplicarProducto(id),
                  (r) => {
                    // La copia nace oculta: se abre para revisarla.
                    if (r.id) router.push(`/admin/productos/${r.id}`)
                  },
                )
              }
              className={ITEM}
            >
              Duplicar
            </button>
            {estado !== 'archived' && (
              <button
                type="button"
                disabled={pendiente}
                onClick={() => ejecutar(() => cambiarVisibilidadProducto(id, estado !== 'active'))}
                className={ITEM}
              >
                {estado === 'active' ? 'Ocultar de la tienda' : 'Publicar en la tienda'}
              </button>
            )}
            {estado === 'archived' ? (
              <button
                type="button"
                disabled={pendiente}
                onClick={() => ejecutar(() => restaurarProducto(id))}
                className={ITEM}
              >
                Restaurar
              </button>
            ) : confirmandoArchivo ? (
              <div className="flex items-center gap-1 border-t border-linea px-3 py-2">
                <span className="flex-1 text-[12px] text-alerta">¿Archivar?</span>
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() => ejecutar(() => archivarProducto(id))}
                  className="min-h-[36px] border border-alerta bg-alerta px-2.5 text-[12px] font-semibold text-papel"
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoArchivo(false)}
                  className="min-h-[36px] px-2 text-[12px] font-medium text-tinta-suave underline"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={pendiente}
                onClick={() => setConfirmandoArchivo(true)}
                className={`${ITEM} border-t border-linea text-tinta-suave`}
              >
                Archivar
              </button>
            )}
          </div>
        </details>
      </div>
      {resultado.error && (
        <p role="alert" className="m-0 max-w-[240px] text-right text-[11.5px] text-alerta">
          {resultado.error}
        </p>
      )}
    </div>
  )
}
