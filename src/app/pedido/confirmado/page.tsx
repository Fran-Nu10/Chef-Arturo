import type { Metadata } from 'next'
import { BotonEnlace } from '@/components/ui/Boton'
import { IconoTilde } from '@/components/ui/Iconos'
import { Resumen } from '@/components/pantallas/Campos'
import { CabeceraConfirmacion } from '@/components/pantallas/Confirmacion'
import { Pantalla } from '@/components/pantallas/Estructura'

export const metadata: Metadata = { title: 'Pedido confirmado' }

/** Pantalla 17 · Pedido confirmado. */
export default function PedidoConfirmado() {
  return (
    <Pantalla conCarrito={false}>
      <CabeceraConfirmacion
        icono={<IconoTilde size={28} />}
        titulo="¡Pedido confirmado!"
        referencia="PEDIDO Nº CA-····"
      />

      <div className="flex flex-col gap-3.5 px-4 pt-[22px] pb-[26px]">
        <Resumen
          filas={[
            { k: 'Retiro', v: 'Florida · dirección pendiente' },
            {
              k: 'Fecha',
              v: <span className="tnum">Fecha elegida · franja mañana</span>,
            },
            {
              k: 'Pago',
              v: <span className="text-verde">Acreditado · Mercado Pago</span>,
            },
          ]}
        />
        <p className="m-0 text-xs leading-relaxed text-tinta-suave">
          Te enviamos la confirmación por WhatsApp. Guardá el número de pedido para
          consultar el estado.
        </p>
        <BotonEnlace href="/estado" compacto>
          Ver estado del pedido
        </BotonEnlace>
        <BotonEnlace href="/" variante="secundario" compacto>
          Volver a la vitrina
        </BotonEnlace>
      </div>
    </Pantalla>
  )
}
