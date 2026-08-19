'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { PRODUCTOS, SELECCION_HOME } from '@/content/datos'
import { Boton, EnlaceEditorial } from '@/components/ui/Boton'
import { MediaPendiente } from '@/components/ui/MediaPendiente'
import { EncabezadoSeccion } from '@/components/ui/Reveal'
import { TagModalidad } from '@/components/ui/TagModalidad'
import { VistaRapida } from '@/components/ui/VistaRapida'
import { useAgregar } from '@/lib/agregar'

const SELECCION = SELECCION_HOME.map(
  (slug) => PRODUCTOS.find((p) => p.slug === slug)!,
).filter(Boolean)

/**
 * 03 · SELECCIÓN DE LA CASA — módulo editorial de compra, no una grilla uniforme.
 *
 * Desktop: producto protagonista sticky a la izquierda y lista a la derecha; el
 * cambio de protagonista es un crossfade de 240ms.
 * Mobile: protagonista arriba, lista debajo, vista rápida en bottom sheet.
 * Estados representados: reposo, seleccionado, agotado, precio pendiente,
 * anticipación por confirmar, agregando y agregado.
 */
export function SeleccionDeLaCasa() {
  const [indice, setIndice] = useState(0)
  const [vistaRapida, setVistaRapida] = useState(false)
  const [modalidad, setModalidad] = useState<'directa' | 'encargo'>('directa')
  const reducido = useReducedMotion()

  const protagonista = SELECCION[indice]
  const { activar, aspecto, estado } = useAgregar(protagonista)

  const elegir = (i: number) => {
    if (i === indice) return
    setIndice(i)
    setModalidad(SELECCION[i].modalidad === 'encargo' ? 'encargo' : 'directa')
  }

  return (
    <section
      aria-label="Selección de la casa"
      className="border-t border-linea px-[clamp(16px,3.4vw,48px)] pt-[clamp(40px,5vw,72px)] pb-[clamp(56px,7vw,96px)]"
    >
      <EncabezadoSeccion
        numero="03"
        kicker="SELECCIÓN DE LA CASA"
        titulo="Del mostrador de hoy"
        className="mb-[30px]"
      />

      <div className="flex flex-col gap-7 lg:grid lg:grid-cols-[430px_1fr] lg:items-start lg:gap-16">
        <div className="flex flex-col gap-3.5 lg:sticky lg:top-24">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={protagonista.slug}
              initial={reducido ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reducido ? undefined : { opacity: 0 }}
              transition={{ duration: reducido ? 0 : 0.24 }}
            >
              <MediaPendiente
                etiqueta={protagonista.imagenPendiente}
                slot={`producto-${protagonista.slug}`}
                sizes="(max-width: 1023px) 100vw, 460px"
                arco
                ratio="4/5"
                className="w-full"
                apagado={protagonista.disponibilidad === 'agotado'}
              />
            </motion.div>
          </AnimatePresence>

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-2xl leading-tight">
                {protagonista.nombre}
              </div>
              <div className="mt-1 text-[13px] font-medium text-tinta-suave">
                {protagonista.precio}
              </div>
            </div>
            <TagModalidad
              modalidad={protagonista.modalidad}
              disponibilidad={protagonista.disponibilidad}
            />
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={activar}
              disabled={aspecto.deshabilitado}
              aria-live="polite"
              className={`inline-flex min-h-[48px] flex-1 items-center justify-center px-6 text-sm font-semibold tracking-[0.03em] transition-colors duration-300 ${aspecto.clase}`}
            >
              {aspecto.etiqueta}
            </button>
            <Boton
              variante="secundario"
              compacto
              className="px-[18px] text-[13.5px]"
              onClick={() => setVistaRapida(true)}
            >
              Vista rápida
            </Boton>
          </div>
        </div>

        <div className="flex flex-col">
          {SELECCION.map((producto, i) => {
            const seleccionado = i === indice
            const agotado = producto.disponibilidad === 'agotado'
            return (
              <button
                key={producto.slug}
                type="button"
                onClick={() => elegir(i)}
                aria-pressed={seleccionado}
                className={`grid grid-cols-[86px_1fr_auto] items-center gap-4 border-b border-linea border-l-[3px] px-3 py-4 text-left transition-colors duration-300 ${
                  seleccionado
                    ? 'border-l-caramelo bg-verde/[0.06]'
                    : 'border-l-transparent'
                } ${agotado ? 'opacity-55' : ''}`}
              >
                <MediaPendiente
                  etiqueta={producto.imagenPendiente}
                  slot={`producto-${producto.slug}`}
                  sizes="86px"
                  ratio="1/1"
                  className="w-full text-[9.5px]"
                />
                <div className="flex flex-col gap-[3px]">
                  <span className="font-display text-[19px] leading-tight">
                    {producto.nombre}
                  </span>
                  <span className="text-xs font-medium text-tinta-suave">
                    {producto.precio}
                  </span>
                  {producto.nota && (
                    <span
                      className={`text-[11px] font-semibold tracking-[0.05em] uppercase ${
                        agotado ? 'text-alerta' : 'text-caramelo-texto'
                      }`}
                    >
                      {producto.nota}
                    </span>
                  )}
                </div>
                <TagModalidad
                  modalidad={producto.modalidad}
                  disponibilidad={producto.disponibilidad}
                />
              </button>
            )
          })}
          <div className="pt-[18px]">
            <EnlaceEditorial href="/catalogo">Ver todo el catálogo →</EnlaceEditorial>
          </div>
        </div>
      </div>

      <VistaRapida
        producto={protagonista}
        abierta={vistaRapida}
        onCerrar={() => setVistaRapida(false)}
        estadoAgregado={estado}
        aspectoAgregado={aspecto}
        onAgregar={activar}
        modalidadElegida={modalidad}
        onElegirModalidad={setModalidad}
      />
    </section>
  )
}
