'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CATEGORIAS, NEGOCIO, PRODUCTOS } from '@/content/datos'
import type { CategoriaSlug, Modalidad } from '@/content/tipos'
import { BotonEnlace } from '@/components/ui/Boton'
import { IconoBuscar } from '@/components/ui/Iconos'
import { CardProducto } from '@/components/pantallas/CardProducto'
import { EstadoCentrado } from '@/components/pantallas/Estructura'

const MODALIDADES: { valor: Modalidad; etiqueta: string }[] = [
  { valor: 'directa', etiqueta: 'Compra directa' },
  { valor: 'encargo', etiqueta: 'Por encargo' },
  { valor: 'consultar', etiqueta: 'Con cotización' },
]

/**
 * Pantallas 1–3 · Catálogo general, catálogo filtrado por categoría y búsqueda
 * sin resultados. La cantidad de productos figura como pendiente: no se afirma
 * un número que todavía no está validado.
 */
export function Catalogo({ categoria }: { categoria?: CategoriaSlug }) {
  const [busqueda, setBusqueda] = useState('')
  const [modalidades, setModalidades] = useState<Modalidad[]>([])

  const activa = categoria ? CATEGORIAS.find((c) => c.slug === categoria) : undefined

  const resultados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return PRODUCTOS.filter((p) => {
      if (categoria && p.categoria !== categoria) return false
      if (modalidades.length > 0 && !modalidades.includes(p.modalidad)) return false
      if (termino && !p.nombre.toLowerCase().includes(termino)) return false
      return true
    })
  }, [busqueda, categoria, modalidades])

  const alternarModalidad = (m: Modalidad) =>
    setModalidades((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    )

  const buscador = (
    <label className="flex min-h-[46px] items-center gap-2.5 border border-linea-fuerte px-3.5 focus-within:border-verde">
      <IconoBuscar size={16} className="flex-none text-tinta-suave" />
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar en la vitrina"
        aria-label="Buscar en la vitrina"
        className="min-h-[44px] w-full bg-transparent text-[13.5px] text-tinta placeholder:text-tinta-tenue focus:outline-none"
      />
    </label>
  )

  const sinResultados = resultados.length === 0

  return (
    <div className="lg:grid lg:grid-cols-[280px_1fr]">
      {/* Panel de filtros — lateral en desktop, cintas horizontales en mobile. */}
      <aside className="flex flex-col gap-[22px] px-4 pt-[18px] pb-1.5 lg:border-r lg:border-linea lg:px-8 lg:py-9">
        {activa ? (
          <div className="-mx-4 flex items-end justify-between bg-verde px-4 py-[22px] text-papel lg:mx-0 lg:flex-col lg:items-start lg:gap-1 lg:bg-transparent lg:p-0 lg:text-tinta">
            <div>
              <div className="tnum text-[10.5px] font-semibold tracking-[0.14em] text-caramelo-claro lg:text-caramelo-texto">
                CATEGORÍA {activa.numero}
              </div>
              <h1 className="m-0 mt-1 font-display text-[30px] font-normal">
                {activa.nombre}
              </h1>
            </div>
            <span className="text-[11.5px] text-crema lg:text-tinta-suave">
              Cantidad pendiente
            </span>
          </div>
        ) : (
          <h1 className="m-0 font-display text-[32px] font-normal">Catálogo</h1>
        )}

        {buscador}

        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-0 lg:overflow-visible">
          <FiltroCategoria href="/catalogo" activa={!categoria}>
            Todo
          </FiltroCategoria>
          {CATEGORIAS.map((c) => (
            <FiltroCategoria
              key={c.slug}
              href={`/catalogo/${c.slug}`}
              activa={categoria === c.slug}
            >
              {c.nombre}
            </FiltroCategoria>
          ))}
        </nav>

        <div className="hidden flex-col gap-2.5 lg:flex">
          <div className="text-[11px] font-semibold tracking-[0.1em] text-caramelo-texto">
            MODALIDAD
          </div>
          {MODALIDADES.map((m) => {
            const marcada = modalidades.includes(m.valor)
            return (
              <label
                key={m.valor}
                className={`flex min-h-[44px] cursor-pointer items-center gap-2.5 text-[13px] font-medium ${
                  marcada ? 'text-tinta' : 'text-tinta-suave'
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcada}
                  onChange={() => alternarModalidad(m.valor)}
                  className="sr-only"
                />
                <span
                  className={`flex h-[15px] w-[15px] flex-none items-center justify-center border-[1.5px] ${
                    marcada ? 'border-verde' : 'border-linea-fuerte'
                  }`}
                >
                  {marcada && <span className="h-[7px] w-[7px] bg-verde" />}
                </span>
                {m.etiqueta}
              </label>
            )
          })}
        </div>
      </aside>

      <div className="flex flex-col gap-6 px-4 pt-3 pb-6 lg:px-12 lg:py-9">
        {!sinResultados && (
          <div className="hidden items-baseline justify-between lg:flex">
            <span className="text-[13px] text-tinta-suave">
              Cantidad de productos pendiente
            </span>
            <span className="text-[13px] font-medium text-caramelo-texto underline underline-offset-[3px]">
              Ordenar: sugeridos
            </span>
          </div>
        )}

        {sinResultados ? (
          <EstadoCentrado
            icono={<span className="font-display text-[44px]">?</span>}
            titulo="No encontramos resultados"
            texto="Probá con otra palabra o mirá las categorías de la vitrina."
          >
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIAS.map((c) => (
                <Link
                  key={c.slug}
                  href={`/catalogo/${c.slug}`}
                  className="flex min-h-[44px] items-center border border-verde px-3.5 text-[12.5px] font-medium text-verde no-underline"
                >
                  {c.nombre}
                </Link>
              ))}
            </div>
            <BotonEnlace href={NEGOCIO.whatsapp} variante="secundario" compacto>
              ¿No lo ves? Consultá por WhatsApp
            </BotonEnlace>
          </EstadoCentrado>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3 lg:gap-6">
            {resultados.map((producto, i) => (
              <CardProducto
                key={producto.slug}
                producto={producto}
                destacado={!categoria && !busqueda && i === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FiltroCategoria({
  href,
  activa,
  children,
}: {
  href: string
  activa: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={activa ? 'page' : undefined}
      className={`flex min-h-[44px] flex-none items-center px-3.5 text-[12.5px] no-underline lg:min-h-[48px] lg:border-b lg:border-linea lg:px-0 lg:pl-3 lg:text-sm ${
        activa
          ? 'bg-verde font-semibold text-papel lg:border-l-[3px] lg:border-l-caramelo lg:bg-transparent lg:text-verde'
          : 'border border-linea-fuerte font-medium text-tinta lg:border-0 lg:border-b lg:pl-[15px]'
      }`}
    >
      {children}
    </Link>
  )
}
