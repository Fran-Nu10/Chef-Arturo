import type { Metadata, Viewport } from 'next'
import { Archivo, Instrument_Serif } from 'next/font/google'
import { ProveedorPedido } from '@/lib/estado-pedido'
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-UY" className={`${archivo.variable} ${instrumentSerif.variable}`}>
      <body>
        <ProveedorPedido>
          {children}
          <DrawerCarrito />
        </ProveedorPedido>
      </body>
    </html>
  )
}
