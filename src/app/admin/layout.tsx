import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { BannerDemo } from '@/components/admin/Chasis'
import { BarraLateral } from '@/components/admin/BarraLateral'
import { panelOperativo } from '@/lib/supabase/env'
import { sesionAdmin } from '@/server/autorizacion'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel Chef Arturo' },
  robots: { index: false, follow: false },
}

/**
 * Layout protegido de todo `/admin`.
 *
 * La comprobación es server-side y ocurre antes de renderizar: sin sesión
 * administrativa, el HTML de las páginas internas no llega a generarse.
 * `/admin/login` queda fuera porque tiene su propio layout de página completa.
 */
export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const cabeceras = await headers()
  // Sólo `x-pathname`, que el middleware sobrescribe en cada petición. El
  // fallback anterior leía `x-invoke-path`, que nadie escribe de nuestro lado
  // y por lo tanto podía llegar desde el cliente: bastaba mandarlo apuntando
  // al login para saltarse este chasis. No era explotable —cada página exige
  // sesión por su cuenta— pero un guard no debe depender de algo que el
  // visitante puede escribir.
  const ruta = cabeceras.get('x-pathname') ?? ''

  // El login y la recuperación se sirven sin chasis ni sesión.
  if (ruta.startsWith('/admin/login') || ruta.startsWith('/admin/recuperar')) {
    return children
  }

  if (!panelOperativo()) {
    // Sin backend no hay sesión posible: se muestra el aviso desde la propia
    // página, que sabe qué falta. No se simula un panel operativo.
    return <div className="min-h-screen bg-papel">{children}</div>
  }

  const sesion = await sesionAdmin()
  if (!sesion) redirect('/admin/login')

  // El banner envuelve todo el panel, no cada página: así ninguna ruta puede
  // quedarse sin él por olvido.
  return (
    <div className="min-h-screen bg-papel">
      {sesion.esDemo && <BannerDemo />}
      <div className="lg:flex">
        <BarraLateral sesion={sesion} />
        <div className="min-w-0 flex-1 lg:h-screen lg:overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
