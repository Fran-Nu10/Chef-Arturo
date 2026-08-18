'use client'

import { useRouter } from 'next/navigation'
import { usePedido } from '@/lib/estado-pedido'
import { Boton } from '@/components/ui/Boton'
import { CampoTexto } from '@/components/pantallas/Campos'
import { Pantalla } from '@/components/pantallas/Estructura'
import { MarcoCheckout } from '@/components/pantallas/MarcoCheckout'

/** Pantalla 13 · Datos del comprador — paso 3 de 4. */
export default function PasoDatos() {
  const { datos, setDatos } = usePedido()
  const router = useRouter()

  return (
    <Pantalla ancho="ancho">
      <MarcoCheckout paso={3} titulo="Tus datos" volverA="/checkout/fecha">
        <CampoTexto
          etiqueta="Nombre"
          autoComplete="name"
          value={datos.nombre}
          onChange={(e) => setDatos({ nombre: e.target.value })}
        />
        <CampoTexto
          etiqueta="Teléfono (WhatsApp)"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="09_ ___ ___"
          value={datos.telefono}
          onChange={(e) => setDatos({ telefono: e.target.value })}
        />
        <CampoTexto
          etiqueta="Email (opcional)"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tu@email.com"
          value={datos.email}
          onChange={(e) => setDatos({ email: e.target.value })}
        />
        <CampoTexto
          etiqueta="Nota para la cocina (opcional)"
          multilinea
          placeholder="Algo que debamos saber"
          value={datos.nota}
          onChange={(e) => setDatos({ nota: e.target.value })}
        />
        <p className="m-0 text-[11.5px] leading-relaxed text-tinta-suave">
          Usamos tu WhatsApp para confirmar disponibilidad y coordinar el pedido.
        </p>
        <Boton onClick={() => router.push('/checkout/resumen')}>Continuar</Boton>
      </MarcoCheckout>
    </Pantalla>
  )
}
