'use client'

import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useId, useRef } from 'react'
import { resolverCarrito, resumenDePrecios, type LineaResuelta } from '@/lib/carrito'
import { usePedido } from '@/lib/estado-pedido'
import { useProductos } from '@/lib/productos'
import { formatearImporte } from '@/server/dinero'
import { Boton } from '@/components/ui/Boton'
import { IconoCarrito, IconoCerrar } from '@/components/ui/Iconos'
import { MediaPendiente } from '@/components/ui/MediaPendiente'
import { nombreModalidad } from '@/components/ui/TagModalidad'

/**
 * Barra fija inferior de mobile.
 *
 * Abre el mismo carrito que el header. Antes navegaba a `/carrito`, una
 * pantalla aparte que repetía el resumen sin mostrar las líneas: un cambio de
 * página para ver algo que ya estaba en memoria.
 */
export function BarraCarrito() {
  const { cantidad, hidratado, abrirCarrito } = usePedido()

  return (
    <div className="fixed right-0 bottom-0 left-0 z-70 flex min-h-[52px] items-center justify-between bg-verde px-[18px] pb-[env(safe-area-inset-bottom)] text-papel shadow-[0_-4px_12px_rgb(20_46_40_/_0.25)] lg:hidden">
      <span className="text-[13px] font-medium">
        {hidratado ? (
          <>
            Carrito · <span className="tnum">{cantidad}</span>{' '}
            {cantidad === 1 ? 'producto' : 'productos'}
          </>
        ) : (
          'Carrito'
        )}
      </span>
      <button
        type="button"
        onClick={abrirCarrito}
        className="flex min-h-[44px] items-center text-[13px] font-bold tracking-[0.04em] text-papel"
      >
        <span className="border-b border-caramelo-claro pb-0.5">Ver carrito</span>
      </button>
    </div>
  )
}

// ── Piezas ──────────────────────────────────────────────────────────────────

function Cantidad({
  linea,
  nombre,
}: {
  linea: LineaResuelta['linea']
  nombre: string
}) {
  const { cambiarCantidad, quitar } = usePedido()
  const paso = (delta: number) => {
    const nueva = linea.cantidad + delta
    if (nueva <= 0) quitar(linea.productoSlug)
    else cambiarCantidad(linea.productoSlug, nueva)
  }

  return (
    <div className="flex w-fit items-center border border-linea-fuerte">
      <button
        type="button"
        onClick={() => paso(-1)}
        aria-label={
          linea.cantidad === 1
            ? `Quitar ${nombre} del carrito`
            : `Quitar una unidad de ${nombre}`
        }
        className="flex h-11 w-11 items-center justify-center text-base font-semibold text-tinta"
      >
        −
      </button>
      <span
        className="tnum w-8 text-center text-[13px] font-semibold"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="sr-only">{nombre}: </span>
        {linea.cantidad}
      </span>
      <button
        type="button"
        onClick={() => paso(1)}
        aria-label={`Agregar una unidad de ${nombre}`}
        className="flex h-11 w-11 items-center justify-center text-base font-semibold text-tinta"
      >
        +
      </button>
    </div>
  )
}

/** Una línea: foto, nombre, modalidad, cantidad y precio. Card compacta. */
function Linea({ item }: { item: LineaResuelta }) {
  const { quitar } = usePedido()
  const { producto, linea, unitario, total } = item

  return (
    <li className="flex gap-3 border-b border-linea py-3.5 last:border-b-0">
      <MediaPendiente
        etiqueta={producto.imagenPendiente}
        fotoUrl={producto.imagenUrl}
        fotoAlt={producto.imagenAlt || producto.nombre}
        slot={`producto-${producto.slug}`}
        sizes="80px"
        ratio="1/1"
        conBorde={false}
        className="h-20 w-20 flex-none border border-linea text-[9px]"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={`/producto/${producto.slug}`}
          className="font-display text-[16px] leading-tight text-tinta no-underline"
        >
          {producto.nombre}
        </Link>
        <span
          className={`text-[10px] font-semibold tracking-[0.06em] uppercase ${
            producto.modalidad === 'directa' ? 'text-verde' : 'text-caramelo-texto'
          }`}
        >
          {nombreModalidad(producto.modalidad)}
          {linea.fecha ? ` · ${linea.fecha}` : ''}
        </span>
        <div className="mt-0.5 flex items-center gap-3">
          <Cantidad linea={linea} nombre={producto.nombre} />
          <button
            type="button"
            onClick={() => quitar(linea.productoSlug)}
            className="min-h-[44px] text-[11.5px] font-medium text-alerta underline underline-offset-2"
          >
            Quitar
          </button>
        </div>
      </div>

      <div className="flex flex-none flex-col items-end justify-start gap-0.5 text-right">
        {total === null ? (
          <span className="text-[11px] font-semibold text-caramelo-texto">
            A consultar
          </span>
        ) : (
          <>
            <span className="tnum text-[13px] font-semibold text-tinta">
              {formatearImporte(total)}
            </span>
            {linea.cantidad > 1 && unitario !== null && (
              <span className="tnum text-[10.5px] text-tinta-suave">
                {formatearImporte(unitario)} c/u
              </span>
            )}
          </>
        )}
      </div>
    </li>
  )
}

function Esqueleto() {
  return (
    <ul className="m-0 list-none p-0" aria-hidden="true">
      {[0, 1].map((i) => (
        <li key={i} className="flex gap-3 border-b border-linea py-3.5">
          <div className="h-20 w-20 flex-none animate-pulse bg-crema" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <div className="h-4 w-3/4 animate-pulse bg-crema" />
            <div className="h-3 w-1/3 animate-pulse bg-crema" />
            <div className="mt-1 h-9 w-28 animate-pulse bg-crema" />
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── Contenido, compartido por el drawer y por /carrito ──────────────────────

/**
 * El carrito en sí. Lo usan el drawer y la página `/carrito`, para que no
 * existan dos interfaces distintas del mismo carrito.
 */
export function ContenidoCarrito({
  onSeguirComprando,
  onIrAlPedido,
}: {
  onSeguirComprando?: () => void
  onIrAlPedido?: () => void
}) {
  const { lineas, hidratado } = usePedido()
  const productos = useProductos()
  const carrito = resolverCarrito(lineas, productos)
  const precios = resumenDePrecios(carrito)

  if (!hidratado) {
    return (
      <div className="flex-1 overflow-y-auto px-5" role="status" aria-live="polite">
        <span className="sr-only">Cargando tu carrito…</span>
        <Esqueleto />
      </div>
    )
  }

  if (carrito.lineas.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-12 text-center">
        <div className="flex h-[110px] w-[110px] items-center justify-center rounded-borde border border-dashed border-caramelo bg-crema text-caramelo">
          <IconoCarrito size={30} strokeWidth={1.4} />
        </div>
        <h3 className="m-0 font-display text-[22px] font-normal text-verde">
          Tu carrito está vacío
        </h3>
        <p className="m-0 max-w-[34ch] text-[13px] leading-relaxed text-tinta-suave">
          Todavía no agregaste nada. Volvé a la tienda y elegí algo rico.
        </p>
        <Link
          href="/catalogo"
          onClick={onSeguirComprando}
          className="inline-flex min-h-[48px] items-center justify-center border border-verde bg-verde px-6 text-sm font-semibold text-papel no-underline"
        >
          Explorar productos
        </Link>
        {carrito.huerfanos.length > 0 && <AvisoHuerfanos cuantos={carrito.huerfanos.length} />}
      </div>
    )
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-5">
        <ul className="m-0 list-none p-0">
          {carrito.lineas.map((item) => (
            <Linea key={item.linea.productoSlug} item={item} />
          ))}
        </ul>
        {carrito.huerfanos.length > 0 && (
          <div className="pb-4">
            <AvisoHuerfanos cuantos={carrito.huerfanos.length} />
          </div>
        )}
      </div>

      <div className="flex flex-none flex-col gap-2.5 border-t border-linea bg-papel-alt px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {precios.subtotal && (
          <div className="flex justify-between text-[14px]">
            <span className="text-tinta-suave">Subtotal</span>
            <span className="tnum font-semibold text-tinta">{precios.subtotal}</span>
          </div>
        )}
        <div className="flex justify-between text-[13px] text-tinta-suave">
          <span>Entrega</span>
          <span>Se coordina en el siguiente paso</span>
        </div>
        {precios.nota && (
          <p className="m-0 text-[12px] leading-relaxed text-caramelo-texto">
            {precios.nota}
          </p>
        )}

        <Link
          href="/checkout/entrega"
          onClick={onIrAlPedido}
          className="inline-flex min-h-[50px] items-center justify-center border border-verde bg-verde px-6 text-center text-sm font-semibold text-papel no-underline"
        >
          Continuar con el pedido
        </Link>
        {onSeguirComprando ? (
          <Boton variante="secundario" compacto onClick={onSeguirComprando}>
            Seguir comprando
          </Boton>
        ) : (
          <Link
            href="/catalogo"
            className="inline-flex min-h-[44px] items-center justify-center border border-verde px-6 text-center text-sm font-medium text-verde no-underline"
          >
            Seguir comprando
          </Link>
        )}
      </div>
    </>
  )
}

/** Una línea guardada cuyo producto ya no está. Se dice; no se borra callado. */
function AvisoHuerfanos({ cuantos }: { cuantos: number }) {
  return (
    <p className="m-0 border border-dashed border-linea-fuerte px-3 py-2.5 text-[12px] leading-relaxed text-tinta-suave">
      {cuantos === 1
        ? 'Un producto que tenías guardado ya no está disponible y no se muestra.'
        : `${cuantos} productos que tenías guardados ya no están disponibles y no se muestran.`}{' '}
      Escribinos si querías ese pedido.
    </p>
  )
}

// ── Drawer ──────────────────────────────────────────────────────────────────

/**
 * Drawer del carrito: panel lateral en desktop, hoja inferior en mobile.
 *
 * Es un diálogo modal de verdad: atrapa el foco, cierra con Escape y con clic
 * en el fondo, bloquea el scroll de atrás y devuelve el foco a donde estaba.
 */
export function DrawerCarrito() {
  const { cantidad, hidratado, carritoAbierto, cerrarCarrito } = usePedido()
  const reducido = useReducedMotion()
  const panel = useRef<HTMLDivElement>(null)
  const abrioDesde = useRef<HTMLElement | null>(null)
  const tituloId = useId()

  // Bloqueo del scroll de fondo + foco.
  useEffect(() => {
    if (!carritoAbierto) return

    abrioDesde.current = document.activeElement as HTMLElement | null
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // El primer foco va al panel, no al botón de cerrar: así el lector empieza
    // por el título del diálogo.
    panel.current?.focus()

    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cerrarCarrito()
        return
      }
      if (e.key !== 'Tab' || !panel.current) return

      const focos = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focos.length === 0) return
      const primero = focos[0]
      const ultimo = focos[focos.length - 1]
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alTeclado)
    return () => {
      document.removeEventListener('keydown', alTeclado)
      document.body.style.overflow = previo
      abrioDesde.current?.focus?.()
    }
  }, [carritoAbierto, cerrarCarrito])

  return (
    <AnimatePresence>
      {carritoAbierto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: 'none' }}
            transition={{ duration: reducido ? 0.12 : 0.22 }}
            onClick={cerrarCarrito}
            aria-hidden="true"
            className="fixed inset-0 z-90 bg-verde-profundo/40"
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            tabIndex={-1}
            initial={reducido ? { opacity: 0 } : { y: '100%' }}
            animate={reducido ? { opacity: 1 } : { y: 0 }}
            exit={reducido ? { opacity: 0 } : { y: '100%' }}
            transition={{ duration: reducido ? 0.12 : 0.3, ease: [0.33, 1, 0.68, 1] }}
            // Hoja inferior en mobile, panel lateral desde `sm`. La animación
            // de entrada es la misma en los dos: en desktop el panel llega
            // desde abajo del borde derecho, que a esa altura no se nota.
            className="fixed inset-x-0 bottom-0 z-91 flex max-h-[90dvh] flex-col rounded-t-[14px] border border-linea bg-papel outline-none sm:top-0 sm:right-0 sm:bottom-0 sm:left-auto sm:max-h-none sm:w-[min(430px,92vw)] sm:rounded-none sm:border-y-0 sm:border-l"
          >
            {/* Indicador de arrastre. Sólo en la hoja inferior. */}
            <div
              aria-hidden="true"
              className="mx-auto mt-2.5 h-1 w-10 flex-none rounded-full bg-linea-fuerte sm:hidden"
            />

            <div className="flex flex-none items-center justify-between border-b border-linea px-5 py-3.5">
              <h2
                id={tituloId}
                className="m-0 flex items-baseline gap-2 font-display text-[22px] font-normal text-verde"
              >
                Tu carrito
                {hidratado && cantidad > 0 && (
                  <span className="tnum font-sans text-[12.5px] font-medium text-tinta-suave">
                    {cantidad} {cantidad === 1 ? 'producto' : 'productos'}
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={cerrarCarrito}
                aria-label="Cerrar carrito"
                className="flex h-11 w-11 flex-none items-center justify-center border border-linea text-tinta-suave"
              >
                <IconoCerrar size={16} />
              </button>
            </div>

            <ContenidoCarrito
              onSeguirComprando={cerrarCarrito}
              onIrAlPedido={cerrarCarrito}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
