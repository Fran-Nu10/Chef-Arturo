import type { Metadata } from 'next'
import { BotonEnlace } from '@/components/ui/Boton'
import { IconoReloj } from '@/components/ui/Iconos'
import { EstadoCentrado, Pantalla } from '@/components/pantallas/Estructura'

export const metadata: Metadata = { title: 'Pago en proceso' }

/** Pantalla 16 · Pago pendiente. */
export default function PagoPendiente() {
  return (
    <Pantalla conCarrito={false}>
      <EstadoCentrado
        bordePunteado={false}
        icono={<IconoReloj size={32} />}
        titulo="Tu pago está en proceso"
        texto="Mercado Pago está confirmando la operación. Te avisamos por WhatsApp apenas se acredite."
      >
        <div className="tnum border border-caramelo px-3.5 py-2 text-xs font-semibold tracking-[0.08em] text-caramelo-texto">
          PEDIDO Nº CA-····
        </div>
        <BotonEnlace href="/estado" variante="secundario" compacto>
          Consultar estado del pedido
        </BotonEnlace>
      </EstadoCentrado>
    </Pantalla>
  )
}
