import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FormularioLogin } from '@/components/admin/FormularioLogin'
import { Marca } from '@/components/layout/Header'
import { hayBackend, faltantesDeBackend } from '@/lib/supabase/env'
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

  if (hayBackend() && (await sesionAdmin())) redirect('/admin')

  return (
    <main className="flex min-h-screen items-center justify-center bg-papel px-5 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Marca tamano={30} />
          <p className="m-0 text-[11px] font-semibold tracking-[0.16em] text-caramelo-texto uppercase">
            Panel de administración
          </p>
        </div>

        {hayBackend() ? (
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
