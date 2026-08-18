import { NEGOCIO } from '@/content/datos'

const LEYENDA = `${NEGOCIO.autoras} · ${NEGOCIO.ciudad} · ${NEGOCIO.entrega} · WhatsApp · Mercado Pago`

/**
 * Pie compacto. Sobre verde en el cierre editorial de la home; sobre papel en
 * las pantallas comerciales.
 */
export function Pie({ tono = 'verde' }: { tono?: 'verde' | 'papel' }) {
  const oscuro = tono === 'verde'
  return (
    <footer
      className={`flex flex-wrap justify-between gap-3.5 border-t pt-5 pb-[calc(20px+env(safe-area-inset-bottom))] text-xs ${
        oscuro ? 'border-papel/25 text-crema' : 'border-linea text-tinta-suave'
      }`}
    >
      <span
        className={`font-display text-base italic ${oscuro ? 'text-papel' : 'text-verde'}`}
      >
        {NEGOCIO.nombre}
      </span>
      <span>{LEYENDA}</span>
    </footer>
  )
}
