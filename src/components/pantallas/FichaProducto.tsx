'use client'

import { useState } from 'react'
import { NEGOCIO, categoriaPorSlug } from '@/content/datos'
import type { Producto } from '@/content/tipos'
import { Boton, BotonEnlace } from '@/components/ui/Boton'
import { IconoAlerta, IconoCalendario } from '@/components/ui/Iconos'
import { MediaPendiente } from '@/components/ui/MediaPendiente'
import { TagModalidad } from '@/components/ui/TagModalidad'
import { useAgregar } from '@/lib/agregar'

/** Contador de cantidad — sólo tiene sentido en compra directa. */
function Cantidad({
  valor,
  onCambiar,
}: {
  valor: number
  onCambiar: (n: number) => void
}) {
  return (
    <div className="flex items-center border border-linea-fuerte">
      <button
        type="button"
        onClick={() => onCambiar(Math.max(1, valor - 1))}
        aria-label="Quitar una unidad"
        className="h-11 w-11 text-lg font-semibold"
      >
        −
      </button>
      <span className="tnum w-9 text-center text-[15px] font-semibold" aria-live="polite">
        {valor}
      </span>
      <button
        type="button"
        onClick={() => onCambiar(valor + 1)}
        aria-label="Agregar una unidad"
        className="h-11 w-11 text-lg font-semibold"
      >
        +
      </button>
    </div>
  )
}

function Detalles() {
  return (
    <div className="border-t border-linea">
      {['Retiro y entrega', 'Conservación'].map((titulo, i) => (
        <details
          key={titulo}
          className={`acordeon ${i > 0 ? 'border-t border-linea' : ''}`}
        >
          <summary className="flex min-h-[52px] cursor-pointer items-center justify-between text-sm font-semibold">
            {titulo}
            <span
              aria-hidden="true"
              className="acordeon-signo font-display text-xl text-caramelo transition-transform duration-[250ms]"
            >
              +
            </span>
          </summary>
          <p className="mt-0 mb-4 text-[13px] leading-relaxed text-tinta-suave">
            Contenido pendiente de validación.
          </p>
        </details>
      ))}
    </div>
  )
}

/**
 * Pantallas 4–7 · Ficha de producto.
 *
 * Las tres modalidades no se fuerzan dentro de una ficha idéntica: la compra
 * directa lleva cantidad y carrito; el encargo, elección de fecha; el producto
 * que requiere fecha muestra además el estado de conflicto; y el no disponible
 * se convierte en un aviso.
 */
export function FichaProducto({ producto }: { producto: Producto }) {
  const [cantidad, setCantidad] = useState(1)
  const [fechaElegida, setFechaElegida] = useState('')
  const { activar, aspecto } = useAgregar(producto)
  const categoria = categoriaPorSlug(producto.categoria)

  // ─── Pantalla 7 · Producto no disponible ─────────────────────────────────
  if (producto.disponibilidad === 'no-disponible') {
    return (
      <div className="flex flex-col gap-4 px-4 pt-5 pb-7">
        <div className="relative w-full max-w-[340px] self-center">
          <MediaPendiente
            etiqueta={producto.imagenPendiente}
            slot={`producto-${producto.slug}`}
            ratio="4/5"
            apagado
            sizes="(max-width: 1023px) 100vw, 460px"
            className="w-full"
          />
          <div className="pointer-events-none absolute inset-0 rounded-borde bg-papel/45" />
          <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[4deg] bg-tinta px-4 py-2 text-xs font-bold tracking-[0.1em] text-papel">
            NO DISPONIBLE
          </span>
        </div>
        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="m-0 font-display text-2xl font-normal">{producto.nombre}</h1>
          <p className="m-0 text-[13px] text-tinta-suave">{producto.nota}</p>
        </div>
        <Boton>Avisame cuando vuelva</Boton>
        <BotonEnlace
          href={`/catalogo/${producto.categoria}`}
          variante="secundario"
          compacto
        >
          Ver productos similares
        </BotonEnlace>
      </div>
    )
  }

  // ─── Pantalla 6 · Producto que requiere fecha ────────────────────────────
  if (producto.disponibilidad === 'requiere-fecha') {
    const enConflicto = fechaElegida === ''
    return (
      <div className="flex flex-col gap-4 px-4 pt-5 pb-7">
        <div className="grid grid-cols-[130px_1fr] items-start gap-4">
          <MediaPendiente
            etiqueta={producto.imagenPendiente}
            slot={`producto-${producto.slug}`}
            ratio="4/5"
            sizes="130px"
            className="w-full"
          />
          <div className="flex flex-col gap-1.5">
            <TagModalidad
              modalidad={producto.modalidad}
              disponibilidad={producto.disponibilidad}
              className="self-start text-[10px]"
            />
            <h1 className="m-0 font-display text-[23px] leading-tight font-normal">
              {producto.nombre}
            </h1>
            <div className="text-[13.5px] font-semibold text-verde">
              {producto.precio}
            </div>
          </div>
        </div>

        {enConflicto ? (
          <div
            role="status"
            className="flex flex-col gap-2.5 border border-alerta bg-alerta-fondo p-4"
          >
            <div className="flex items-start gap-2.5">
              <IconoAlerta size={18} className="mt-px flex-none text-alerta" />
              <p className="m-0 text-[13px] leading-relaxed font-medium text-alerta">
                No disponible para la fecha seleccionada.
              </p>
            </div>
            <p className="m-0 text-xs leading-relaxed text-tinta-suave">
              Elegí otra fecha o consultanos la disponibilidad por WhatsApp.
            </p>
            <label className="flex min-h-[46px] items-center gap-2.5 border border-alerta bg-papel px-3">
              <IconoCalendario size={16} className="flex-none text-alerta" />
              <input
                type="date"
                value={fechaElegida}
                onChange={(e) => setFechaElegida(e.target.value)}
                aria-label="Fecha seleccionada — cambiar"
                className="min-h-[44px] w-full bg-transparent text-[13.5px] font-medium focus:outline-none"
              />
            </label>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 border border-linea bg-papel-alt p-4">
            <div className="text-xs font-semibold tracking-[0.06em] text-caramelo-texto uppercase">
              Fecha elegida
            </div>
            <label className="flex min-h-[46px] items-center gap-2.5 border border-verde bg-papel px-3">
              <IconoCalendario size={16} className="flex-none text-verde" />
              <input
                type="date"
                value={fechaElegida}
                onChange={(e) => setFechaElegida(e.target.value)}
                aria-label="Fecha de retiro o entrega"
                className="min-h-[44px] w-full bg-transparent text-[13.5px] font-medium focus:outline-none"
              />
            </label>
            <p className="m-0 text-xs leading-relaxed text-caramelo-texto">
              Disponibilidad y anticipación por confirmar antes de coordinar el pedido.
            </p>
          </div>
        )}

        <Boton
          variante={enConflicto ? 'deshabilitado' : 'primario'}
          disabled={enConflicto}
          onClick={activar}
        >
          Encargar para esta fecha
        </Boton>
        <BotonEnlace href={NEGOCIO.whatsapp} variante="secundario" compacto>
          Consultar disponibilidad por WhatsApp
        </BotonEnlace>
      </div>
    )
  }

  // ─── Pantalla 5 · Ficha por encargo ──────────────────────────────────────
  if (producto.modalidad === 'encargo') {
    return (
      <div className="flex flex-col gap-4 px-4 pt-5 pb-7">
        <div className="grid grid-cols-[130px_1fr] items-start gap-4">
          <MediaPendiente
            etiqueta={producto.imagenPendiente}
            slot={`producto-${producto.slug}`}
            ratio="4/5"
            sizes="130px"
            className="w-full"
          />
          <div className="flex flex-col gap-1.5">
            <TagModalidad modalidad="encargo" className="self-start text-[10px]" />
            <h1 className="m-0 font-display text-[23px] leading-tight font-normal">
              {producto.nombre}
            </h1>
            <div className="text-[13.5px] font-semibold text-verde">
              {producto.precio}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border border-linea bg-papel-alt p-4">
          <div className="text-xs font-semibold tracking-[0.06em] text-caramelo-texto uppercase">
            Elegí tu fecha
          </div>
          <label className="flex min-h-[46px] items-center gap-2.5 border border-verde bg-papel px-3">
            <IconoCalendario size={16} className="flex-none text-verde" />
            <input
              type="date"
              value={fechaElegida}
              onChange={(e) => setFechaElegida(e.target.value)}
              aria-label="Fecha de retiro o entrega"
              className="min-h-[44px] w-full bg-transparent text-[13.5px] font-medium focus:outline-none"
            />
          </label>
          <p className="m-0 text-xs leading-relaxed text-caramelo-texto">
            Anticipación por confirmar · puede requerir seña. Te confirmamos
            disponibilidad antes del pago.
          </p>
        </div>

        <Boton onClick={activar}>Encargar para esta fecha</Boton>
        <BotonEnlace href={NEGOCIO.whatsapp} variante="secundario" compacto>
          Consultar por WhatsApp
        </BotonEnlace>
        <Detalles />
      </div>
    )
  }

  // ─── Pantalla 4 · Ficha de compra directa ────────────────────────────────
  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-7">
      <MediaPendiente
        etiqueta={producto.imagenPendiente}
        slot={`producto-${producto.slug}`}
        ratio="4/5"
        sizes="(max-width: 1023px) 100vw, 600px"
        className="w-full"
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="m-0 font-display text-[26px] leading-tight font-normal">
            {producto.nombre}
          </h1>
          <div className="mt-1.5 text-sm font-semibold text-verde">{producto.precio}</div>
        </div>
        <TagModalidad
          modalidad={producto.modalidad}
          disponibilidad={producto.disponibilidad}
          className="text-[10px]"
        />
      </div>
      <p className="m-0 text-[13px] leading-relaxed text-tinta-suave">
        Contenido pendiente de validación.
      </p>

      <div className="flex items-center gap-3.5">
        <Cantidad valor={cantidad} onCambiar={setCantidad} />
        <span className="text-[11.5px] text-tinta-suave">
          Stock del día · Mercado Pago
        </span>
      </div>

      <button
        type="button"
        onClick={activar}
        disabled={aspecto.deshabilitado}
        aria-live="polite"
        className={`inline-flex min-h-[50px] items-center justify-center px-6 text-[15px] font-semibold tracking-[0.03em] transition-colors duration-300 ${aspecto.clase}`}
      >
        {aspecto.etiqueta}
      </button>
      <BotonEnlace href={NEGOCIO.whatsapp} variante="secundario" compacto>
        Consultar por WhatsApp
      </BotonEnlace>

      <Detalles />
      {categoria && (
        <p className="m-0 text-[11.5px] text-tinta-tenue">
          Categoría: {categoria.nombre}
        </p>
      )}
    </div>
  )
}
