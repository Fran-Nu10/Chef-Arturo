import { CAMPANAS } from '@/content/datos'
import type { EstadoCampana } from '@/content/tipos'
import { MediaPendiente } from '@/components/ui/MediaPendiente'
import { EncabezadoSeccion } from '@/components/ui/Reveal'

/** Cada estado tiene su propio peso visual dentro del archivo editorial. */
const ESTADO: Record<
  EstadoCampana,
  {
    etiqueta: string
    chip: string
    tarjeta: string
    referencia: string
    titulo: string
    texto: string
    /** Escalonado editorial: las campañas no se alinean en un slider genérico. */
    desplazamiento: string
    boton?: string
  }
> = {
  activa: {
    etiqueta: 'ACTIVA',
    chip: 'bg-verde text-papel',
    tarjeta: 'border-verde bg-papel-alt',
    referencia: 'text-caramelo',
    titulo: 'text-tinta',
    texto: 'text-tinta-suave',
    desplazamiento: '',
    boton: 'bg-verde text-papel border border-verde hover:bg-verde-profundo',
  },
  programada: {
    etiqueta: 'PROGRAMADA',
    chip: 'border border-verde text-verde',
    tarjeta: 'border-linea bg-papel-alt',
    referencia: 'text-caramelo',
    titulo: 'text-tinta',
    texto: 'text-tinta-suave',
    desplazamiento: 'lg:translate-y-[26px]',
    boton: 'border border-verde text-verde hover:bg-verde/[0.07]',
  },
  finalizada: {
    etiqueta: 'FINALIZADA',
    chip: 'border border-linea-fuerte text-tinta-suave',
    tarjeta: 'border-linea bg-crema-apagado opacity-[0.72]',
    referencia: 'text-linea-fuerte',
    titulo: 'text-tinta-suave',
    texto: 'text-tinta-tenue',
    desplazamiento: 'lg:translate-y-[52px]',
  },
}

/**
 * 06 · FECHAS QUE IMPORTAN — archivo editorial de campañas administrables.
 *
 * Ventanas superpuestas y escalonadas, no un slider genérico con puntos.
 * Los nombres son estructura de ejemplo, no campañas vigentes.
 */
export function FechasQueImportan() {
  return (
    <section
      aria-label="Fechas que importan"
      className="border-b border-linea pt-[clamp(56px,7vw,96px)] pb-[clamp(48px,6vw,80px)]"
    >
      <div className="px-[clamp(16px,3.4vw,48px)]">
        <EncabezadoSeccion
          numero="06"
          kicker="CAMPAÑAS"
          titulo="Fechas que importan"
          bajada="Archivo editorial de campañas. Los nombres y fechas son estructura de ejemplo, pendientes de validación."
        />
      </div>

      <div className="riel flex snap-x snap-mandatory items-start gap-[18px] overflow-x-auto px-[clamp(16px,3.4vw,48px)] pt-[30px] pb-2.5 lg:snap-none lg:overflow-visible">
        {CAMPANAS.map((campana) => {
          const estilo = ESTADO[campana.estado]
          return (
            <article
              key={campana.id}
              className={`flex min-w-[80%] shrink-0 snap-center flex-col gap-3 border px-4 pt-4 pb-5 lg:min-w-0 lg:flex-1 lg:shrink ${estilo.tarjeta} ${estilo.desplazamiento}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-[5px] text-[10px] font-bold tracking-[0.12em] ${estilo.chip}`}
                >
                  {estilo.etiqueta}
                </span>
                <span className={`tnum font-display text-base ${estilo.referencia}`}>
                  {campana.referencia}
                </span>
              </div>

              <MediaPendiente
                etiqueta={campana.imagenPendiente}
                ratio="3/2"
                className="w-full"
                apagado={campana.estado === 'finalizada'}
              />

              <h3
                className={`m-0 font-display text-[22px] leading-tight font-normal ${estilo.titulo}`}
              >
                {campana.titulo}
              </h3>
              <p className={`m-0 text-[12.5px] leading-relaxed ${estilo.texto}`}>
                {campana.descripcion}
                <br />
                {campana.rango}
              </p>

              {campana.cta && estilo.boton && (
                <button
                  type="button"
                  className={`inline-flex min-h-[46px] items-center justify-center px-6 text-[13px] font-semibold transition-colors duration-200 ${estilo.boton}`}
                >
                  {campana.cta}
                </button>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
