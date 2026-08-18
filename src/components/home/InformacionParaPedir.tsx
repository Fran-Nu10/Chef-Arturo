import { PREGUNTAS } from '@/content/datos'
import { EncabezadoSeccion } from '@/components/ui/Reveal'

/**
 * 09 · INFORMACIÓN PARA PEDIR.
 *
 * Acordeones nativos (`details`/`summary`): accesibles, sin JavaScript y sin
 * animaciones complejas. Todo el contenido figura como pendiente de validación.
 */
export function InformacionParaPedir() {
  return (
    <section
      aria-label="Información para pedir"
      className="border-t border-linea px-[clamp(16px,3.4vw,48px)] py-[clamp(56px,7vw,96px)]"
    >
      <EncabezadoSeccion
        numero="09"
        kicker="INFORMACIÓN PARA PEDIR"
        titulo="Antes de tu pedido"
        className="mb-7"
      />

      <div className="grid grid-cols-1 gap-x-14 lg:grid-cols-2">
        {PREGUNTAS.map((item) => (
          <details key={item.pregunta} className="acordeon border-b border-linea">
            <summary className="flex min-h-[56px] cursor-pointer items-center justify-between gap-3.5 text-[15px] font-semibold">
              {item.pregunta}
              <span
                aria-hidden="true"
                className="acordeon-signo font-display text-[22px] text-caramelo transition-transform duration-[250ms]"
              >
                +
              </span>
            </summary>
            <p className="mt-0 mb-[18px] text-[13.5px] leading-relaxed text-tinta-suave">
              {item.respuesta}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
