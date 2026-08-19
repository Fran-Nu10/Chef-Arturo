'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { NEGOCIO, OCASION_OPCIONES } from '@/content/datos'
import { Boton } from '@/components/ui/Boton'
import { MediaPendiente } from '@/components/ui/MediaPendiente'
import { Reveal } from '@/components/ui/Reveal'

interface Ocasion {
  tipo: string | null
  personas: string | null
  fecha: string
  preferencia: string | null
  entrega: string | null
  observaciones: string
}

const VACIA: Ocasion = {
  tipo: null,
  personas: null,
  fecha: '',
  preferencia: null,
  entrega: null,
  observaciones: '',
}

function Campo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
      <legend className="mb-2.5 p-0 text-xs font-semibold tracking-[0.08em] text-caramelo-claro uppercase">
        {titulo}
      </legend>
      {children}
    </fieldset>
  )
}

/** Selección táctil: cada chip es un radio nativo de 44px de alto mínimo. */
function Chips({
  name,
  opciones,
  valor,
  onElegir,
}: {
  name: string
  opciones: readonly string[]
  valor: string | null
  onElegir: (v: string | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((opcion) => {
        const elegida = valor === opcion
        return (
          <label
            key={opcion}
            className={`inline-flex min-h-[44px] cursor-pointer items-center border px-4 text-[13px] font-medium transition-colors duration-200 ${
              elegida
                ? 'border-papel bg-papel text-verde'
                : 'border-papel/40 bg-papel/[0.06] text-papel hover:bg-papel/15'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opcion}
              checked={elegida}
              onChange={() => onElegir(elegida ? null : opcion)}
              onClick={() => elegida && onElegir(null)}
              className="sr-only"
            />
            {opcion}
          </label>
        )
      })}
    </div>
  )
}

/**
 * Envoltura de un paso. Vive fuera del componente para que escribir en un campo
 * no la remonte y le robe el foco al input.
 */
function Paso({ animado, children }: { animado: boolean; children: ReactNode }) {
  if (!animado) return <div className="flex flex-col gap-[22px]">{children}</div>
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28, ease: [0.33, 1, 0.68, 1] }}
      className="flex flex-col gap-[22px]"
    >
      {children}
    </motion.div>
  )
}

const CAMPO_TEXTO =
  'border border-papel/40 bg-papel/[0.08] px-3 text-sm font-medium text-papel placeholder:text-crema/60 [color-scheme:dark]'

/**
 * 05 · ARMÁ TU OCASIÓN — composición editorial, no un formulario administrativo.
 *
 * No es una calculadora ni recomienda cantidades: reúne los datos y arma un
 * resumen legible, aclarando que la disponibilidad se confirma después.
 * Sin JavaScript los tres pasos quedan apilados como un formulario único —
 * ese es el HTML que se sirve, y el stepper se activa al hidratar.
 */
export function ArmaTuOcasion() {
  const [ocasion, setOcasion] = useState<Ocasion>(VACIA)
  const [paso, setPaso] = useState(1)
  const [stepper, setStepper] = useState(false)
  const reducido = useReducedMotion()

  useEffect(() => setStepper(true), [])

  const set = <K extends keyof Ocasion>(clave: K, valor: Ocasion[K]) =>
    setOcasion((prev) => ({ ...prev, [clave]: valor }))

  const resumen = [
    { k: 'Ocasión', v: ocasion.tipo ?? '—' },
    { k: 'Personas', v: ocasion.personas ?? '—' },
    { k: 'Fecha deseada', v: ocasion.fecha || '—' },
    { k: 'Preferencia', v: ocasion.preferencia ?? '—' },
    { k: 'Retiro o entrega', v: ocasion.entrega ?? '—' },
  ]

  return (
    <section
      aria-label="Armá tu ocasión"
      className="relative z-2 bg-verde px-[clamp(16px,3.4vw,48px)] py-[clamp(56px,7vw,96px)] text-papel"
    >
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:gap-[72px]">
        <Reveal className="flex flex-col gap-3.5">
          <div className="text-[11px] font-semibold tracking-[0.16em] text-caramelo-claro">
            05 — PARA REUNIONES Y EVENTOS
          </div>
          <h2 className="m-0 font-display text-titulo font-normal">Armá tu ocasión</h2>
          <p className="m-0 max-w-[380px] text-[14.5px] leading-relaxed text-crema">
            Contanos qué estás organizando y armamos una propuesta. La disponibilidad y la
            anticipación se confirman antes de coordinar el pedido.
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`h-[3px] flex-1 transition-colors duration-300 ${
                  !stepper || paso >= n ? 'bg-caramelo-claro' : 'bg-papel/25'
                }`}
              />
            ))}
          </div>
          <div className="text-xs font-medium text-caramelo-claro">
            {stepper ? (
              <>
                Paso <span className="tnum">{paso}</span> de{' '}
                <span className="tnum">3</span>
              </>
            ) : (
              'Los tres pasos, en una sola vista'
            )}
          </div>
          {/*
            La fotografía acompaña al copy, no se mete detrás del formulario:
            los campos y los chips conservan su contraste completo.
          */}
          <MediaPendiente
            slot="home-arma-ocasion"
            etiqueta="Imagen temporal — lunch para eventos"
            forma="arco"
            sizes="(max-width: 1023px) 100vw, 380px"
            className="mt-2 h-[clamp(220px,26vw,300px)] w-full max-w-[380px] border-papel/30 bg-papel/[0.06]"
          />
        </Reveal>

        <form
          className="flex flex-col gap-[22px] border border-papel/30 bg-verde-profundo/35 p-[clamp(20px,2.4vw,32px)]"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Sin JavaScript: los tres pasos apilados como un formulario único. */}
          {!stepper ? (
            <>
              <Paso animado={false}>
                <Campo titulo="Tipo de ocasión">
                  <Chips
                    name="ocasion-tipo"
                    opciones={OCASION_OPCIONES.tipo}
                    valor={ocasion.tipo}
                    onElegir={(v) => set('tipo', v)}
                  />
                </Campo>
                <Campo titulo="Cantidad aproximada de personas">
                  <Chips
                    name="ocasion-personas"
                    opciones={OCASION_OPCIONES.personas}
                    valor={ocasion.personas}
                    onElegir={(v) => set('personas', v)}
                  />
                </Campo>
              </Paso>
              <Paso animado={false}>
                <Campo titulo="Fecha deseada">
                  <input
                    type="date"
                    value={ocasion.fecha}
                    onChange={(e) => set('fecha', e.target.value)}
                    className={`min-h-[46px] max-w-[240px] ${CAMPO_TEXTO}`}
                  />
                  <p className="m-0 text-[11.5px] text-caramelo-claro">
                    Anticipación por confirmar según el pedido.
                  </p>
                </Campo>
                <Campo titulo="Preferencia general">
                  <Chips
                    name="ocasion-preferencia"
                    opciones={OCASION_OPCIONES.preferencia}
                    valor={ocasion.preferencia}
                    onElegir={(v) => set('preferencia', v)}
                  />
                </Campo>
                <Campo titulo="Retiro o entrega">
                  <Chips
                    name="ocasion-entrega"
                    opciones={OCASION_OPCIONES.entrega}
                    valor={ocasion.entrega}
                    onElegir={(v) => set('entrega', v)}
                  />
                </Campo>
              </Paso>
              <Paso animado={false}>
                <Campo titulo="Observaciones">
                  <textarea
                    rows={3}
                    value={ocasion.observaciones}
                    onChange={(e) => set('observaciones', e.target.value)}
                    placeholder="Lo que quieras contarnos sobre tu ocasión"
                    className={`resize-y py-3 ${CAMPO_TEXTO}`}
                  />
                </Campo>

                <div className="flex flex-col gap-2 border-t border-papel/25 pt-[18px]">
                  <div className="font-display text-[22px]">Tu resumen</div>
                  <dl className="m-0 flex flex-col">
                    {resumen.map((fila) => (
                      <div
                        key={fila.k}
                        className="flex justify-between gap-4 border-b border-papel/15 py-1.5 text-[13px]"
                      >
                        <dt className="text-caramelo-claro">{fila.k}</dt>
                        <dd className="m-0 text-right">{fila.v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="m-0 mt-1 text-xs text-caramelo-claro">
                    La disponibilidad será confirmada antes de coordinar el pedido.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <a
                    href={NEGOCIO.whatsapp}
                    className="inline-flex min-h-[50px] min-w-[200px] flex-1 items-center justify-center border border-papel bg-papel px-6 text-sm font-semibold text-verde no-underline hover:bg-crema"
                  >
                    Continuar por WhatsApp
                  </a>
                  <Boton variante="secundario-invertido" className="min-w-[180px] flex-1">
                    Solicitar propuesta
                  </Boton>
                </div>
              </Paso>
            </>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <Paso key={`paso-${paso}`} animado={!reducido}>
                {paso === 1 && (
                  <>
                    <Campo titulo="Tipo de ocasión">
                      <Chips
                        name="ocasion-tipo"
                        opciones={OCASION_OPCIONES.tipo}
                        valor={ocasion.tipo}
                        onElegir={(v) => set('tipo', v)}
                      />
                    </Campo>
                    <Campo titulo="Cantidad aproximada de personas">
                      <Chips
                        name="ocasion-personas"
                        opciones={OCASION_OPCIONES.personas}
                        valor={ocasion.personas}
                        onElegir={(v) => set('personas', v)}
                      />
                    </Campo>
                  </>
                )}
                {paso === 2 && (
                  <>
                    <Campo titulo="Fecha deseada">
                      <input
                        type="date"
                        value={ocasion.fecha}
                        onChange={(e) => set('fecha', e.target.value)}
                        className={`min-h-[46px] max-w-[240px] ${CAMPO_TEXTO}`}
                      />
                      <p className="m-0 text-[11.5px] text-caramelo-claro">
                        Anticipación por confirmar según el pedido.
                      </p>
                    </Campo>
                    <Campo titulo="Preferencia general">
                      <Chips
                        name="ocasion-preferencia"
                        opciones={OCASION_OPCIONES.preferencia}
                        valor={ocasion.preferencia}
                        onElegir={(v) => set('preferencia', v)}
                      />
                    </Campo>
                    <Campo titulo="Retiro o entrega">
                      <Chips
                        name="ocasion-entrega"
                        opciones={OCASION_OPCIONES.entrega}
                        valor={ocasion.entrega}
                        onElegir={(v) => set('entrega', v)}
                      />
                    </Campo>
                  </>
                )}
                {paso === 3 && (
                  <>
                    <Campo titulo="Observaciones">
                      <textarea
                        rows={3}
                        value={ocasion.observaciones}
                        onChange={(e) => set('observaciones', e.target.value)}
                        placeholder="Lo que quieras contarnos sobre tu ocasión"
                        className={`resize-y py-3 ${CAMPO_TEXTO}`}
                      />
                    </Campo>

                    <div className="flex flex-col gap-2 border-t border-papel/25 pt-[18px]">
                      <div className="font-display text-[22px]">Tu resumen</div>
                      <dl className="m-0 flex flex-col">
                        {resumen.map((fila) => (
                          <div
                            key={fila.k}
                            className="flex justify-between gap-4 border-b border-papel/15 py-1.5 text-[13px]"
                          >
                            <dt className="text-caramelo-claro">{fila.k}</dt>
                            <dd className="m-0 text-right">{fila.v}</dd>
                          </div>
                        ))}
                      </dl>
                      <p className="m-0 mt-1 text-xs text-caramelo-claro">
                        La disponibilidad será confirmada antes de coordinar el pedido.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      <a
                        href={NEGOCIO.whatsapp}
                        className="inline-flex min-h-[50px] min-w-[200px] flex-1 items-center justify-center border border-papel bg-papel px-6 text-sm font-semibold text-verde no-underline hover:bg-crema"
                      >
                        Continuar por WhatsApp
                      </a>
                      <Boton
                        variante="secundario-invertido"
                        className="min-w-[180px] flex-1"
                      >
                        Solicitar propuesta
                      </Boton>
                    </div>
                  </>
                )}
              </Paso>
            </AnimatePresence>
          )}

          {stepper && (
            <div className="flex justify-between border-t border-papel/20 pt-4">
              <Boton
                variante="secundario-invertido"
                compacto
                className="px-[18px] text-[13px]"
                disabled={paso === 1}
                onClick={() => setPaso((p) => Math.max(1, p - 1))}
              >
                ← Volver
              </Boton>
              {paso < 3 && (
                <Boton
                  variante="primario-invertido"
                  compacto
                  className="px-6 text-[13.5px]"
                  onClick={() => setPaso((p) => Math.min(3, p + 1))}
                >
                  Siguiente →
                </Boton>
              )}
            </div>
          )}
        </form>
      </div>
    </section>
  )
}
