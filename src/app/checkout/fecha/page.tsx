'use client'

import { useRouter } from 'next/navigation'
import { usePedido } from '@/lib/estado-pedido'
import { Boton } from '@/components/ui/Boton'
import { Calendario } from '@/components/pantallas/Calendario'
import { Segmentado } from '@/components/pantallas/Campos'
import { Pantalla } from '@/components/pantallas/Estructura'
import { MarcoCheckout } from '@/components/pantallas/MarcoCheckout'

/** Pantalla 12 · Selección de fecha y horario — paso 2 de 4. */
export default function PasoFecha() {
  const { fecha, setFecha, franja, setFranja } = usePedido()
  const router = useRouter()

  return (
    <Pantalla ancho="ancho">
      <MarcoCheckout paso={2} titulo="¿Para cuándo?" volverA="/checkout/entrega">
        <Calendario valor={fecha} onElegir={setFecha} />
        <Segmentado
          etiqueta="Franja horaria"
          opciones={['Mañana', 'Tarde']}
          valor={franja === 'manana' ? 'Mañana' : franja === 'tarde' ? 'Tarde' : null}
          onElegir={(v) => setFranja(v === 'Mañana' ? 'manana' : 'tarde')}
          ayuda="El horario exacto se coordina al confirmar."
        />
        <Boton onClick={() => router.push('/checkout/datos')}>Continuar</Boton>
      </MarcoCheckout>
    </Pantalla>
  )
}
