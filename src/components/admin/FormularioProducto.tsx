'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import {
  actualizarProducto,
  archivarProducto,
  crearProducto,
  restaurarProducto,
  type Resultado,
} from '@/server/catalogo/acciones'
import type { FilaCategoria, FilaProducto } from '@/lib/supabase/tipos'
import {
  AreaTexto,
  AvisoSinGuardar,
  BotonGuardar,
  Campo,
  Casilla,
  Entrada,
  Feedback,
  Seleccion,
} from './Piezas'

/** Deriva un slug del nombre. Sólo sugiere: el operador puede cambiarlo. */
function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function FormularioProducto({
  producto,
  categorias,
}: {
  producto?: FilaProducto
  categorias: FilaCategoria[]
}) {
  const esNuevo = !producto
  const [estado, accion] = useActionState(
    esNuevo ? crearProducto : actualizarProducto,
    {} as Resultado,
  )
  const [nombre, setNombre] = useState(producto?.name ?? '')
  const [slug, setSlug] = useState(producto?.slug ?? '')
  const [slugTocado, setSlugTocado] = useState(Boolean(producto))
  const [modalidad, setModalidad] = useState(producto?.sale_mode ?? 'direct')
  const [conStock, setConStock] = useState(producto?.track_stock ?? false)

  const error = (campo: string) => estado.errores?.[campo]

  return (
    <div className="flex flex-col gap-6">
      <form id="form-producto" action={accion} className="flex flex-col gap-6">
        {producto && <input type="hidden" name="id" value={producto.id} />}

        <section className="flex flex-col gap-4 border border-linea bg-papel-alt p-4">
          <h2 className="m-0 font-display text-xl font-normal">Identidad</h2>

          <Campo etiqueta="Nombre" error={error('name')}>
            <Entrada
              name="name"
              required
              maxLength={160}
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value)
                if (!slugTocado) setSlug(slugificar(e.target.value))
              }}
            />
          </Campo>

          <Campo
            etiqueta="Slug"
            ayuda="Aparece en la URL. Sólo minúsculas, números y guiones."
            error={error('slug')}
          >
            <Entrada
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTocado(true)
                setSlug(e.target.value)
              }}
            />
          </Campo>

          <Campo etiqueta="Categoría" error={error('categoryId')}>
            <Seleccion name="categoryId" defaultValue={producto?.category_id ?? ''}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Seleccion>
          </Campo>

          <Campo etiqueta="Descripción corta" error={error('shortDescription')}>
            <AreaTexto
              name="shortDescription"
              rows={2}
              maxLength={300}
              defaultValue={producto?.short_description ?? ''}
            />
          </Campo>

          <Campo etiqueta="Descripción completa" error={error('fullDescription')}>
            <AreaTexto
              name="fullDescription"
              rows={5}
              maxLength={5000}
              defaultValue={producto?.full_description ?? ''}
            />
          </Campo>
        </section>

        <section className="flex flex-col gap-4 border border-linea bg-papel-alt p-4">
          <h2 className="m-0 font-display text-xl font-normal">Venta</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Modalidad" error={error('saleMode')}>
              <Seleccion
                name="saleMode"
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value as typeof modalidad)}
              >
                <option value="direct">Compra directa</option>
                <option value="preorder">Por encargo</option>
                <option value="quote">Con cotización</option>
              </Seleccion>
            </Campo>

            <Campo
              etiqueta="Precio (pesos)"
              ayuda={
                modalidad === 'direct'
                  ? 'Obligatorio en compra directa.'
                  : 'Opcional: sin precio se muestra "Precio pendiente".'
              }
              error={error('priceCents')}
            >
              <Entrada
                name="price"
                type="number"
                min={0}
                step="0.01"
                required={modalidad === 'direct'}
                defaultValue={
                  producto?.price_cents != null ? producto.price_cents / 100 : ''
                }
              />
            </Campo>

            <Campo etiqueta="Estado" error={error('status')}>
              <Seleccion name="status" defaultValue={producto?.status ?? 'draft'}>
                <option value="draft">Borrador</option>
                <option value="active">Activo</option>
                <option value="archived">Archivado</option>
              </Seleccion>
            </Campo>

            <Campo etiqueta="Entrega" error={error('fulfillment')}>
              <Seleccion name="fulfillment" defaultValue={producto?.fulfillment ?? 'both'}>
                <option value="both">Retiro y entrega</option>
                <option value="pickup">Sólo retiro</option>
                <option value="delivery">Sólo entrega</option>
              </Seleccion>
            </Campo>

            <Campo etiqueta="Anticipación (días)" error={error('leadTimeDays')}>
              <Entrada
                name="leadTimeDays"
                type="number"
                min={0}
                max={365}
                defaultValue={producto?.lead_time_days ?? 0}
              />
            </Campo>

            <Campo etiqueta="Cantidad mínima" error={error('minQuantity')}>
              <Entrada
                name="minQuantity"
                type="number"
                min={1}
                defaultValue={producto?.min_quantity ?? 1}
              />
            </Campo>

            <Campo etiqueta="Orden visual" error={error('position')}>
              <Entrada
                name="position"
                type="number"
                min={0}
                defaultValue={producto?.position ?? 0}
              />
            </Campo>
          </div>

          <Casilla
            etiqueta="Destacado"
            name="isFeatured"
            defaultChecked={producto?.is_featured ?? false}
          />
        </section>

        <section className="flex flex-col gap-4 border border-linea bg-papel-alt p-4">
          <h2 className="m-0 font-display text-xl font-normal">Stock</h2>
          <Casilla
            etiqueta="Controlar stock de este producto"
            name="trackStock"
            checked={conStock}
            onChange={(e) => setConStock(e.target.checked)}
          />
          {conStock && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Cantidad disponible" error={error('stockQuantity')}>
                <Entrada
                  name="stockQuantity"
                  type="number"
                  min={0}
                  defaultValue={producto?.stock_quantity ?? 0}
                />
              </Campo>
              <Campo
                etiqueta="Umbral de stock bajo"
                ayuda="Por debajo de este número aparece el aviso en el resumen."
                error={error('lowStockThreshold')}
              >
                <Entrada
                  name="lowStockThreshold"
                  type="number"
                  min={0}
                  defaultValue={producto?.low_stock_threshold ?? 0}
                />
              </Campo>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4 border border-linea bg-papel-alt p-4">
          <h2 className="m-0 font-display text-xl font-normal">SEO</h2>
          <Campo etiqueta="Título SEO" error={error('seoTitle')}>
            <Entrada name="seoTitle" maxLength={120} defaultValue={producto?.seo_title ?? ''} />
          </Campo>
          <Campo etiqueta="Descripción SEO" error={error('seoDescription')}>
            <AreaTexto
              name="seoDescription"
              rows={2}
              maxLength={300}
              defaultValue={producto?.seo_description ?? ''}
            />
          </Campo>
        </section>

        <div className="flex flex-col gap-3">
          <AvisoSinGuardar formId="form-producto" />
          <Feedback estado={estado} />
          <div className="flex flex-wrap gap-2">
            <BotonGuardar>{esNuevo ? 'Crear producto' : 'Guardar cambios'}</BotonGuardar>
            {producto && (
              <Link
                href={`/producto/${producto.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center border border-linea-fuerte px-4 text-[13px] font-medium text-tinta no-underline"
              >
                Vista previa
              </Link>
            )}
          </div>
        </div>
      </form>

      {producto && <AccionesArchivo producto={producto} />}
    </div>
  )
}

/**
 * Archivar y restaurar.
 *
 * No hay borrado: un producto que ya figura en un pedido no puede eliminarse
 * —lo impide un trigger en la base— y borrar el resto rompería el historial.
 */
function AccionesArchivo({ producto }: { producto: FilaProducto }) {
  const [estado, setEstado] = useState<Resultado>({})
  const [confirmando, setConfirmando] = useState(false)
  const archivado = producto.status === 'archived'

  return (
    <section className="flex flex-col gap-3 border border-linea bg-papel-alt p-4">
      <h2 className="m-0 font-display text-xl font-normal">
        {archivado ? 'Restaurar' : 'Archivar'}
      </h2>
      <p className="m-0 text-[12.5px] leading-relaxed text-tinta-suave">
        {archivado
          ? 'Vuelve a borrador para que puedas revisarlo antes de publicarlo otra vez.'
          : 'Lo saca del catálogo público sin borrar su historial de ventas. Los productos no se eliminan.'}
      </p>
      <Feedback estado={estado} />
      {archivado ? (
        <button
          type="button"
          onClick={async () => setEstado(await restaurarProducto(producto.id))}
          className="inline-flex min-h-[44px] w-fit items-center border border-verde px-4 text-[13px] font-semibold text-verde"
        >
          Restaurar a borrador
        </button>
      ) : confirmando ? (
        <div className="flex flex-wrap items-center gap-2 border border-alerta bg-alerta-fondo px-3 py-2">
          <span className="text-[12.5px] text-alerta">¿Archivar «{producto.name}»?</span>
          <button
            type="button"
            onClick={async () => {
              setEstado(await archivarProducto(producto.id))
              setConfirmando(false)
            }}
            className="inline-flex min-h-[44px] items-center border border-alerta bg-alerta px-4 text-[13px] font-semibold text-papel"
          >
            Sí, archivar
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="min-h-[44px] px-2 text-[13px] font-medium text-tinta-suave underline"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="inline-flex min-h-[44px] w-fit items-center border border-linea-fuerte px-4 text-[13px] font-medium text-tinta"
        >
          Archivar producto
        </button>
      )}
    </section>
  )
}
