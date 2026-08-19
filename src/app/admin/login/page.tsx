import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FormularioLogin } from '@/components/admin/FormularioLogin'
import { Marca } from '@/components/layout/Header'
import { faltantesDeBackend, modoDemo, panelOperativo } from '@/lib/supabase/env'
import { sesionAdmin } from '@/server/autorizacion'

export const metadata: Metadata = { title: 'Panel · Ingresar', robots: { index: false } }

/**
 * Ingreso al panel. No hay registro: las cuentas las crea un humano con la
 * clave de servicio (docs/ADMIN_BOOTSTRAP.md).
 */
export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  // `sesionAdmin()` ya devuelve null sin backend y sin sesión de demostración,
  // así que sirve para los dos modos.
  if (await sesionAdmin()) redirect('/admin')

  return (
    <main className="flex min-h-screen items-center justify-center bg-papel px-5 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Marca tamano={30} />
          <p className="m-0 text-[11px] font-semibold tracking-[0.16em] text-caramelo-texto uppercase">
            Panel de administración
          </p>
        </div>

        {modoDemo() && (
          <div className="mb-4 border border-caramelo bg-caramelo/[0.10] p-4">
            <p className="m-0 text-[13px] font-semibold text-caramelo-texto">
              Modo demostración
            </p>
            <p className="mt-1.5 mb-0 text-[12.5px] leading-relaxed text-tinta-suave">
              Supabase todavía no está conectado. Entrá con cualquier email y
              cualquier contraseña para recorrer el panel con datos de ejemplo.
              Nada de lo que hagas se guarda.
            </p>
          </div>
        )}

        {panelOperativo() ? (
          <FormularioLogin errorInicial={error} />
        ) : (
          <div className="border border-caramelo bg-papel-alt p-5">
            <h1 className="m-0 font-display text-xl font-normal">
              Backend sin configurar
            </h1>
            <p className="mt-2 mb-3 text-[13px] leading-relaxed text-tinta-suave">
              El panel necesita conexión con Supabase. Faltan estas variables de
              entorno:
            </p>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {faltantesDeBackend().map((v) => (
                <li key={v} className="font-mono text-[12px] text-caramelo-texto">
                  {v}
                </li>
              ))}
            </ul>
            <p className="mt-3 mb-0 text-[12px] leading-relaxed text-tinta-suave">
              Copiá <code className="bg-crema px-1">.env.example</code> a{' '}
              <code className="bg-crema px-1">.env.local</code> y completalas. El
              procedimiento está en <code className="bg-crema px-1">docs/BACKEND.md</code>.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
