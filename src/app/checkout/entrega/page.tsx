'use client'

import { useRouter } from 'next/navigation'
import { usePedido } from '@/lib/estado-pedido'
import { Boton } from '@/components/ui/Boton'
import { CampoTexto, OpcionCaja } from '@/components/pantallas/Campos'
import { Pantalla } from '@/components/pantallas/Estructura'
import { MarcoCheckout } from '@/components/pantallas/MarcoCheckout'

/** Pantalla 11 · Retiro o entrega — paso 1 de 4. */
export default function PasoEntrega() {
  const { entrega, setEntrega, direccion, setDireccion } = usePedido()
  const router = useRouter()

  return (
    <Pantalla ancho="ancho">
      <MarcoCheckout paso={1} titulo="¿Retiro o entrega?" volverA="/carrito">
        <OpcionCaja
          name="entrega"
          titulo="Retiro en Florida"
          detalle="Dirección de retiro: pendiente de validación."
          seleccionada={entrega === 'retiro'}
          onSelect={() => setEntrega('retiro')}
        />
        <OpcionCaja
          name="entrega"
          titulo="Entrega a domicilio"
          detalle="Zonas y costo de entrega: pendientes de validación."
          seleccionada={entrega === 'domicilio'}
          onSelect={() => setEntrega('domicilio')}
        />

        {/* La dirección sólo se pide si corresponde. */}
        <div className={entrega === 'domicilio' ? '' : 'pointer-events-none opacity-50'}>
          <CampoTexto
            etiqueta="Dirección de entrega"
            placeholder="Calle y número"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            disabled={entrega !== 'domicilio'}
          />
        </div>

        <Boton onClick={() => router.push('/checkout/fecha')}>Continuar</Boton>
      </MarcoCheckout>
    </Pantalla>
  )
}
