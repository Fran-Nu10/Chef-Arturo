import { CabeceraAdmin, SinBackend } from '@/components/admin/Chasis'
import { EditorSecciones } from '@/components/admin/EditorSecciones'
import { faltantesDeBackend, hayBackend } from '@/lib/supabase/env'
import { exigirAdmin } from '@/server/autorizacion'
import { todasLasSecciones } from '@/server/contenido/repositorio'

export const metadata = { title: 'Contenido' }

export default async function PaginaContenido() {
  if (!hayBackend()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  const secciones = await todasLasSecciones()
  if (!secciones) return <SinBackend faltantes={faltantesDeBackend()} />

  return (
    <>
      <CabeceraAdmin
        titulo="Contenido de la home"
        descripcion="Cada sección tiene sus propios campos. Se guarda como borrador y recién al publicar lo ve el sitio."
      />
      <div className="px-4 py-6 lg:px-8">
        <EditorSecciones secciones={secciones} />
      </div>
    </>
  )
}
