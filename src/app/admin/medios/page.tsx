import { CabeceraAdmin, SinBackend, VacioAdmin } from '@/components/admin/Chasis'
import { Pildora } from '@/components/admin/Tabla'
import { faltantesDeBackend, panelOperativo } from '@/lib/supabase/env'
import { fechaCorta } from '@/lib/etiquetas'
import { exigirAdmin } from '@/server/autorizacion'
import { listarMedios } from '@/server/contenido/repositorio'
import { urlPublica } from '@/server/catalogo/repositorio'

export const metadata = { title: 'Medios' }

export default async function PaginaMedios() {
  if (!panelOperativo()) return <SinBackend faltantes={faltantesDeBackend()} />
  await exigirAdmin()

  const medios = await listarMedios()
  if (!medios) return <SinBackend faltantes={faltantesDeBackend()} />

  return (
    <>
      <CabeceraAdmin
        titulo="Medios"
        descripcion="Los archivos viven en Supabase Storage. Copiá el id para asignarlos a un producto o a una sección."
      />

      <div className="px-4 py-6 lg:px-8">
        {medios.length === 0 ? (
          <VacioAdmin
            titulo="Todavía no hay archivos"
            texto="Subí las fotografías al bucket «media» para poder asignarlas desde el panel."
          />
        ) : (
          <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 lg:grid-cols-4">
            {medios.map((m) => (
              <li key={m.id} className="flex flex-col gap-2 border border-linea bg-papel-alt p-3">
                <div className="relative aspect-[4/5] overflow-hidden bg-crema">
                  {m.mime_type.startsWith('image/') && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={urlPublica(m.path)}
                      alt={m.alt || m.path}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <p className="m-0 truncate font-mono text-[11px] text-tinta-suave" title={m.path}>
                  {m.path}
                </p>
                <p className="m-0 font-mono text-[10px] break-all text-tinta-tenue">{m.id}</p>
                <div className="flex flex-wrap gap-1">
                  {m.is_temporary && <Pildora texto="Temporal" tono="caramelo" />}
                  {m.source !== 'own' && <Pildora texto={m.source} tono="neutro" />}
                </div>
                {m.credit && (
                  <p className="m-0 text-[11px] text-tinta-suave">{m.credit}</p>
                )}
                <p className="m-0 text-[11px] text-tinta-tenue">
                  {m.width && m.height ? `${m.width}×${m.height} · ` : ''}
                  {fechaCorta(m.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
