'use client'

import { useActionState, useState } from 'react'
import { guardarCategoria, type Resultado } from '@/server/catalogo/acciones'
import type { FilaCategoria } from '@/lib/supabase/tipos'
import { AreaTexto, BotonGuardar, Campo, Casilla, Entrada, Feedback } from './Piezas'

export function EditorCategorias({ categorias }: { categorias: FilaCategoria[] }) {
  const [creando, setCreando] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      {categorias.map((c) => (
        <FormularioCategoria key={c.id} categoria={c} />
      ))}

      {creando ? (
        <FormularioCategoria onCancelar={() => setCreando(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="inline-flex min-h-[44px] w-fit items-center border border-verde px-5 text-[13.5px] font-semibold text-verde"
        >
          Nueva categoría
        </button>
      )}
    </div>
  )
}

function FormularioCategoria({
  categoria,
  onCancelar,
}: {
  categoria?: FilaCategoria
  onCancelar?: () => void
}) {
  const [estado, accion] = useActionState(guardarCategoria, {} as Resultado)
  const error = (campo: string) => estado.errores?.[campo]

  return (
    <form action={accion} className="flex flex-col gap-4 border border-linea bg-papel-alt p-4">
      {categoria && <input type="hidden" name="id" value={categoria.id} />}
      <h2 className="m-0 font-display text-lg font-normal">
        {categoria ? categoria.name : 'Nueva categoría'}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" error={error('name')}>
          <Entrada name="name" required defaultValue={categoria?.name ?? ''} />
        </Campo>
        <Campo etiqueta="Slug" ayuda="Aparece en la URL." error={error('slug')}>
          <Entrada name="slug" required defaultValue={categoria?.slug ?? ''} />
        </Campo>
        <Campo etiqueta="Orden" error={error('position')}>
          <Entrada name="position" type="number" min={0} defaultValue={categoria?.position ?? 0} />
        </Campo>
        <Campo etiqueta="Id de imagen" ayuda="Copialo desde Medios." error={error('imageId')}>
          <Entrada name="imageId" defaultValue={categoria?.image_id ?? ''} />
        </Campo>
      </div>

      <Campo etiqueta="Descripción" error={error('description')}>
        <AreaTexto name="description" rows={2} defaultValue={categoria?.description ?? ''} />
      </Campo>

      <Casilla etiqueta="Activa" name="isActive" defaultChecked={categoria?.is_active ?? true} />

      <Feedback estado={estado} />
      <div className="flex flex-wrap gap-2">
        <BotonGuardar>{categoria ? 'Guardar' : 'Crear categoría'}</BotonGuardar>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="min-h-[44px] px-3 text-[13px] font-medium text-tinta-suave underline"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
