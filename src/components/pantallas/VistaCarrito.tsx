'use client'

import { NEGOCIO, productoPorSlug } from '@/content/datos'
import { usePedido } from '@/lib/estado-pedido'
import { BotonEnlace } from '@/components/ui/Boton'
import { IconoCarrito } from '@/components/ui/Iconos'
import { MediaPendiente } from '@/components/ui/MediaPendiente'
import { nombreModalidad } from '@/components/ui/TagModalidad'
import { Actual, BarraContexto } from '@/components/pantallas/BarraContexto'
import { EstadoCentrado } from '@/components/pantallas/Estructura'

/**
 * Pantallas 9 y 10 · Carrito.
 *
 * Ni el subtotal ni el total afirman un número: los precios están pendientes de
 * validación y la entrega se define en el paso siguiente.
 */
export function VistaCarrito() {
  const { lineas, cantidad, cambiarCantidad, quitar } = usePedido()

  if (lineas.length === 0) {
    return (
      <>
        <BarraContexto volverA="/catalogo">
          <Actual>Tu carrito</Actual>
        </BarraContexto>
        <EstadoCentrado
          icono={<IconoCarrito size={34} strokeWidth={1.4} />}
          titulo="La vitrina te espera"
          texto="Todavía no agregaste productos. Mirá lo de hoy o encargá para tu fecha."
        >
          <BotonEnlace href="/catalogo">Ver catálogo</BotonEnlace>
          <BotonEnlace href={NEGOCIO.whatsapp} variante="secundario" compacto>
            Pedir por WhatsApp
          </BotonEnlace>
        </EstadoCentrado>
      </>
    )
  }

  return (
    <>
      <BarraContexto volverA="/catalogo">
        <Actual>Tu carrito</Actual>
        <span className="tnum">· {cantidad} productos</span>
      </BarraContexto>

      <div className="flex flex-col px-4 pb-6">
        {lineas.map((linea) => {
          const producto = productoPorSlug(linea.productoSlug)
          if (!producto) return null
          const porEncargo = producto.modalidad === 'encargo'
          return (
            <div
              key={linea.productoSlug}
              className="grid grid-cols-[84px_1fr_auto] items-center gap-3.5 border-b border-linea py-3.5"
            >
              <MediaPendiente
                etiqueta={producto.imagenPendiente}
                slot={`producto-${producto.slug}`}
                sizes="84px"
                className="h-[84px] text-[9px]"
              />
              <div className="flex flex-col gap-1">
                <span className="font-display text-[17px] leading-tight">
                  {producto.nombre}
                </span>
                <span
                  className={`text-[10px] font-semibold tracking-[0.06em] uppercase ${
                    porEncargo ? 'text-caramelo-texto' : 'text-verde'
                  }`}
                >
                  {nombreModalidad(producto.modalidad)}
                </span>
                {porEncargo ? (
                  <span className="w-fit border border-dashed border-caramelo px-2 py-[5px] text-[11px] font-medium text-caramelo-texto">
                    {linea.fecha ?? 'Fecha a elegir'} — anticipación por confirmar
                  </span>
                ) : (
                  <div className="flex w-fit items-center border border-linea-fuerte">
                    <button
                      type="button"
                      onClick={() =>
                        cambiarCantidad(linea.productoSlug, linea.cantidad - 1)
                      }
                      aria-label={`Quitar una unidad de ${producto.nombre}`}
                      className="h-11 w-11 text-base font-semibold"
                    >
                      −
                    </button>
                    <span className="tnum w-7 text-center text-[13px] font-semibold">
                      {linea.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        cambiarCantidad(linea.productoSlug, linea.cantidad + 1)
                      }
                      aria-label={`Agregar una unidad de ${producto.nombre}`}
                      className="h-11 w-11 text-base font-semibold"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs font-semibold text-tinta-suave">
                  {producto.precio}
                </span>
                <button
                  type="button"
                  onClick={() => quitar(linea.productoSlug)}
                  className="min-h-[44px] text-[11.5px] font-medium text-alerta underline underline-offset-2"
                >
                  Quitar
                </button>
              </div>
            </div>
          )
        })}

        <div className="flex flex-col gap-2 border-b border-linea py-4">
          <div className="flex justify-between text-[13px] text-tinta-suave">
            <span>Subtotal</span>
            <span>Pendiente de precios</span>
          </div>
          <div className="flex justify-between text-[13px] text-tinta-suave">
            <span>Entrega</span>
            <span>Se define en el siguiente paso</span>
          </div>
          <div className="flex justify-between text-[15px] font-semibold">
            <span>Total</span>
            <span className="text-verde">Pendiente</span>
          </div>
          <p className="m-0 text-[11.5px] text-caramelo-texto">
            El pedido por encargo puede requerir seña. Se confirma antes del pago.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <BotonEnlace href="/checkout/entrega">Continuar</BotonEnlace>
          <BotonEnlace href="/catalogo" variante="secundario" compacto>
            Seguir mirando la vitrina
          </BotonEnlace>
        </div>
      </div>
    </>
  )
}
