'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { NEGOCIO, OCASION_OPCIONES } from '@/content/datos'
import { Boton } from '@/components/ui/Boton'
import {
  IconoAtras,
  IconoCumpleanos,
  IconoFamilia,
  IconoMerienda,
  IconoOtraOcasion,
  IconoTilde,
  IconoTrabajo,
} from '@/components/ui/Iconos'
import { MediaPendiente } from '@/components/ui/MediaPendiente'
import { Reveal } from '@/components/ui/Reveal'

interface Ocasion {
  tipo: string | null
  /** Sólo se pide cuando la ocasión es "Otra ocasión". */
  otroDetalle: string
  personas: string | null
  fecha: string
  preferencia: string | null
  entrega: string | null
  observaciones: string
}

const VACIA: Ocasion = {
  tipo: null,
  otroDetalle: '',
  personas: null,
  fecha: '',
  preferencia: null,
  entrega: null,
  observaciones: '',
}

const OTRA = 'Otra ocasión'

/** Un icono por opción. Se busca por nombre para no duplicar la lista. */
const ICONO_DE_OCASION: Record<string, ComponentType<{ size?: number }>> = {
  Cumpleaños: IconoCumpleanos,
  'Reunión familiar': IconoFamilia,
  'Evento de trabajo': IconoTrabajo,
  'Merienda compartida': IconoMerienda,
  [OTRA]: IconoOtraOcasion,
}

const PASOS = [
  { numero: 1, nombre: 'Ocasión' },
  { numero: 2, nombre: 'Invitados' },
  { numero: 3, nombre: 'Detalles' },
] as const

const TRANSICION = { duration: 0.24, ease: [0.33, 1, 0.68, 1] as const }

/**
 * Fecha del `<input type="date">` en formato uruguayo.
 *
 * Se le agrega la hora a propósito: `new Date('2026-12-24')` se interpreta como
 * medianoche UTC, y en Montevideo —UTC−3— eso muestra el día anterior. Con
 * `T00:00:00` se parsea en hora local y el día es el que la persona eligió.
 */
function fechaLegible(iso: string): string {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

// ── Piezas del configurador ─────────────────────────────────────────────────

/**
 * Tarjeta seleccionable.
 *
 * Es un radio nativo escondido dentro de su `label`: así el grupo se recorre
 * con las flechas del teclado sin escribir nada, que es justo lo que se espera
 * de una elección única. El estado no depende sólo del color —la seleccionada
 * cambia de fondo, engrosa el borde y muestra un tilde— y el foco se dibuja
 * sobre la tarjeta entera, no sobre el input invisible.
 */
function TarjetaOpcion({
  name,
  valor,
  elegida,
  onElegir,
  icono: Icono,
  ayuda,
  className = '',
}: {
  name: string
  valor: string
  elegida: boolean
  onElegir: () => void
  icono?: ComponentType<{ size?: number }>
  /** Aclaración breve bajo el nombre. Nunca un dato comercial inventado. */
  ayuda?: string
  className?: string
}) {
  return (
    <label
      className={`group relative flex min-h-[64px] cursor-pointer flex-col justify-center gap-1.5 border px-4 py-3.5 transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-caramelo ${
        elegida
          ? 'border-verde bg-verde text-papel'
          : 'border-linea bg-papel-alt text-tinta hover:border-linea-fuerte hover:bg-crema/60'
      } ${className}`}
    >
      <input
        type="radio"
        name={name}
        value={valor}
        checked={elegida}
        onChange={onElegir}
        className="sr-only"
      />

      {Icono && (
        <Icono size={20} />
      )}
      <span className="text-[13.5px] leading-tight font-medium">{valor}</span>
      {ayuda && (
        <span
          className={`text-[11.5px] leading-tight ${elegida ? 'text-crema' : 'text-tinta-suave'}`}
        >
          {ayuda}
        </span>
      )}

      {elegida && (
        <span className="absolute top-2.5 right-2.5 text-caramelo-claro">
          <IconoTilde size={15} />
        </span>
      )}
    </label>
  )
}

function Pregunta({ children }: { children: ReactNode }) {
  return (
    <h3 className="m-0 font-display text-[clamp(20px,2.1vw,26px)] leading-tight font-normal text-verde">
      {children}
    </h3>
  )
}

function Etiqueta({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-semibold tracking-[0.1em] text-caramelo-texto uppercase">
      {children}
    </span>
  )
}

const CAMPO =
  'w-full border border-linea bg-papel-alt px-3.5 text-[14px] text-tinta placeholder:text-tinta-tenue focus:border-verde focus:outline-none'

/**
 * Envoltura de un paso. Vive fuera del componente para que escribir en un campo
 * no la remonte y le robe el foco al input.
 */
function Paso({ animado, children }: { animado: boolean; children: ReactNode }) {
  if (!animado) return <div className="flex flex-col gap-5">{children}</div>
  return (
    <motion.div
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -14 }}
      transition={TRANSICION}
      className="flex flex-col gap-5"
    >
      {children}
    </motion.div>
  )
}

// ── Sección ─────────────────────────────────────────────────────────────────

/**
 * 05 · ARMÁ TU OCASIÓN — configurador visual, no un formulario administrativo.
 *
 * Una sola composición: la fotografía y el configurador comparten marco sobre un
 * fondo de papel manteca. La fotografía aporta el contraste —es lo único oscuro
 * de la sección— y el verde queda de acento: títulos, opción elegida y CTA.
 *
 * Una pregunta por pantalla. No es una calculadora ni recomienda cantidades:
 * reúne las respuestas, arma un resumen legible y lo lleva a WhatsApp, que es
 * donde se cierra el pedido.
 *
 * Sin JavaScript los tres pasos quedan apilados como un formulario único — ese
 * es el HTML que se sirve, y el paso a paso se activa al hidratar.
 */
export function ArmaTuOcasion() {
  const [ocasion, setOcasion] = useState<Ocasion>(VACIA)
  const [paso, setPaso] = useState(1)
  const [stepper, setStepper] = useState(false)
  const reducido = useReducedMotion()

  useEffect(() => setStepper(true), [])

  const set = <K extends keyof Ocasion>(clave: K, valor: Ocasion[K]) =>
    setOcasion((prev) => ({ ...prev, [clave]: valor }))

  const elegirTipo = (valor: string) =>
    setOcasion((prev) => ({
      ...prev,
      tipo: valor,
      // Cambiar de ocasión descarta la aclaración de "otra": si no, quedaría
      // colgando un texto que ya no corresponde a lo elegido.
      otroDetalle: valor === OTRA ? prev.otroDetalle : '',
    }))

  /** Qué hace falta para poder seguir. El paso 3 no tiene campos obligatorios. */
  const puedeSeguir =
    paso === 1 ? ocasion.tipo !== null : paso === 2 ? ocasion.personas !== null : true

  const tipoVisible =
    ocasion.tipo === OTRA && ocasion.otroDetalle.trim()
      ? ocasion.otroDetalle.trim()
      : ocasion.tipo

  /** La tira compacta que acompaña todo el flujo. */
  const tira = [
    { paso: 1, texto: tipoVisible },
    { paso: 2, texto: ocasion.personas && `${ocasion.personas} personas` },
  ].filter((x): x is { paso: number; texto: string } => Boolean(x.texto))

  const resumen = [
    { k: 'Ocasión', v: tipoVisible ?? '—', paso: 1 },
    { k: 'Personas', v: ocasion.personas ?? '—', paso: 2 },
    { k: 'Fecha deseada', v: fechaLegible(ocasion.fecha) || '—', paso: 3 },
    { k: 'Preferencia', v: ocasion.preferencia ?? '—', paso: 3 },
    { k: 'Retiro o entrega', v: ocasion.entrega ?? '—', paso: 3 },
  ]

  /**
   * El enlace de WhatsApp lleva el resumen escrito. Es el mismo destino de
   * siempre; lo que cambia es que las respuestas dejan de perderse al salir.
   */
  const mensaje = [
    '¡Hola! Quiero armar una ocasión:',
    ...resumen.filter((f) => f.v !== '—').map((f) => `· ${f.k}: ${f.v}`),
    ocasion.observaciones.trim() && `· Comentarios: ${ocasion.observaciones.trim()}`,
  ]
    .filter(Boolean)
    .join('\n')

  const enlaceWhatsapp =
    tira.length > 0
      ? `${NEGOCIO.whatsapp}?text=${encodeURIComponent(mensaje)}`
      : NEGOCIO.whatsapp

  // ── Bloques reutilizados por el modo con y sin JavaScript ────────────────

  const bloqueOcasion = (
    <>
      <Pregunta>¿Qué estás organizando?</Pregunta>
      <div
        role="radiogroup"
        aria-label="Tipo de ocasión"
        className="grid grid-cols-2 gap-2.5 lg:grid-cols-3"
      >
        {OCASION_OPCIONES.tipo.map((opcion) => (
          <TarjetaOpcion
            key={opcion}
            name="ocasion-tipo"
            valor={opcion}
            elegida={ocasion.tipo === opcion}
            onElegir={() => elegirTipo(opcion)}
            icono={ICONO_DE_OCASION[opcion]}
            className={opcion === OTRA ? 'col-span-2 lg:col-span-1' : ''}
          />
        ))}
      </div>

      {ocasion.tipo === OTRA && (
        <motion.div
          initial={reducido ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={TRANSICION}
          className="flex flex-col gap-2 overflow-hidden"
        >
          <label className="flex flex-col gap-2" htmlFor="ocasion-otro">
            <Etiqueta>Contanos qué tenés en mente</Etiqueta>
            <input
              id="ocasion-otro"
              type="text"
              value={ocasion.otroDetalle}
              onChange={(e) => set('otroDetalle', e.target.value)}
              placeholder="Por ejemplo: despedida, aniversario, taller…"
              className={`min-h-[50px] ${CAMPO}`}
            />
          </label>
        </motion.div>
      )}
    </>
  )

  const bloqueInvitados = (
    <>
      <Pregunta>¿Para cuántas personas sería?</Pregunta>
      <div
        role="radiogroup"
        aria-label="Cantidad aproximada de personas"
        className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"
      >
        {OCASION_OPCIONES.personas.map((opcion) => (
          <TarjetaOpcion
            key={opcion}
            name="ocasion-personas"
            valor={opcion}
            elegida={ocasion.personas === opcion}
            onElegir={() => set('personas', opcion)}
          />
        ))}
      </div>
      <p className="m-0 text-[12.5px] leading-relaxed text-tinta-suave">
        Es una referencia para armar la propuesta. Si no estás seguro, elegí lo más
        parecido y lo ajustamos después.
      </p>
    </>
  )

  const bloqueDetalles = (
    <>
      <Pregunta>Últimos detalles</Pregunta>

      <label className="flex flex-col gap-2" htmlFor="ocasion-fecha">
        <Etiqueta>Fecha deseada</Etiqueta>
        <input
          id="ocasion-fecha"
          type="date"
          value={ocasion.fecha}
          onChange={(e) => set('fecha', e.target.value)}
          className={`min-h-[50px] max-w-[260px] ${CAMPO}`}
        />
      </label>

      <div className="flex flex-col gap-2">
        <Etiqueta>Preferencia</Etiqueta>
        <div
          role="radiogroup"
          aria-label="Preferencia"
          className="grid grid-cols-3 gap-2.5"
        >
          {OCASION_OPCIONES.preferencia.map((opcion) => (
            <TarjetaOpcion
              key={opcion}
              name="ocasion-preferencia"
              valor={opcion}
              elegida={ocasion.preferencia === opcion}
              onElegir={() => set('preferencia', opcion)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Etiqueta>Retiro o entrega</Etiqueta>
        <div
          role="radiogroup"
          aria-label="Retiro o entrega"
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
        >
          {OCASION_OPCIONES.entrega.map((opcion) => (
            <TarjetaOpcion
              key={opcion}
              name="ocasion-entrega"
              valor={opcion}
              elegida={ocasion.entrega === opcion}
              onElegir={() => set('entrega', opcion)}
            />
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-2" htmlFor="ocasion-observaciones">
        <Etiqueta>Algo más que quieras contarnos (opcional)</Etiqueta>
        <textarea
          id="ocasion-observaciones"
          rows={3}
          value={ocasion.observaciones}
          onChange={(e) => set('observaciones', e.target.value)}
          placeholder="Alergias, horario, decoración…"
          className={`resize-y py-3 ${CAMPO}`}
        />
      </label>

      <div className="flex flex-col gap-2 border-t border-linea pt-4">
        <div className="font-display text-[20px] text-verde">Tu ocasión</div>
        <dl className="m-0 flex flex-col">
          {resumen.map((fila) => (
            <div
              key={fila.k}
              className="flex justify-between gap-4 border-b border-linea/70 py-1.5 text-[13px]"
            >
              <dt className="text-tinta-suave">{fila.k}</dt>
              <dd className="m-0 text-right font-medium text-tinta">{fila.v}</dd>
            </div>
          ))}
        </dl>
        <p className="m-0 mt-1 text-[12px] leading-relaxed text-tinta-suave">
          La disponibilidad y la anticipación se confirman por WhatsApp antes de
          coordinar el pedido.
        </p>
      </div>
    </>
  )

  const cierre = (
    <div className="flex flex-col gap-3">
      <a
        href={enlaceWhatsapp}
        className="inline-flex min-h-[52px] w-full items-center justify-center border border-verde bg-verde px-6 text-center text-sm font-semibold text-papel no-underline transition-colors duration-200 hover:bg-verde-profundo"
      >
        Enviar mi ocasión por WhatsApp
      </a>
      {/*
        Antes había acá un segundo botón, "Solicitar propuesta", que no hacía
        nada. La pantalla que le corresponde existe —`/evento`, y está en la
        lista de destinos válidos del CMS— pero no la enlazaba nadie. Queda como
        enlace secundario para no competir con el CTA principal.
      */}
      <Link
        href="/evento"
        className="inline-flex min-h-[44px] items-center self-start text-[13px] font-medium text-caramelo-texto underline underline-offset-[3px]"
      >
        Prefiero dejarlo por escrito
      </Link>
    </div>
  )

  // ── Composición ──────────────────────────────────────────────────────────

  return (
    <section
      aria-label="Armá tu ocasión"
      className="relative z-2 overflow-hidden border-y border-linea/70 bg-papel-calido px-5 py-[clamp(44px,5.5vw,80px)] text-tinta sm:px-[clamp(20px,3.4vw,48px)]"
    >
      {/*
        El fondo no es plano, pero tampoco tiene una mancha encima: dos halos
        radiales de opacidad muy baja y un rayado de 3px que hace de grano de
        papel. Es una sola capa pintada, sin animación ni filtros, así que no
        cuesta nada de render.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(60rem 40rem at 88% 6%, color-mix(in srgb, var(--color-caramelo) 7%, transparent), transparent 70%)',
            'radial-gradient(50rem 34rem at 4% 92%, color-mix(in srgb, var(--color-papel-alt) 85%, transparent), transparent 72%)',
            'repeating-linear-gradient(92deg, color-mix(in srgb, var(--color-linea) 13%, transparent) 0 1px, transparent 1px 4px)',
            'repeating-linear-gradient(2deg, color-mix(in srgb, var(--color-linea) 9%, transparent) 0 1px, transparent 1px 5px)',
          ].join(', '),
        }}
      />

      <div className="relative mx-auto flex max-w-[1280px] flex-col gap-7">
        <Reveal className="flex max-w-[620px] flex-col gap-3">
          <div className="text-[11px] font-semibold tracking-[0.16em] text-caramelo-texto">
            05 — PARA REUNIONES Y EVENTOS
          </div>
          <h2 className="m-0 font-display text-titulo font-normal text-verde">
            Armá una ocasión a tu medida
          </h2>
          <p className="m-0 text-[14.5px] leading-relaxed text-tinta-suave">
            Contanos qué estás organizando y te ayudamos a encontrar una propuesta para
            compartir.
          </p>
        </Reveal>

        {/* Una sola pieza: la foto y el configurador comparten marco y altura. */}
        <div className="grid overflow-hidden border border-verde/20 lg:grid-cols-[2fr_3fr]">
          {/* Fotografía — banner en mobile, columna completa en desktop. */}
          <div className="relative h-[180px] overflow-hidden lg:h-auto lg:min-h-[440px]">
            <motion.div
              // Movimiento mínimo: la foto se acerca un punto por paso, lo
              // suficiente para que la composición no quede congelada.
              animate={reducido ? undefined : { scale: 1 + (paso - 1) * 0.025 }}
              transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
              className="absolute inset-0"
            >
              <MediaPendiente
                slot="home-arma-ocasion"
                etiqueta="Imagen temporal — mesa para eventos"
                sizes="(max-width: 1023px) 100vw, 40vw"
                conBorde={false}
                className="h-full w-full rounded-none"
              />
            </motion.div>
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-chocolate/85 via-chocolate/25 to-transparent"
            />
            <p className="absolute inset-x-0 bottom-0 m-0 px-5 pb-5 font-display text-[clamp(17px,1.6vw,21px)] leading-snug text-papel">
              Vos elegís la ocasión.
              <br />
              Nosotros preparamos la mesa.
            </p>
          </div>

          {/* Configurador — papel, para contrastar con el verde de la sección. */}
          <form
            className="flex flex-col gap-5 bg-papel-alt p-[clamp(20px,2.6vw,36px)] text-tinta"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Progreso. Cada paso alcanzado es un atajo para volver a editarlo. */}
            <div className="flex items-center justify-between gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                {PASOS.map(({ numero, nombre }, i) => {
                  const actual = stepper && paso === numero
                  const alcanzado = !stepper || paso >= numero
                  return (
                    <span key={nombre} className="flex items-center gap-2">
                      {i > 0 && (
                        <span aria-hidden="true" className="h-px w-5 bg-linea" />
                      )}
                      <button
                        type="button"
                        disabled={!stepper || numero > paso}
                        aria-current={actual ? 'step' : undefined}
                        onClick={() => setPaso(numero)}
                        className={`min-h-[44px] px-1 text-[12.5px] font-semibold tracking-[0.04em] transition-colors duration-200 disabled:cursor-default ${
                          actual
                            ? 'text-caramelo-texto underline underline-offset-[5px]'
                            : alcanzado
                              ? 'text-tinta-suave hover:text-verde'
                              : 'text-tinta-tenue'
                        }`}
                      >
                        {nombre}
                      </button>
                    </span>
                  )
                })}
              </div>
              <div className="text-[12px] font-semibold text-caramelo-texto sm:hidden">
                {stepper ? (
                  <>
                    Paso <span className="tnum">{paso}</span> de{' '}
                    <span className="tnum">3</span> ·{' '}
                    {PASOS[paso - 1]?.nombre ?? PASOS[0].nombre}
                  </>
                ) : (
                  'Los tres pasos, en una sola vista'
                )}
              </div>
            </div>

            {/* Tira de resumen: aparece con la primera elección. */}
            <AnimatePresence initial={false}>
              {tira.length > 0 && (
                <motion.div
                  initial={reducido ? false : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducido ? undefined : { opacity: 0, y: -6 }}
                  transition={TRANSICION}
                  className="flex flex-wrap items-center gap-x-2 border border-linea bg-crema/50 px-3.5 py-0.5"
                >
                  <span className="text-[10.5px] font-semibold tracking-[0.1em] text-caramelo-texto uppercase">
                    Tu ocasión
                  </span>
                  {tira.map((item, i) => (
                    <span key={item.paso} className="flex items-center gap-2">
                      {i > 0 && (
                        <span aria-hidden="true" className="text-tinta-tenue">
                          ·
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={!stepper}
                        onClick={() => setPaso(item.paso)}
                        className="inline-flex min-h-[44px] items-center text-[13px] font-medium text-tinta underline decoration-linea-fuerte underline-offset-[3px] transition-colors duration-200 hover:text-verde hover:decoration-verde disabled:no-underline"
                      >
                        {item.texto}
                      </button>
                    </span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sin JavaScript: los tres pasos apilados como un formulario único. */}
            {!stepper ? (
              <>
                <Paso animado={false}>{bloqueOcasion}</Paso>
                <Paso animado={false}>{bloqueInvitados}</Paso>
                <Paso animado={false}>
                  {bloqueDetalles}
                  {cierre}
                </Paso>
              </>
            ) : (
              <>
                <AnimatePresence mode="wait" initial={false}>
                  <Paso key={`paso-${paso}`} animado={!reducido}>
                    {paso === 1 && bloqueOcasion}
                    {paso === 2 && bloqueInvitados}
                    {paso === 3 && (
                      <>
                        {bloqueDetalles}
                        {cierre}
                      </>
                    )}
                  </Paso>
                </AnimatePresence>

                {/* Navegación: los dos controles juntos, no en extremos opuestos. */}
                {paso < 3 && (
                  <div className="flex flex-col-reverse gap-2.5 border-t border-linea pt-4 sm:flex-row sm:items-center">
                    {paso > 1 && (
                      <button
                        type="button"
                        onClick={() => setPaso((p) => Math.max(1, p - 1))}
                        className="inline-flex min-h-[48px] items-center justify-center gap-1.5 px-3 text-[13.5px] font-medium text-tinta-suave transition-colors duration-200 hover:text-verde"
                      >
                        <IconoAtras size={15} />
                        Volver
                      </button>
                    )}
                    <Boton
                      variante={puedeSeguir ? 'primario' : 'deshabilitado'}
                      className="min-h-[48px] w-full sm:w-auto sm:min-w-[260px]"
                      disabled={!puedeSeguir}
                      aria-disabled={!puedeSeguir}
                      onClick={() => puedeSeguir && setPaso((p) => Math.min(3, p + 1))}
                    >
                      {paso === 1 ? 'Elegir cantidad de personas' : 'Ir a los detalles'}
                    </Boton>
                    {!puedeSeguir && (
                      <span className="text-[12px] text-tinta-suave">
                        {paso === 1
                          ? 'Elegí una ocasión para seguir.'
                          : 'Elegí una cantidad para seguir.'}
                      </span>
                    )}
                  </div>
                )}

                {paso === 3 && (
                  <div className="border-t border-linea pt-4">
                    <button
                      type="button"
                      onClick={() => setPaso(2)}
                      className="inline-flex min-h-[48px] items-center gap-1.5 px-3 text-[13.5px] font-medium text-tinta-suave transition-colors duration-200 hover:text-verde"
                    >
                      <IconoAtras size={15} />
                      Volver
                    </button>
                  </div>
                )}
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
