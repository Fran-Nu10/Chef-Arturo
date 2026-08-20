'use client'

import Link from 'next/link'
import { useRef, useState, useTransition } from 'react'
import { reordenarCategorias, type Resultado } from '@/server/catalogo/acciones'
import { Feedback } from './Piezas'
import { Pildora } from './Tabla'

/**
 * Lista compacta de categorías.
 *
 * Cada fila muestra lo que importa —miniatura, nombre, cuántos productos
 * tiene, si está visible— y se reordena arrastrando o con Subir/Bajar. El
 * orden se guarda recién al tocar «Guardar orden»; editar es otra pantalla.
 */

export interface CategoriaDeLista {
  id: string
  nombre: string
  slug: string
  imagenUrl: string | null
  cantidadProductos: number
  visible: boolean
}

export function ListaCategorias({ categorias }: { categorias: CategoriaDeLista[] }) {
  const [lista, setLista] = useState(categorias)
  const listaRef = useRef(lista)
  listaRef.current = lista

  const [arrastrando, setArrastrando] = useState<string | null>(null)
  const [sucio, setSucio] = useState(false)
  const [estado, setEstado] = useState<Resultado>({})
  const [guardando, iniciarGuardado] = useTransition()
  const contenedor = useRef<HTMLUListElement>(null)

  function mover(desde: number, hacia: number) {
    const actual = listaRef.current
    if (hacia < 0 || hacia >= actual.length) return
    const copia = [...actual]
    const [item] = copia.splice(desde, 1)
    copia.splice(hacia, 0, item)
    setLista(copia)
    setSucio(true)
    setEstado({})
  }

  function arrastrar(itemId: string, clientY: number) {
    if (!contenedor.current) return
    let destino = 0
    for (const nodo of contenedor.current.querySelectorAll<HTMLElement>('[data-orden-item]')) {
      if (nodo.dataset.ordenItem === itemId) continue
      const caja = nodo.getBoundingClientRect()
      if (clientY > caja.top + caja.height / 2) destino++
    }
    const desde = listaRef.current.findIndex((c) => c.id === itemId)
    if (desde === -1 || destino === desde) return
    mover(desde, destino)
  }

  function guardar() {
    iniciarGuardado(async () => {
      const resultado = await reordenarCategorias(
        listaRef.current.map((c, indice) => ({ id: c.id, position: indice })),
      )
      setEstado(resultado)
      if (resultado.ok) setSucio(false)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <ul ref={contenedor} className="m-0 flex list-none flex-col gap-1.5 p-0">
        {lista.map((categoria, indice) => (
          <li
            key={categoria.id}
            data-orden-item={categoria.id}
            className={`flex flex-wrap items-center gap-3 border bg-papel-alt px-2.5 py-2.5 ${
              arrastrando === categoria.id ? 'border-verde bg-verde/[0.05]' : 'border-linea'
            }`}
          >
            {/* El teclado usa «Subir/Bajar»; el manubrio queda fuera del tabulado. */}
            <button
              type="button"
              aria-label={`Arrastrar ${categoria.nombre}`}
              tabIndex={-1}
              onPointerDown={(e) => {
                e.preventDefault()
                e.currentTarget.setPointerCapture(e.pointerId)
                setArrastrando(categoria.id)
              }}
              onPointerMove={(e) => {
                if (arrastrando === categoria.id) arrastrar(categoria.id, e.clientY)
              }}
              onPointerUp={() => setArrastrando(null)}
              onPointerCancel={() => setArrastrando(null)}
              className="flex min-h-[44px] min-w-[36px] cursor-grab touch-none items-center justify-center text-[15px] text-tinta-suave select-none active:cursor-grabbing"
            >
              ⠿
            </button>

            <span className="relative block h-12 w-12 flex-none overflow-hidden border border-linea bg-crema">
              {categoria.imagenUrl && (
                /* eslint-disable-next-line @next/next/no-img-element -- miniatura pequeña */
                <img
                  src={categoria.imagenUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
            </span>

            <span className="flex min-w-[140px] flex-1 flex-col gap-0.5">
              <span className="text-[14px] font-medium">{categoria.nombre}</span>
              <span className="text-[12px] text-tinta-suave">
                {categoria.cantidadProductos === 1
                  ? '1 producto'
                  : `${categoria.cantidadProductos} productos`}
              </span>
            </span>

            <Pildora
              texto={categoria.visible ? 'Visible' : 'Oculta'}
              tono={categoria.visible ? 'verde' : 'caramelo'}
            />

            <span className="flex items-center gap-1.5">
              <span className="flex gap-1">
                <button
                  type="button"
                  aria-label={`Subir ${categoria.nombre}`}
                  disabled={indice === 0}
                  onClick={() => mover(indice, indice - 1)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-linea-fuerte text-[13px] disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label={`Bajar ${categoria.nombre}`}
                  disabled={indice === lista.length - 1}
                  onClick={() => mover(indice, indice + 1)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-linea-fuerte text-[13px] disabled:opacity-30"
                >
                  ▼
                </button>
              </span>
              {categoria.visible && (
                <Link
                  href={`/catalogo/${categoria.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden min-h-[44px] items-center px-2 text-[12.5px] font-medium text-tinta-suave underline underline-offset-[3px] sm:inline-flex"
                >
                  Ver en la tienda
                </Link>
              )}
              <Link
                href={`/admin/categorias/${categoria.id}`}
                className="inline-flex min-h-[44px] items-center border border-verde px-3.5 text-[12.5px] font-semibold text-verde no-underline hover:bg-verde/[0.07]"
              >
                Editar
              </Link>
            </span>
          </li>
        ))}
      </ul>

      {sucio && (
        <div className="sticky bottom-0 z-20 flex flex-col gap-2 border-t border-linea bg-papel py-3">
          <p role="status" className="m-0 border border-dashed border-caramelo px-3 py-2 text-[12.5px] text-caramelo-texto">
            Tenés cambios de orden sin guardar.
          </p>
          <Feedback estado={estado} />
          <div>
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="inline-flex min-h-[44px] items-center border border-verde bg-verde px-5 text-[13.5px] font-semibold text-papel disabled:opacity-60"
            >
              {guardando ? 'Guardando…' : 'Guardar orden'}
            </button>
          </div>
        </div>
      )}
      {!sucio && <Feedback estado={estado} />}
    </div>
  )
}
