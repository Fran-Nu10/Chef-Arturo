'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePedido } from '@/lib/estado-pedido'
import { useProductos } from '@/lib/productos'
import { Boton } from '@/components/ui/Boton'
import { Aviso, Resumen } from '@/components/pantallas/Campos'
import { Pantalla } from '@/components/pantallas/Estructura'
import { MarcoCheckout } from '@/components/pantallas/MarcoCheckout'

const EDITAR =
  'ml-2 inline-flex min-h-[44px] items-center text-[11px] font-medium text-caramelo-texto underline'

/** Pantalla 14 · Resumen del pedido — paso 4 de 4. */
export default function PasoResumen() {
  const { lineas, cantidad, entrega, fecha, franja } = usePedido()
  const router = useRouter()
  const productos = useProductos()

  const porModalidad = lineas.reduce<Record<string, number>>((acc, linea) => {
    const producto = productos.find((p) => p.slug === linea.productoSlug)
    if (!producto) return acc
    acc[producto.modalidad] = (acc[producto.modalidad] ?? 0) + 1
    return acc
  }, {})

  const modalidades =
    Object.entries(porModalidad)
      .map(
        ([m, n]) =>
          `${n} ${m === 'directa' ? 'directa' : m === 'encargo' ? 'por encargo' : 'a cotizar'}`,
      )
      .join(' · ') || '—'

  return (
    <Pantalla ancho="ancho">
      <MarcoCheckout paso={4} titulo="Resumen" volverA="/checkout/datos">
        <Resumen
          filas={[
            {
              k: 'Productos',
              v: <span className="tnum">{cantidad} productos · precios pendientes</span>,
            },
            { k: 'Modalidad', v: modalidades },
            {
              k: 'Entrega',
              v: (
                <>
                  {entrega === 'domicilio' ? 'Entrega a domicilio' : 'Retiro en Florida'}
                  <Link href="/checkout/entrega" className={EDITAR}>
                    editar
                  </Link>
                </>
              ),
            },
            {
              k: 'Fecha',
              v: (
                <>
                  <span className="tnum">{fecha || 'a elegir'}</span>
                  {franja ? ` · franja ${franja === 'manana' ? 'mañana' : 'tarde'}` : ''}
                  <Link href="/checkout/fecha" className={EDITAR}>
                    editar
                  </Link>
                </>
              ),
            },
          ]}
          total="Pendiente de precios"
        />

        <Aviso>
          El encargo puede requerir seña. Te confirmamos disponibilidad y total antes de
          pagar.
        </Aviso>

        <Boton onClick={() => router.push('/checkout/pago')}>Elegir cómo pagar</Boton>
      </MarcoCheckout>
    </Pantalla>
  )
}
