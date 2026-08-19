import { CabeceraAdmin, SinBackend } from '@/components/admin/Chasis'
import { faltantesDeBackend, hayBackend } from '@/lib/supabase/env'
import { exigirOwner } from '@/server/autorizacion'
import {
  faltantesDeMercadoPago,
  mercadoPagoConfigurado,
  modoMercadoPago,
} from '@/server/pagos/mercadopago'

export const metadata = { title: 'Ajustes' }

/**
 * Configuración crítica. Sólo el dueño: `exigirOwner` redirige a un `staff`
 * antes de renderizar, y RLS rechazaría la escritura de todos modos.
 */
export default async function PaginaAjustes() {
  if (!hayBackend()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirOwner()

  const modo = modoMercadoPago()
  const faltan = faltantesDeMercadoPago()

  return (
    <>
      <CabeceraAdmin
        titulo="Ajustes"
        descripcion="Configuración del sistema. Sólo accesible para el dueño."
      />

      <div className="flex flex-col gap-6 px-4 py-6 lg:px-8">
        <section className="flex flex-col gap-3 border border-linea bg-papel-alt p-4">
          <h2 className="m-0 font-display text-xl font-normal">Mercado Pago</h2>
          <p className="m-0 text-[13px]">
            Estado:{' '}
            <strong>
              {modo === 'deshabilitado'
                ? 'pendiente de configuración'
                : modo === 'prueba'
                  ? 'modo prueba (los cobros no son reales)'
                  : 'producción'}
            </strong>
          </p>
          {!mercadoPagoConfigurado() && (
            <>
              <p className="m-0 text-[13px] leading-relaxed text-tinta-suave">
                Faltan estas variables de entorno del servidor:
              </p>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {faltan.map((v) => (
                  <li key={v} className="font-mono text-[12px] text-caramelo-texto">
                    {v}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="m-0 text-[12.5px] leading-relaxed text-tinta-suave">
            Las credenciales se cargan como variables de entorno, nunca en la base
            de datos ni en el repositorio. El procedimiento completo está en{' '}
            <code className="bg-crema px-1">docs/MERCADO_PAGO.md</code>.
          </p>
        </section>

        <section className="flex flex-col gap-3 border border-linea bg-papel-alt p-4">
          <h2 className="m-0 font-display text-xl font-normal">Administradores</h2>
          <p className="m-0 text-[13px] leading-relaxed text-tinta-suave">
            No hay alta pública de administradores. Las cuentas se crean desde el panel
            de Supabase con la clave de servicio, siguiendo{' '}
            <code className="bg-crema px-1">docs/ADMIN_BOOTSTRAP.md</code>. El rol vive en
            la tabla <code className="bg-crema px-1">admin_users</code> y no en la metadata
            del usuario, que el propio usuario podría editar.
          </p>
        </section>
      </div>
    </>
  )
}
