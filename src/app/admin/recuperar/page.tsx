import type { Metadata } from 'next'
import { FormularioNuevaContrasena } from '@/components/admin/FormularioNuevaContrasena'
import { Marca } from '@/components/layout/Header'
import { hayBackend } from '@/lib/supabase/env'

export const metadata: Metadata = {
  title: 'Nueva contraseña',
  robots: { index: false },
}

/** Destino del enlace de recuperación que envía Supabase. */
export default function PaginaRecuperar() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-papel px-5 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Marca tamano={30} />
          <p className="m-0 text-[11px] font-semibold tracking-[0.16em] text-caramelo-texto uppercase">
            Nueva contraseña
          </p>
        </div>
        {hayBackend() ? (
          <FormularioNuevaContrasena />
        ) : (
          <p className="border border-caramelo bg-papel-alt p-5 text-[13px] text-tinta-suave">
            El backend no está configurado.
          </p>
        )}
      </div>
    </main>
  )
}
