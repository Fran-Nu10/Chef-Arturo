'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { NEGOCIO } from '@/content/datos'
import type { Producto } from '@/content/tipos'
import { Boton } from '@/components/ui/Boton'
import { IconoCerrar } from '@/components/ui/Iconos'
import { MediaPendiente } from '@/components/ui/MediaPendiente'
import { TagModalidad } from '@/components/ui/TagModalidad'
import type { EstadoAgregado } from '@/lib/agregar'

/** Selector de modalidad — radios nativos, una sola elección. */
function OpcionModalidad({
  titulo,
  detalle,
  seleccionada,
  onSelect,
  name,
}: {
  titulo: string
  detalle: string
  seleccionada: boolean
  onSelect: () => void
  name: string
}) {
  return (
    <label
      className={`box-border flex min-h-[44px] cursor-pointer items-center gap-3 border px-3.5 py-3 ${
        seleccionada ? 'border-verde bg-verde/[0.07]' : 'border-linea-fuerte'
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={seleccionada}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={`flex h-4 w-4 flex-none items-center justify-center rounded-full border-[1.5px] ${
          seleccionada ? 'border-verde' : 'border-linea-fuerte'
        }`}
      >
        {seleccionada && <span className="h-2 w-2 rounded-full bg-verde" />}
      </span>
      <span>
        <b className="text-[13.5px] font-semibold">{titulo}</b>
        <span className="block text-xs text-tinta-suave">{detalle}</span>
      </span>
    </label>
  )
}

export interface VistaRapidaProps {
  producto: Producto | undefined
  abierta: boolean
  onCerrar: () => void
  /** Estado del ciclo de agregado, compartido con el botón que abrió la vista. */
  estadoAgregado: EstadoAgregado
  aspectoAgregado: { etiqueta: string; clase: string; deshabilitado: boolean }
  onAgregar: () => void
  /** Modalidad elegida en el selector; por defecto sigue la del producto. */
  modalidadElegida?: 'directa' | 'encargo'
  onElegirModalidad?: (m: 'directa' | 'encargo') => void
}

/**
 * Vista rápida — bottom sheet en mobile, panel lateral de 480px en desktop.
 * Muestra la modalidad, no fuerza las tres dentro de una ficha idéntica y
 * deja visible el estado de conflicto de fecha como ejemplo.
 */
export function VistaRapida({
  producto,
  abierta,
  onCerrar,
  aspectoAgregado,
  onAgregar,
  modalidadElegida,
  onElegirModalidad,
}: VistaRapidaProps) {
  const reducido = useReducedMotion()
  const modalidad =
    modalidadElegida ?? (producto?.modalidad === 'encargo' ? 'encargo' : 'directa')

  return (
    <AnimatePresence>
      {abierta && producto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducido ? 0.15 : 0.25 }}
            onClick={onCerrar}
            className="fixed inset-0 z-90 bg-verde-profundo/45"
          />
          <motion.div
            role="dialog"
            aria-label={`Vista rápida — ${producto.nombre}`}
            initial={reducido ? { opacity: 0 } : { y: '100%' }}
            animate={reducido ? { opacity: 1 } : { y: 0 }}
            exit={reducido ? { opacity: 0 } : { y: '100%' }}
            transition={{
              duration: reducido ? 0.15 : 0.35,
              ease: [0.33, 1, 0.68, 1],
            }}
            className="fixed right-0 bottom-0 left-0 z-91 box-border flex max-h-[88svh] flex-col gap-4 overflow-y-auto border-t border-linea bg-papel px-5 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] lg:top-0 lg:left-auto lg:h-full lg:max-h-none lg:w-[480px] lg:border-t-0 lg:border-l lg:px-[30px] lg:py-[26px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.12em] text-caramelo-texto uppercase">
                Vista rápida
              </span>
              <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar vista rápida"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-linea text-tinta"
              >
                <IconoCerrar size={16} />
              </button>
            </div>

            <div className="flex items-start gap-4">
              <MediaPendiente
                etiqueta={producto.imagenPendiente}
                slot={`producto-${producto.slug}`}
                ratio="4/5"
                sizes="(max-width: 1023px) 130px, 420px"
                className="w-[130px] flex-none lg:w-full"
              />
              <div className="flex flex-col gap-1.5 pt-1">
                <TagModalidad
                  modalidad={producto.modalidad}
                  disponibilidad={producto.disponibilidad}
                  className="self-start"
                />
                <div className="font-display text-2xl leading-tight">
                  {producto.nombre}
                </div>
                <div className="text-sm font-semibold text-verde">{producto.precio}</div>
                <p className="m-0 text-xs leading-relaxed text-tinta-suave">
                  Contenido pendiente de validación.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <OpcionModalidad
                name={`modalidad-${producto.slug}`}
                titulo="Comprá ahora"
                detalle="Stock del día · Mercado Pago"
                seleccionada={modalidad === 'directa'}
                onSelect={() => onElegirModalidad?.('directa')}
              />
              <OpcionModalidad
                name={`modalidad-${producto.slug}`}
                titulo="Encargá para una fecha"
                detalle="Anticipación por confirmar · puede requerir seña"
                seleccionada={modalidad === 'encargo'}
                onSelect={() => onElegirModalidad?.('encargo')}
              />
              <p className="m-0 border border-dashed border-caramelo px-3 py-[9px] text-[11.5px] font-medium text-caramelo-texto">
                Ejemplo de estado: “No disponible para la fecha seleccionada — probá otra
                fecha”.
              </p>
            </div>

            <div className="mt-auto flex flex-col gap-2">
              <button
                type="button"
                onClick={onAgregar}
                disabled={aspectoAgregado.deshabilitado}
                className={`inline-flex min-h-[50px] items-center justify-center px-6 text-[15px] font-semibold tracking-[0.03em] transition-colors duration-300 ${aspectoAgregado.clase}`}
              >
                {aspectoAgregado.etiqueta}
              </button>
              <Boton
                variante="secundario"
                compacto
                onClick={() => {
                  window.location.href = NEGOCIO.whatsapp
                }}
              >
                Consultar por WhatsApp
              </Boton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
