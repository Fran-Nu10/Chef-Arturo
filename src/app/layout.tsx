import type { Metadata, Viewport } from 'next'
import { Archivo, Instrument_Serif } from 'next/font/google'
import { ProveedorPedido } from '@/lib/estado-pedido'
import { ProveedorCategorias } from '@/lib/categorias'
import { catalogoPublico } from '@/server/storefront/consultas'
import { DrawerCarrito } from '@/components/layout/Carrito'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--fuente-sans',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--fuente-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Chef Arturo · Pastelería, merienda y lunch para fiestas',
    template: '%s · Chef Arturo',
  },
  description:
    'Pastelería, merienda y lunch para fiestas en Florida, Uruguay. Comprá del día, encargá para una fecha o consultá por tu evento.',
}

export const viewport: Viewport = {
  themeColor: '#f7f3ea',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Se leen acá, en el único punto de servidor por el que pasan todas las
  // pantallas, y bajan por contexto hasta el header.
  const { categorias } = await catalogoPublico()

  return (
    <html lang="es-UY" className={`${archivo.variable} ${instrumentSerif.variable}`}>
      <body>
        <ProveedorCategorias categorias={categorias}>
          <ProveedorPedido>
            {children}
            <DrawerCarrito />
          </ProveedorPedido>
        </ProveedorCategorias>
      </body>
    </html>
  )
}
