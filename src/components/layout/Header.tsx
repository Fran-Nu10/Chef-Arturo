'use client'

import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { CATEGORIAS, NEGOCIO } from '@/content/datos'
import { usePedido } from '@/lib/estado-pedido'
import { IconoCarrito, IconoCerrar, IconoMenu } from '@/components/ui/Iconos'

/** Marca editorial: "CHEF" en versalitas sobre "Arturo" en itálica serif. */
export function Marca({ tamano = 24 }: { tamano?: number }) {
  return (
    <span className="leading-none">
      <span className="block text-[9.5px] font-semibold tracking-[0.3em] text-verde">
        CHEF
      </span>
      <span
        className="font-display text-verde italic"
        style={{ fontSize: `${tamano}px` }}
      >
        Arturo
      </span>
    </span>
  )
}

/**
 * Header sticky. Estado inicial crema y sin línea; al pasar los 40px de scroll
 * se compacta (76 → 58px) y gana hairline y sombra leve.
 * El carrito siempre está accesible, también en mobile.
 */
export function Header() {
  const [compacto, setCompacto] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const { cantidad, abrirCarrito } = usePedido()
  const reducido = useReducedMotion()

  useEffect(() => {
    const alScrollear = () => setCompacto(window.scrollY > 40)
    alScrollear()
    window.addEventListener('scroll', alScrollear, { passive: true })
    return () => window.removeEventListener('scroll', alScrollear)
  }, [])

  // El drawer abierto no debe dejar scrollear el fondo.
  useEffect(() => {
    if (!menuAbierto) return
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previo
    }
  }, [menuAbierto])

  return (
    <>
      <header
        className={`sticky top-0 z-60 flex items-center justify-between bg-papel px-[clamp(14px,3vw,48px)] transition-[height,box-shadow,border-color] duration-300 ${
          compacto
            ? 'h-[58px] border-b border-linea shadow-[0_2px_12px_rgb(26_33_30_/_0.06)]'
            : 'h-[76px] border-b border-transparent'
        }`}
      >
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
          className="flex min-h-[44px] min-w-[44px] items-center text-tinta lg:hidden"
        >
          <IconoMenu size={20} />
        </button>

        <div className="flex items-baseline gap-2.5">
          <Link
            href="/"
            aria-label="Chef Arturo — inicio"
            className="flex min-h-[44px] items-center no-underline"
          >
            <Marca />
          </Link>
          <span className="hidden text-[11px] text-tinta-suave lg:inline">
            {NEGOCIO.autoras}
          </span>
        </div>

        <nav className="hidden gap-[34px] text-sm font-medium lg:flex">
          {CATEGORIAS.map((c) => (
            <Link
              key={c.slug}
              href={`/catalogo/${c.slug}`}
              className="text-tinta no-underline hover:text-verde"
            >
              {c.nombre}
            </Link>
          ))}
          <Link href="/catalogo" className="text-tinta no-underline hover:text-verde">
            Catálogo completo
          </Link>
        </nav>

        <div className="flex items-center gap-[18px]">
          <a
            href={NEGOCIO.whatsapp}
            className="hidden text-[13.5px] font-medium text-verde underline underline-offset-[3px] lg:inline"
          >
            WhatsApp
          </a>
          <button
            type="button"
            onClick={abrirCarrito}
            aria-label={`Ver carrito, ${cantidad} productos`}
            className="relative flex min-h-[44px] min-w-[44px] items-center justify-center text-tinta"
          >
            <IconoCarrito size={21} />
            <span className="tnum absolute top-0.5 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-caramelo text-[10px] font-bold text-papel">
              {cantidad}
            </span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuAbierto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducido ? 0.15 : 0.25 }}
              onClick={() => setMenuAbierto(false)}
              className="fixed inset-0 z-80 bg-verde-profundo/45"
            />
            <motion.nav
              initial={reducido ? { opacity: 0 } : { x: '-100%' }}
              animate={reducido ? { opacity: 1 } : { x: 0 }}
              exit={reducido ? { opacity: 0 } : { x: '-100%' }}
              transition={{
                duration: reducido ? 0.15 : 0.35,
                ease: [0.33, 1, 0.68, 1],
              }}
              className="fixed top-0 bottom-0 left-0 z-81 flex w-[300px] max-w-[85vw] flex-col gap-1 border-r border-linea bg-papel p-5"
              aria-label="Menú principal"
            >
              <div className="mb-[18px] flex items-center justify-between">
                <span className="font-display text-[22px] text-verde italic">Arturo</span>
                <button
                  type="button"
                  onClick={() => setMenuAbierto(false)}
                  aria-label="Cerrar menú"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-linea text-tinta"
                >
                  <IconoCerrar size={16} />
                </button>
              </div>
              {CATEGORIAS.map((c) => (
                <Link
                  key={c.slug}
                  href={`/catalogo/${c.slug}`}
                  onClick={() => setMenuAbierto(false)}
                  className="border-b border-linea py-3.5 text-[15px] font-medium text-tinta no-underline"
                >
                  {c.nombre}
                </Link>
              ))}
              <Link
                href="/catalogo"
                onClick={() => setMenuAbierto(false)}
                className="border-b border-linea py-3.5 text-[15px] font-medium text-tinta no-underline"
              >
                Catálogo completo
              </Link>
              <a
                href={NEGOCIO.whatsapp}
                className="py-4 text-sm font-medium text-verde underline underline-offset-[3px]"
              >
                Pedir por WhatsApp
              </a>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
