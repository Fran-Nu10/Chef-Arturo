'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import {
  actualizarCategoria,
  crearCategoria,
  type Resultado,
} from '@/server/catalogo/acciones'
import type { FilaCategoria } from '@/lib/supabase/tipos'
import { SubidorImagen, useSubidorImagen, type ImagenExistente } from './SubidorImagen'
import {
  AreaTexto,
  AvisoSinGuardar,
  BotonGuardar,
  Campo,
  Casilla,
  Entrada,
  Feedback,
} from './Piezas'

/**
 * Alta y edición de una categoría: foto, nombre, descripción y visibilidad.
 *
 * Sin slug, sin orden numérico, sin id de imagen. El slug se genera del
 * nombre al crear y se conserva al editar; el orden se maneja en la lista;
 * la foto se sube desde acá con el mismo subidor de los productos.
 */
export function FormularioCategoria({
  categoria,
  imagenActual = null,
}: {
  categoria?: FilaCategoria
  imagenActual?: ImagenExistente | null
}) {
  const esNueva = !categoria
  const router = useRouter()
  const [estado, despachar] = useActionState(
    esNueva ? crearCategoria : actualizarCategoria,
    {} as Resultado,
  )
  const subidor = useSubidorImagen({ carpeta: 'categorias', imagenActual })

  useEffect(() => {
    if (esNueva && estado.ok && estado.id) {
      router.replace('/admin/categorias?creada=1')
    }
  }, [esNueva, estado, router])

  useEffect(() => {
    if (estado.ok) subidor.confirmarGuardado()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sólo al guardar
  }, [estado])

  async function enviar(datos: FormData) {
    const listo = await subidor.prepararEnvio(datos)
    if (!listo) return
    despachar(datos)
  }

  const error = (campo: string) => estado.errores?.[campo]

  return (
    <form
      id="form-categoria"
      action={enviar}
      className="mx-auto flex w-full max-w-[720px] flex-col gap-6"
    >
      {categoria && <input type="hidden" name="id" value={categoria.id} />}

      <SubidorImagen
        control={subidor}
        etiqueta="Foto de la categoría"
        ayuda="Se muestra en la portada de la tienda. JPG, PNG, WebP o AVIF, hasta 10 MB."
      />

      <Campo etiqueta="Nombre" error={error('name')}>
        <Entrada name="name" required maxLength={120} defaultValue={categoria?.name ?? ''} />
      </Campo>

      <Campo
        etiqueta="Descripción"
        ayuda="Una frase corta que acompaña a la categoría en la tienda."
        error={error('description')}
      >
        <AreaTexto
          name="description"
          rows={2}
          maxLength={600}
          defaultValue={categoria?.description ?? ''}
        />
      </Campo>

      <Casilla
        etiqueta="Visible en la tienda"
        name="visible"
        defaultChecked={categoria?.is_active ?? true}
      />

      <details className="border border-linea bg-papel-alt">
        <summary className="flex min-h-[48px] cursor-pointer items-center px-4 text-[13.5px] font-semibold select-none">
          Más opciones
        </summary>
        <div className="flex flex-col gap-4 border-t border-linea p-4">
          <Campo etiqueta="Título para buscadores" error={error('seoTitle')}>
            <Entrada name="seoTitle" maxLength={120} defaultValue={categoria?.seo_title ?? ''} />
          </Campo>
          <Campo etiqueta="Descripción para buscadores" error={error('seoDescription')}>
            <AreaTexto
              name="seoDescription"
              rows={2}
              maxLength={300}
              defaultValue={categoria?.seo_description ?? ''}
            />
          </Campo>
        </div>
      </details>

      <div className="sticky bottom-0 z-20 -mx-1 flex flex-col gap-2 border-t border-linea bg-papel px-1 py-3">
        <AvisoSinGuardar formId="form-categoria" />
        <Feedback
          estado={estado}
          mensajeOk={esNueva ? 'Categoría creada.' : 'Cambios guardados.'}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/categorias"
            className="inline-flex min-h-[44px] items-center px-3 text-[13px] font-medium text-tinta-suave underline underline-offset-[3px]"
          >
            Cancelar
          </Link>
          {categoria?.is_active && (
            <Link
              href={`/catalogo/${categoria.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center border border-linea-fuerte px-4 text-[13px] font-medium text-tinta no-underline"
            >
              Ver en la tienda
            </Link>
          )}
          <span className="flex-1" />
          <BotonGuardar>{esNueva ? 'Crear categoría' : 'Guardar cambios'}</BotonGuardar>
        </div>
      </div>
    </form>
  )
}
