'use client'

import { useActionState, useState } from 'react'
import {
  alternarSeccion,
  guardarBorradorSeccion,
  publicarSeccion,
} from '@/server/contenido/acciones'
import type { Resultado } from '@/server/catalogo/acciones'
import type { FilaSeccion } from '@/lib/supabase/tipos'
import { CLAVES_SECCION, type ClaveSeccion } from '@/server/contenido/esquemas'
import { BotonGuardar, Feedback } from './Piezas'
import { CamposSeccion } from './CamposSeccion'

const NOMBRES: Record<ClaveSeccion, string> = {
  hero: 'Hero — La Vitrina Viva',
  categorias: 'Elegí tu ocasión',
  mostrador: 'Del mostrador de hoy',
  'detalle-final': 'El detalle final',
  'arma-tu-evento': 'Armá tu evento',
  'fechas-importantes': 'Fechas que importan',
  'formas-de-pedir': 'Formas de pedir',
  'la-mesa': 'La mesa de Chef Arturo',
  'cta-final': 'Cierre',
  footer: 'Footer',
}

/**
 * Secciones que existen en la base pero ya no tienen efecto en el sitio.
 *
 * `mostrador` ("Del mostrador de hoy") quedó obsoleta: la home ahora muestra
 * el catálogo completo agrupado por categoría, directamente desde los
 * productos — sin selección manual. La fila se conserva en `site_sections`
 * para no hacer una migración destructiva, pero editarla no cambiaría nada,
 * así que no se ofrece.
 */
const SECCIONES_OBSOLETAS: string[] = ['mostrador']

export function EditorSecciones({ secciones }: { secciones: FilaSeccion[] }) {
  const visibles = secciones.filter((s) => !SECCIONES_OBSOLETAS.includes(s.key))
  const [abierta, setAbierta] = useState<string | null>(visibles[0]?.key ?? null)

  return (
    <div className="flex flex-col gap-3">
      {visibles
        .slice()
        .sort(
          (a, b) =>
            CLAVES_SECCION.indexOf(a.key as ClaveSeccion) -
            CLAVES_SECCION.indexOf(b.key as ClaveSeccion),
        )
        .map((s) => (
          <SeccionEditable
            key={s.key}
            seccion={s}
            nombre={NOMBRES[s.key as ClaveSeccion] ?? s.key}
            abierta={abierta === s.key}
            onAbrir={() => setAbierta(abierta === s.key ? null : s.key)}
          />
        ))}
    </div>
  )
}

function SeccionEditable({
  seccion,
  nombre,
  abierta,
  onAbrir,
}: {
  seccion: FilaSeccion
  nombre: string
  abierta: boolean
  onAbrir: () => void
}) {
  const [guardado, accionGuardar] = useActionState(guardarBorradorSeccion, {} as Resultado)
  const [publicado, accionPublicar] = useActionState(publicarSeccion, {} as Resultado)
  const [habilitada, setHabilitada] = useState(seccion.is_enabled)
  const [contenido, setContenido] = useState<Record<string, unknown>>(
    (seccion.draft ?? {}) as Record<string, unknown>,
  )

  const sinPublicar =
    JSON.stringify(seccion.draft ?? {}) !== JSON.stringify(seccion.published ?? {})

  return (
    <section className="border border-linea bg-papel-alt">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onAbrir}
          aria-expanded={abierta}
          className="flex min-h-[44px] flex-1 items-center gap-2 text-left text-[15px] font-semibold"
        >
          <span aria-hidden="true" className="font-display text-caramelo">
            {abierta ? '−' : '+'}
          </span>
          {nombre}
        </button>

        <div className="flex items-center gap-2">
          {!seccion.published && (
            <span className="border border-caramelo-texto px-2 py-[3px] text-[10.5px] font-semibold tracking-[0.06em] text-caramelo-texto uppercase">
              Sin publicar
            </span>
          )}
          {seccion.published && sinPublicar && (
            <span className="border border-caramelo px-2 py-[3px] text-[10.5px] font-semibold tracking-[0.06em] text-caramelo-texto uppercase">
              Borrador nuevo
            </span>
          )}
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-[12.5px] font-medium">
            <input
              type="checkbox"
              checked={habilitada}
              onChange={async (e) => {
                setHabilitada(e.target.checked)
                await alternarSeccion(seccion.key, e.target.checked)
              }}
              className="h-4 w-4 accent-[#1e4b40]"
            />
            Visible
          </label>
        </div>
      </div>

      {abierta && (
        <div className="flex flex-col gap-4 border-t border-linea px-4 py-4">
          <CamposSeccion
            clave={seccion.key as ClaveSeccion}
            valor={contenido}
            onCambio={setContenido}
          />

          <form action={accionGuardar} className="flex flex-col gap-3">
            <input type="hidden" name="clave" value={seccion.key} />
            <input type="hidden" name="contenido" value={JSON.stringify(contenido)} />
            <Feedback estado={guardado} />
            <div className="flex flex-wrap gap-2">
              <BotonGuardar variante="secundario">Guardar borrador</BotonGuardar>
            </div>
          </form>

          <form action={accionPublicar} className="flex flex-col gap-3">
            <input type="hidden" name="clave" value={seccion.key} />
            <Feedback estado={publicado} />
            <div className="flex flex-wrap items-center gap-2">
              <BotonGuardar>Publicar</BotonGuardar>
              <span className="text-[12px] text-tinta-suave">
                Publicar hace visible el borrador guardado en el sitio.
              </span>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
