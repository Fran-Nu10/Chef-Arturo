'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { NEGOCIO } from '@/content/datos'
import { Boton, BotonEnlace } from '@/components/ui/Boton'
import { IconoAlerta } from '@/components/ui/Iconos'
import { Actual, BarraContexto } from '@/components/pantallas/BarraContexto'
import { Pantalla } from '@/components/pantallas/Estructura'

/**
 * Pantalla 18 · Error de pago recuperable.
 * El carrito y la fecha siguen intactos: el estado del pedido no se destruye.
 */
export default function ErrorDePago() {
  const router = useRouter()

  return (
    <Pantalla>
      <BarraContexto volverA="/checkout/pago">
        <Actual>Pago</Actual>
      </BarraContexto>

      <div className="flex flex-col items-center gap-4 px-5 py-[26px] text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-alerta text-alerta">
          <IconoAlerta size={26} />
        </div>
        <h1 className="m-0 font-display text-[25px] font-normal">
          El pago no se completó
        </h1>
        <p className="m-0 max-w-[380px] text-[13px] leading-relaxed text-tinta-suave">
          No se realizó ningún cargo. Tu carrito y tu fecha siguen guardados: podés
          intentarlo de nuevo o elegir otro medio.
        </p>
        <div className="flex w-full flex-col gap-2">
          <Boton onClick={() => router.push('/pedido/pendiente')}>
            Reintentar con Mercado Pago
          </Boton>
          <BotonEnlace href={NEGOCIO.whatsapp} variante="secundario" compacto>
            Coordinar pago por WhatsApp
          </BotonEnlace>
          <Link
            href="/checkout/resumen"
            className="flex min-h-[44px] items-center justify-center text-[12.5px] font-medium text-tinta-suave underline underline-offset-[3px]"
          >
            Volver al resumen
          </Link>
        </div>
      </div>
    </Pantalla>
  )
}
