'use client'

import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { productoPorSlug } from '@/content/datos'
import { usePedido } from '@/lib/estado-pedido'
import { Boton, BotonEnlace } from '@/components/ui/Boton'
import { IconoCerrar } from '@/components/ui/Iconos'
import { nombreModalidad } from '@/components/ui/TagModalidad'

/**
 * Barra fija inferior de mobile. El carrito siempre debe poder recuperarse:
 * está por encima de todo salvo overlays y respeta la safe area del iPhone.
 */
export function BarraCarrito() {
  const { cantidad } = usePedido()

  return (
    <div className="fixed right-0 bottom-0 left-0 z-70 flex h-[52px] items-center justify-between bg-verde px-[18px] pb-[env(safe-area-inset-bottom)] text-papel shadow-[0_-4px_12px_rgb(20_46_40_/_0.25)] lg:hidden">
      <span className="text-[13px] font-medium">
        Carrito · <span className="tnum">{cantidad}</span> productos
      </span>
      <Link
        href="/carrito"
        className="flex min-h-[44px] items-center text-[13px] font-bold tracking-[0.04em] text-papel no-underline"
      >
        <span className="border-b border-caramelo-claro pb-0.5">Ver carrito</span>
      </Link>
    </div>
  )
}

/**
 * Drawer del carrito — panel lateral de 430px en desktop, panel completo en
 * mobile. Total y precios siempre pendientes de validación.
 */
export function DrawerCarrito() {
  const { lineas, cantidad, carritoAbierto, cerrarCarrito } = usePedido()
  const reducido = useReducedMotion()

  return (
    <AnimatePresence>
      {carritoAbierto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducido ? 0.15 : 0.25 }}
            onClick={cerrarCarrito}
            className="fixed inset-0 z-90 bg-verde-profundo/40"
          />
          <motion.aside
            initial={reducido ? { opacity: 0 } : { x: '100%' }}
            animate={reducido ? { opacity: 1 } : { x: 0 }}
            exit={reducido ? { opacity: 0 } : { x: '100%' }}
            transition={{
              duration: reducido ? 0.15 : 0.35,
              ease: [0.33, 1, 0.68, 1],
            }}
            aria-label="Tu carrito"
            className="fixed top-0 right-0 bottom-0 z-91 flex w-full max-w-[430px] flex-col gap-3.5 border-l border-linea bg-papel px-7 py-6 shadow-[-12px_0_30px_rgb(20_46_40_/_0.25)]"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl">
                Tu carrito{' '}
                <span className="tnum font-sans text-[13px] text-tinta-suave">
                  · {cantidad}
                </span>
              </span>
              <button
                type="button"
                onClick={cerrarCarrito}
                aria-label="Cerrar carrito"
                className="flex h-11 w-11 items-center justify-center border border-linea text-tinta-suave"
              >
                <IconoCerrar size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {lineas.length === 0 && (
                <p className="border-t border-linea pt-6 text-[13px] leading-relaxed text-tinta-suave">
                  Todavía no agregaste productos.
                </p>
              )}
              {lineas.map((linea) => {
                const producto = productoPorSlug(linea.productoSlug)
                if (!producto) return null
                return (
                  <div
                    key={linea.productoSlug}
                    className="grid grid-cols-[70px_1fr_auto] items-center gap-3 border-t border-linea py-3"
                  >
                    <div className="h-[70px] rounded-borde border border-linea bg-crema" />
                    <div className="flex flex-col gap-[3px]">
                      <span className="font-display text-base leading-tight">
                        {producto.nombre}
                      </span>
                      <span className="text-[9.5px] font-semibold tracking-[0.06em] uppercase">
                        <span
                          className={
                            producto.modalidad === 'directa'
                              ? 'text-verde'
                              : 'text-caramelo-texto'
                          }
                        >
                          {nombreModalidad(producto.modalidad)}
                        </span>
                        <span className="tnum text-tinta-suave">
                          {linea.fecha ? ` · ${linea.fecha}` : ` · ×${linea.cantidad}`}
                        </span>
                      </span>
                    </div>
                    <span className="text-[11.5px] font-semibold text-tinta-suave">
                      {producto.precio}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-2.5 border-t border-linea pt-3.5">
              <div className="flex justify-between text-[15px] font-semibold">
                <span>Total</span>
                <span className="text-verde">Pendiente de precios</span>
              </div>
              <BotonEnlace
                href="/checkout/entrega"
                onClick={cerrarCarrito}
                className="w-full"
              >
                Continuar con el pedido
              </BotonEnlace>
              <Boton variante="secundario" compacto onClick={cerrarCarrito}>
                Seguir mirando
              </Boton>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
