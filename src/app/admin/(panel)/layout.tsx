import { redirect } from 'next/navigation'
import { BannerDemo } from '@/components/admin/Chasis'
import { BarraLateral } from '@/components/admin/BarraLateral'
import { panelOperativo } from '@/lib/supabase/env'
import { sesionAdmin } from '@/server/autorizacion'

/**
 * Guard y chasis de las rutas protegidas del panel.
 *
 * La comprobación es server-side y ocurre antes de renderizar: sin sesión
 * administrativa, el HTML de las páginas internas no llega a generarse.
 *
 * `login` y `recuperar` quedan fuera de este grupo a propósito. Un layout que
 * redirige a una ruta que cuelga de sí mismo no puede resolverse: era la causa
 * de la pantalla en blanco al entrar al panel desde la tienda.
 */
export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
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
