import type { ReactNode } from 'react'

/**
 * Cabecera verde de las pantallas de confirmación (17 y 20): marca circular
 * en caramelo, título serif y el número de pedido o solicitud.
 */
export function CabeceraConfirmacion({
  icono,
  titulo,
  referencia,
}: {
  icono: ReactNode
  titulo: string
  referencia: string
}) {
  return (
    <div className="flex flex-col items-center gap-3.5 bg-verde px-8 py-10 text-center text-papel">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-caramelo-claro text-caramelo-claro">
        {icono}
      </div>
      <h1 className="m-0 font-display text-[28px] font-normal">{titulo}</h1>
      <div className="tnum border border-papel/40 px-4 py-2 text-xs font-semibold tracking-[0.1em]">
        {referencia}
      </div>
    </div>
  )
}
