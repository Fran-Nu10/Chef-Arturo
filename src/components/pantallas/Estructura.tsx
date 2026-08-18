import type { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { BarraCarrito } from '@/components/layout/Carrito'
import { Pie } from '@/components/layout/Pie'

/**
 * Estructura de las pantallas comerciales: header del sitio, contenido en una
 * columna centrada de 640px (la misma medida en todo el checkout) y la barra
 * de carrito siempre recuperable en mobile.
 */
export function Pantalla({
  children,
  ancho = 'columna',
  conCarrito = true,
  conPie = true,
}: {
  children: ReactNode
  /** `columna` para checkout y fichas; `ancho` para catálogos. */
  ancho?: 'columna' | 'ancho'
  conCarrito?: boolean
  conPie?: boolean
}) {
  return (
    <>
      <Header />
      <main className={conCarrito ? 'pb-[52px] lg:pb-0' : ''}>
        {ancho === 'columna' ? (
          <div className="mx-auto w-full max-w-[640px]">{children}</div>
        ) : (
          children
        )}
      </main>
      {conPie && (
        <div className="px-[clamp(16px,3.4vw,48px)] pb-[52px] lg:pb-0">
          <Pie tono="papel" />
        </div>
      )}
      {conCarrito && <BarraCarrito />}
    </>
  )
}

/**
 * Estado vacío o terminal (búsqueda sin resultados, carrito vacío, pago en
 * proceso): arco punteado, título serif y acciones de salida.
 */
export function EstadoCentrado({
  icono,
  titulo,
  texto,
  children,
  bordePunteado = true,
}: {
  icono: ReactNode
  titulo: string
  texto?: string
  children?: ReactNode
  bordePunteado?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-8 py-[clamp(48px,10vw,96px)] text-center">
      <div
        className={`flex h-[170px] w-[140px] items-center justify-center rounded-t-[999px] rounded-b-borde bg-crema text-caramelo ${
          bordePunteado
            ? 'border border-dashed border-caramelo'
            : 'border border-caramelo'
        }`}
      >
        {icono}
      </div>
      <h1 className="m-0 font-display text-2xl font-normal">{titulo}</h1>
      {texto && (
        <p className="m-0 max-w-[360px] text-[13px] leading-relaxed text-tinta-suave">
          {texto}
        </p>
      )}
      {children}
    </div>
  )
}
