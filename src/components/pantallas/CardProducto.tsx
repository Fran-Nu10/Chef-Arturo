'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Producto } from '@/content/tipos'
import { MediaPendiente } from '@/components/ui/MediaPendiente'
import { TagModalidad } from '@/components/ui/TagModalidad'
import { VistaRapida } from '@/components/ui/VistaRapida'
import { useAgregar } from '@/lib/agregar'

/**
 * Card de catálogo. Estados: reposo · hover (foto 1.04 + subrayado caramelo) ·
 * agotado (opacidad .55 + etiqueta alerta). La vista rápida se abre sin salir
 * del listado.
 */
export function CardProducto({
  producto,
  destacado = false,
  alto = 'h-[150px]',
}: {
  producto: Producto
  /** El primero del catálogo mobile ocupa las dos columnas. */
  destacado?: boolean
  alto?: string
}) {
  const [vistaRapida, setVistaRapida] = useState(false)
  const [modalidad, setModalidad] = useState<'directa' | 'encargo'>(
    producto.modalidad === 'encargo' ? 'encargo' : 'directa',
  )
  const { activar, aspecto, estado } = useAgregar(producto)

  const agotado = producto.disponibilidad === 'agotado'
  const noDisponible = producto.disponibilidad === 'no-disponible'

  return (
    <>
      <div
        className={`group flex flex-col gap-2 ${destacado ? 'col-span-2 lg:col-span-1' : ''} ${
          agotado || noDisponible ? 'opacity-55' : ''
        }`}
      >
        <Link
          href={`/producto/${producto.slug}`}
          className="flex flex-col gap-2 no-underline"
        >
          <div className="overflow-hidden">
            <MediaPendiente
              etiqueta={producto.imagenPendiente}
              slot={`producto-${producto.slug}`}
              forma="arco"
              apagado={noDisponible}
              className={`${destacado ? 'h-[230px] lg:h-[250px]' : alto} transition-transform duration-300 ease-editorial group-hover:scale-[1.04]`}
            />
          </div>
          <div className="flex items-start justify-between gap-2.5">
            <div>
              <div className="font-display text-[17px] leading-tight text-tinta group-hover:underline group-hover:decoration-caramelo group-hover:underline-offset-4">
                {producto.nombre}
              </div>
              {agotado || noDisponible ? (
                <div className="mt-0.5 text-[10px] font-semibold tracking-[0.05em] text-alerta uppercase">
                  {agotado ? 'Agotado hoy' : 'No disponible'}
                </div>
              ) : (
                <div className="mt-0.5 text-[11.5px] font-medium text-tinta-suave">
                  {producto.precio}
                </div>
              )}
            </div>
            {!agotado && !noDisponible && (
              <TagModalidad
                modalidad={producto.modalidad}
                disponibilidad={producto.disponibilidad}
                corto
                className="text-[10px]"
              />
            )}
          </div>
        </Link>

        {!agotado && !noDisponible && (
          <button
            type="button"
            onClick={() => setVistaRapida(true)}
            className="inline-flex min-h-[44px] items-center self-start text-[11.5px] font-semibold text-caramelo-texto underline underline-offset-[3px]"
          >
            Vista rápida
          </button>
        )}
      </div>

      <VistaRapida
        producto={producto}
        abierta={vistaRapida}
        onCerrar={() => setVistaRapida(false)}
        estadoAgregado={estado}
        aspectoAgregado={aspecto}
        onAgregar={activar}
        modalidadElegida={modalidad}
        onElegirModalidad={setModalidad}
      />
    </>
  )
}
