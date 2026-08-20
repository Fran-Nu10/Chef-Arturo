import Link from 'next/link'
import type { ReactNode } from 'react'
import { salir } from '@/server/acciones-auth'

export interface Miga {
  etiqueta: string
  href?: string
}

/** Cabecera de página: migas, título y acciones. */
export function CabeceraAdmin({
  titulo,
  migas = [],
  descripcion,
  acciones,
}: {
  titulo: string
  migas?: Miga[]
  descripcion?: string
  acciones?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-linea px-4 py-5 lg:flex-row lg:items-end lg:justify-between lg:px-8">
      <div className="flex flex-col gap-1.5">
        {migas.length > 0 && (
          <nav aria-label="Ruta de navegación">
            <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-[11.5px] text-tinta-suave">
              {migas.map((m, i) => (
                <li key={`${m.etiqueta}-${i}`} className="flex items-center gap-1.5">
                  {m.href ? (
                    <Link href={m.href} className="text-caramelo-texto">
                      {m.etiqueta}
                    </Link>
                  ) : (
                    <span>{m.etiqueta}</span>
                  )}
                  {i < migas.length - 1 && <span aria-hidden="true">/</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="m-0 font-display text-[28px] leading-tight font-normal">{titulo}</h1>
        {descripcion && (
          <p className="m-0 max-w-[62ch] text-[13px] leading-relaxed text-tinta-suave">
            {descripcion}
          </p>
        )}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </header>
  )
}

/** Estado vacío honesto: dice qué falta y cómo empezar. */
export function VacioAdmin({
  titulo,
  texto,
  accion,
}: {
  titulo: string
  texto: string
  accion?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 border border-dashed border-linea-fuerte px-6 py-14 text-center">
      <h2 className="m-0 font-display text-xl font-normal">{titulo}</h2>
      <p className="m-0 max-w-[46ch] text-[13px] leading-relaxed text-tinta-suave">{texto}</p>
      {accion}
    </div>
  )
}

/** Placeholder de carga. Respeta reduced motion vía la regla global. */
export function Esqueleto({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-borde bg-crema ${className}`}
    />
  )
}

/** Aviso de que el backend no está configurado. Nunca finge un guardado. */
export function SinBackend({ faltantes }: { faltantes: string[] }) {
  return (
    <div className="m-4 border border-caramelo bg-papel-alt p-5 lg:m-8">
      <h2 className="m-0 font-display text-xl font-normal">
        Falta configurar el backend
      </h2>
      <p className="mt-2 mb-3 text-[13px] leading-relaxed text-tinta-suave">
        El panel no está conectado a Supabase, así que no puede leer ni guardar
        nada. El storefront público sigue funcionando con los datos de
        demostración.
      </p>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {faltantes.map((v) => (
          <li key={v} className="font-mono text-[12px] text-caramelo-texto">
            {v}
          </li>
        ))}
      </ul>
      <p className="mt-3 mb-0 text-[12.5px] leading-relaxed text-tinta-suave">
        Instrucciones en <code className="bg-crema px-1">docs/BACKEND.md</code>.
      </p>
    </div>
  )
}

/**
 * Banner permanente del modo demostración.
 *
 * Va arriba de todo y en todas las pantallas del panel, no como un aviso que
 * se cierra: mientras la sesión sea de demostración, quien mire la pantalla
 * tiene que poder saberlo sin haber visto el login.
 *
 * `role="status"` para que lo anuncie el lector de pantalla al entrar.
 */
export function BannerDemo() {
  return (
    <div
      role="status"
      // El fondo se compone sobre papel para quedar opaco: el banner es sticky
      // y el contenido no debe leerse a través de él al scrollear.
      className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-caramelo bg-papel bg-gradient-to-b from-caramelo/[0.12] to-caramelo/[0.12] px-4 py-2.5"
    >
      <p className="m-0 text-[13px] font-semibold text-caramelo-texto">
        Modo demostración — los cambios no se guardan
      </p>
      <form action={salir} className="flex-none">
        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center border border-caramelo px-3 text-[12.5px] font-semibold text-caramelo-texto transition-colors hover:bg-caramelo hover:text-papel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-caramelo"
        >
          Salir de la demostración
        </button>
      </form>
    </div>
  )
}
