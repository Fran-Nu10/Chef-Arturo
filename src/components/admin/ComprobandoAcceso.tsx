import { Marca } from '@/components/layout/Header'

/**
 * Lo que se ve mientras se resuelve la sesión administrativa.
 *
 * Existe porque antes no había nada: el guard corre en el servidor y hasta que
 * responde no llega HTML, así que quien tocaba "Acceso de gestión" se quedaba
 * mirando la pantalla anterior sin señal de que algo estuviera pasando.
 */
export function ComprobandoAcceso() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-papel px-6 text-center"
    >
      <Marca tamano={26} />
      <p className="m-0 text-[13.5px] text-tinta-suave">Comprobando acceso…</p>
      <span
        aria-hidden="true"
        className="h-[2px] w-24 overflow-hidden bg-linea"
      >
        <span className="block h-full w-1/3 animate-[deslizar_1.1s_ease-in-out_infinite] bg-caramelo" />
      </span>
    </div>
  )
}
