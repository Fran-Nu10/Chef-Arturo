'use client'

import { useRouter } from 'next/navigation'
import { NEGOCIO } from '@/content/datos'
import { Boton, BotonEnlace } from '@/components/ui/Boton'
import { Actual, BarraContexto } from '@/components/pantallas/BarraContexto'
import { Pantalla } from '@/components/pantallas/Estructura'

/**
 * Pantalla 15 · Elección entre Mercado Pago y coordinación por WhatsApp.
 * Ninguna de las dos vías afirma comisiones, plazos ni medios habilitados.
 */
export default function PasoPago() {
  const router = useRouter()

  return (
    <Pantalla>
      <BarraContexto volverA="/checkout/resumen">
        <Actual>¿Cómo querés pagar?</Actual>
      </BarraContexto>

      <div className="flex flex-col gap-3.5 px-4 pt-5 pb-6">
        <div className="flex flex-col gap-2 border border-verde bg-verde/[0.07] px-4 py-[18px]">
          <div className="flex items-center justify-between gap-3">
            <b className="text-[15px] font-semibold">Pagar online</b>
            <span className="bg-verde px-2 py-1 text-[10px] font-bold tracking-[0.08em] text-papel">
              MERCADO PAGO
            </span>
          </div>
          <p className="m-0 text-[12.5px] leading-relaxed text-tinta-suave">
            Tarjetas, dinero en cuenta y otros medios de Mercado Pago.
          </p>
          <Boton
            compacto
            className="mt-1"
            onClick={() => router.push('/pedido/pendiente')}
          >
            Continuar a Mercado Pago
          </Boton>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-medium text-tinta-tenue">
          <span className="h-px flex-1 bg-linea" />O SI PREFERÍS
          <span className="h-px flex-1 bg-linea" />
        </div>

        <div className="flex flex-col gap-2 border border-linea-fuerte px-4 py-[18px]">
          <b className="text-[15px] font-semibold">Coordinar por WhatsApp</b>
          <p className="m-0 text-[12.5px] leading-relaxed text-tinta-suave">
            Te escribimos para confirmar el pedido y coordinar el pago.
          </p>
          <BotonEnlace
            href={NEGOCIO.whatsapp}
            variante="secundario"
            compacto
            className="mt-1"
          >
            Enviar pedido por WhatsApp
          </BotonEnlace>
        </div>
      </div>
    </Pantalla>
  )
}
