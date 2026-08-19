import { NEGOCIO } from '@/content/datos'
import { Pie } from '@/components/layout/Pie'
import { BotonEnlace } from '@/components/ui/Boton'
import { MediaPendiente } from '@/components/ui/MediaPendiente'
import { Reveal } from '@/components/ui/Reveal'

/**
 * 10 · CIERRE EDITORIAL — composición fuerte pero breve, sin repetir el hero:
 * fondo verde profundo, un solo arco a la derecha y el pie compacto.
 */
export function CierreEditorial() {
  return (
    <section
      aria-label="Cierre"
      className="bg-verde-profundo px-[clamp(16px,3.4vw,48px)] pt-[clamp(56px,7vw,96px)] text-papel"
    >
      <div className="flex flex-col items-center gap-8 pb-[clamp(48px,6vw,80px)] text-center lg:grid lg:grid-cols-[1fr_460px] lg:items-center lg:gap-16 lg:text-left">
        <Reveal className="flex flex-col items-center gap-[18px] lg:items-start">
          <div className="text-[11px] font-semibold tracking-[0.16em] text-caramelo-claro">
            {NEGOCIO.ciudad.toUpperCase()}
          </div>
          <h2 className="m-0 font-display text-[clamp(34px,4vw,56px)] leading-[1.05] font-normal">
            La vitrina está abierta.
          </h2>
          <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
            <BotonEnlace href="/catalogo" variante="primario-invertido">
              Ver catálogo
            </BotonEnlace>
            <BotonEnlace href={NEGOCIO.whatsapp} variante="secundario-invertido">
              Consultar por WhatsApp
            </BotonEnlace>
          </div>
          <p className="m-0 text-xs text-caramelo-claro">{NEGOCIO.ubicacion}</p>
        </Reveal>

        <MediaPendiente
          slot="home-cierre"
          etiqueta="Falta foto del local en Florida — cierre"
          sizes="(max-width: 1023px) 86vw, 460px"
          ratio="4/5"
          className="w-[min(86vw,460px)] border-papel/25"
        />
      </div>

      <Pie />
    </section>
  )
}
