import type { Metadata } from 'next'
import { NEGOCIO } from '@/content/datos'
import { BotonEnlace } from '@/components/ui/Boton'
import { IconoEnviar } from '@/components/ui/Iconos'
import { Resumen } from '@/components/pantallas/Campos'
import { CabeceraConfirmacion } from '@/components/pantallas/Confirmacion'
import { Pantalla } from '@/components/pantallas/Estructura'

export const metadata: Metadata = { title: 'Solicitud recibida' }

/** Pantalla 20 · Confirmación de la solicitud de evento. */
export default function ConfirmacionEvento() {
  return (
    <Pantalla conCarrito={false}>
      <CabeceraConfirmacion
        icono={<IconoEnviar size={26} />}
        titulo="Recibimos tu solicitud"
        referencia="SOLICITUD Nº EV-····"
      />

      <div className="flex flex-col gap-3.5 px-4 pt-[22px] pb-[26px]">
        <Resumen
          filas={[
            { k: 'Ocasión', v: 'Reunión familiar' },
            { k: 'Personas', v: <span className="tnum">10 a 25</span> },
            { k: 'Fecha deseada', v: 'Elegida · a confirmar' },
            { k: 'Preferencia', v: 'Salado · retiro' },
          ]}
        />
        <p className="m-0 text-xs leading-relaxed text-tinta-suave">
          Te contactamos por WhatsApp con la propuesta y la disponibilidad. Los tiempos de
          respuesta están pendientes de validación.
        </p>
        <BotonEnlace href={NEGOCIO.whatsapp} compacto>
          Abrir WhatsApp
        </BotonEnlace>
        <BotonEnlace href="/" variante="secundario" compacto>
          Volver a la vitrina
        </BotonEnlace>
      </div>
    </Pantalla>
  )
}
