import { CabeceraAdmin, SinBackend } from '@/components/admin/Chasis'
import { EditorSecciones } from '@/components/admin/EditorSecciones'
import { faltantesDeBackend, panelOperativo } from '@/lib/supabase/env'
import { exigirAdmin } from '@/server/autorizacion'
import { listarMedios, todasLasSecciones } from '@/server/contenido/repositorio'
import { urlPublica } from '@/server/catalogo/repositorio'

export const metadata = { title: 'Contenido' }

export default async function PaginaContenido() {
  if (!panelOperativo()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  const [secciones, medios] = await Promise.all([todasLasSecciones(), listarMedios()])
  if (!secciones) return <SinBackend faltantes={faltantesDeBackend()} />

  // El editor muestra cada imagen guardada como imagen, no como id: acá se
  // resuelve id → URL pública para todas las que ya existen.
  const mediosPorId: Record<string, string> = {}
  for (const m of medios ?? []) {
    if (m.mime_type.startsWith('image/')) mediosPorId[m.id] = urlPublica(m.path)
  }

  return (
    <>
      <CabeceraAdmin
        titulo="Contenido de la home"
        descripcion="Cada sección tiene sus propios campos. Se guarda como borrador y recién al publicar lo ve el sitio."
      />
      <div className="px-4 py-6 lg:px-8">
        <EditorSecciones secciones={secciones} mediosPorId={mediosPorId} />
      </div>
    </>
  )
}
