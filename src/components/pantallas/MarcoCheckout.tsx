'use client'

import type { ReactNode } from 'react'
import { productoPorSlug } from '@/content/datos'
import { usePedido } from '@/lib/estado-pedido'
import { Actual, BarraContexto } from '@/components/pantallas/BarraContexto'
import { PasosCheckout } from '@/components/pantallas/PasosCheckout'

/**
 * Marco de los pasos 11–14 del checkout.
 *
 * Una sola columna de 640px sobre papel; desde 1024px el resumen del pedido
 * queda fijo a la derecha. El progreso nunca retrocede por un error de pago.
 */
export function MarcoCheckout({
  paso,
  titulo,
  volverA,
  children,
}: {
  paso: 1 | 2 | 3 | 4
  titulo: string
  volverA: string
  children: ReactNode
}) {
  const { lineas, cantidad, entrega, fecha, franja } = usePedido()

  return (
    <div className="lg:mx-auto lg:grid lg:max-w-[1100px] lg:grid-cols-[640px_1fr] lg:gap-12 lg:px-6">
      <div className="mx-auto w-full max-w-[640px] lg:mx-0">
        <BarraContexto volverA={volverA}>
          <Actual>Tu pedido</Actual>
        </BarraContexto>
        <PasosCheckout paso={paso} />
        <div className="flex flex-col gap-4 px-4 pt-3.5 pb-6 lg:px-0">
          <h1 className="m-0 font-display text-[25px] font-normal">{titulo}</h1>
          {children}
        </div>
      </div>

      {/* Resumen lateral: sólo desktop, siempre a la vista. */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 mt-14 flex flex-col gap-3 border border-linea bg-papel-alt p-5">
          <h2 className="m-0 font-display text-xl font-normal">Tu pedido</h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {lineas.map((linea) => {
              const producto = productoPorSlug(linea.productoSlug)
              if (!producto) return null
              return (
                <li
                  key={linea.productoSlug}
                  className="flex justify-between gap-3 border-b border-linea pb-2 text-[12.5px]"
                >
                  <span>
                    {producto.nombre}
                    <span className="tnum text-tinta-suave"> ×{linea.cantidad}</span>
                  </span>
                  <span className="text-tinta-suave">{producto.precio}</span>
                </li>
              )
            })}
          </ul>
          <dl className="m-0 flex flex-col gap-1 text-[12.5px]">
            <div className="flex justify-between gap-3">
              <dt className="text-tinta-suave">Productos</dt>
              <dd className="tnum m-0">{cantidad}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-tinta-suave">Entrega</dt>
              <dd className="m-0">
                {entrega === 'retiro'
                  ? 'Retiro en Florida'
                  : entrega === 'domicilio'
                    ? 'Entrega a domicilio'
                    : 'A definir'}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-tinta-suave">Fecha</dt>
              <dd className="tnum m-0">
                {fecha || '—'}
                {franja ? ` · ${franja === 'manana' ? 'mañana' : 'tarde'}` : ''}
              </dd>
            </div>
          </dl>
          <div className="flex justify-between gap-3 border-t border-linea pt-2 text-sm font-semibold">
            <span>Total</span>
            <span className="text-verde">Pendiente de precios</span>
          </div>
        </div>
      </aside>
    </div>
  )
}
