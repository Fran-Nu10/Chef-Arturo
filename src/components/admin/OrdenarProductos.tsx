'use client'

import { useRef, useState, useTransition } from 'react'
import { reordenarProductos, type Resultado } from '@/server/catalogo/acciones'
import { Feedback } from './Piezas'
import { Pildora } from './Tabla'

/**
 * Orden visual de los productos, sin números.
 *
 * Agrupado por categoría. Se arrastra con mouse o con el dedo desde el
 * manubrio (eventos pointer: sin dependencias nuevas) y, como alternativa
 * accesible, cada producto tiene botones «Subir» y «Bajar». Nada se guarda
 * hasta tocar «Guardar orden».
 */

export interface ItemDeOrden {
  id: string
  name: string
  imagenUrl: string | null
  status: 'draft' | 'active'
}

export interface GrupoDeOrden {
  id: string
  nombre: string
  productos: ItemDeOrden[]
}

export function OrdenarProductos({ grupos }: { grupos: GrupoDeOrden[] }) {
  const [listas, setListas] = useState<Record<string, ItemDeOrden[]>>(() =>
    Object.fromEntries(grupos.map((g) => [g.id, g.productos])),
  )
  const listasRef = useRef(listas)
  listasRef.current = listas

  const [arrastrando, setArrastrando] = useState<string | null>(null)
  const [sucio, setSucio] = useState(false)
  const [estado, setEstado] = useState<Resultado>({})
  const [guardando, iniciarGuardado] = useTransition()
  const contenedores = useRef<Record<string, HTMLUListElement | null>>({})

  function mover(grupoId: string, desde: number, hacia: number) {
    const lista = listasRef.current[grupoId]
    if (!lista || hacia < 0 || hacia >= lista.length) return
    const copia = [...lista]
    const [item] = copia.splice(desde, 1)
    copia.splice(hacia, 0, item)
    setListas({ ...listasRef.current, [grupoId]: copia })
    setSucio(true)
    setEstado({})
  }

  /** Reubica el producto arrastrado según la posición vertical del puntero. */
  function arrastrar(grupoId: string, itemId: string, clientY: number) {
    const contenedor = contenedores.current[grupoId]
    const lista = listasRef.current[grupoId]
    if (!contenedor || !lista) return

    let destino = 0
    for (const nodo of contenedor.querySelectorAll<HTMLElement>('[data-orden-item]')) {
      if (nodo.dataset.ordenItem === itemId) continue
      const caja = nodo.getBoundingClientRect()
      if (clientY > caja.top + caja.height / 2) destino++
    }

    const desde = lista.findIndex((p) => p.id === itemId)
    if (desde === -1 || destino === desde) return
    mover(grupoId, desde, destino)
  }

  function guardar() {
    iniciarGuardado(async () => {
      const ordenes: { id: string; position: number }[] = []
      let posicion = 0
      for (const g of grupos) {
        for (const p of listasRef.current[g.id] ?? []) {
          ordenes.push({ id: p.id, position: posicion++ })
        }
      }
      const resultado = await reordenarProductos(ordenes)
      setEstado(resultado)
      if (resultado.ok) setSucio(false)
    })
  }

  const visibles = grupos.filter((g) => (listas[g.id] ?? []).length > 0)

  return (
    <div className="flex flex-col gap-6">
      {visibles.map((grupo) => (
        <section key={grupo.id} aria-label={grupo.nombre} className="flex flex-col gap-2">
          <h2 className="m-0 font-display text-lg font-normal">{grupo.nombre}</h2>
          <ul
            ref={(nodo) => {
              contenedores.current[grupo.id] = nodo
            }}
            className="m-0 flex list-none flex-col gap-1.5 p-0"
          >
            {(listas[grupo.id] ?? []).map((producto, indice, lista) => (
              <li
                key={producto.id}
                data-orden-item={producto.id}
                className={`flex items-center gap-3 border bg-papel-alt px-2.5 py-2 ${
                  arrastrando === producto.id ? 'border-verde bg-verde/[0.05]' : 'border-linea'
                }`}
              >
                {/* El teclado usa «Subir/Bajar»; el manubrio queda fuera del tabulado. */}
                <button
                  type="button"
                  aria-label={`Arrastrar ${producto.name}`}
                  tabIndex={-1}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.currentTarget.setPointerCapture(e.pointerId)
                    setArrastrando(producto.id)
                  }}
                  onPointerMove={(e) => {
                    if (arrastrando === producto.id) arrastrar(grupo.id, producto.id, e.clientY)
                  }}
                  onPointerUp={() => setArrastrando(null)}
                  onPointerCancel={() => setArrastrando(null)}
                  className="flex min-h-[44px] min-w-[36px] cursor-grab touch-none items-center justify-center text-[15px] text-tinta-suave select-none active:cursor-grabbing"
                >
                  ⠿
                </button>

                <span className="relative block h-12 w-10 flex-none overflow-hidden border border-linea bg-crema">
                  {producto.imagenUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element -- miniatura pequeña */
                    <img
                      src={producto.imagenUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </span>

                <span className="flex flex-1 flex-wrap items-center gap-2 text-[13.5px] font-medium">
                  {producto.name}
                  {producto.status === 'draft' && <Pildora texto="Oculto" tono="caramelo" />}
                </span>

                <span className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`Subir ${producto.name}`}
                    disabled={indice === 0}
                    onClick={() => mover(grupo.id, indice, indice - 1)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-linea-fuerte text-[13px] disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label={`Bajar ${producto.name}`}
                    disabled={indice === lista.length - 1}
                    onClick={() => mover(grupo.id, indice, indice + 1)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-linea-fuerte text-[13px] disabled:opacity-30"
                  >
                    ▼
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="sticky bottom-0 z-20 flex flex-col gap-2 border-t border-linea bg-papel py-3">
        {sucio && (
          <p role="status" className="m-0 border border-dashed border-caramelo px-3 py-2 text-[12.5px] text-caramelo-texto">
            Tenés cambios de orden sin guardar.
          </p>
        )}
        <Feedback estado={estado} />
        <div>
          <button
            type="button"
            onClick={guardar}
            disabled={!sucio || guardando}
            className="inline-flex min-h-[44px] items-center border border-verde bg-verde px-5 text-[13.5px] font-semibold text-papel disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Guardar orden'}
          </button>
        </div>
      </div>
    </div>
  )
}
