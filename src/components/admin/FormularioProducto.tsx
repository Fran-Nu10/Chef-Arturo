'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import {
  actualizarProducto,
  archivarProducto,
  crearProducto,
  restaurarProducto,
  type Resultado,
} from '@/server/catalogo/acciones'
import type { FilaCategoria, FilaProducto, ModalidadVenta } from '@/lib/supabase/tipos'
import { SubidorImagen, useSubidorImagen, type ImagenExistente } from './SubidorImagen'
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

/**
 * Formulario de producto en una sola pantalla.
 *
 * Lo esencial a la vista —foto, nombre, categoría, descripción, forma de
 * venta, precio— y lo demás plegado en «Más opciones». Sin slug visible, sin
 * centésimos, sin estados técnicos: el dueño publica u oculta, no cambia un
 * enum.
 */

const MODALIDADES: { valor: ModalidadVenta; titulo: string; texto: string }[] = [
  {
    valor: 'direct',
    titulo: 'Compra directa',
    texto: 'El cliente ve el precio y puede agregarlo al carrito.',
  },
  {
    valor: 'preorder',
    titulo: 'Por encargo',
    texto: 'El cliente elige el producto y coordina una fecha.',
  },
  {
    valor: 'quote',
    titulo: 'Consultar precio',
    texto: 'El cliente consulta por WhatsApp antes de comprar.',
  },
]

export function FormularioProducto({
  producto,
  categorias,
  imagenActual = null,
}: {
  producto?: FilaProducto
  categorias: FilaCategoria[]
  imagenActual?: ImagenExistente | null
}) {
  const esNuevo = !producto
  const router = useRouter()
  const [estado, despachar] = useActionState(
    esNuevo ? crearProducto : actualizarProducto,
    {} as Resultado,
  )
  const [modalidad, setModalidad] = useState<ModalidadVenta>(producto?.sale_mode ?? 'direct')
  const [conStock, setConStock] = useState(producto?.track_stock ?? false)
  const subidor = useSubidorImagen({ carpeta: 'productos', imagenActual })

  const archivado = producto?.status === 'archived'
  const error = (campo: string) => estado.errores?.[campo]

  // El producto nuevo se crea y se sigue editando: quedarse en un formulario
  // de alta ya enviado invita a crear duplicados sin querer.
  useEffect(() => {
    if (esNuevo && estado.ok && estado.id) {
      router.replace(`/admin/productos/${estado.id}?guardado=1`)
    }
  }, [esNuevo, estado, router])

  useEffect(() => {
    if (estado.ok) subidor.confirmarGuardado()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sólo al guardar
  }, [estado])

  // La subida a Storage ocurre acá, antes de despachar la Server Action: el
  // archivo viaja directo del navegador al bucket con la sesión del
  // administrador y la acción recibe únicamente la ruta.
  async function enviar(datos: FormData) {
    const listo = await subidor.prepararEnvio(datos)
    if (!listo) return
    despachar(datos)
  }

  // Las categorías inactivas no se ofrecen, pero si el producto ya está en
  // una, se conserva visible para no cambiársela en silencio.
  const opcionesCategoria = categorias.filter(
    (c) => c.is_active || c.id === producto?.category_id,
  )

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <form id="form-producto" action={enviar} className="flex flex-col gap-6">
        {producto && <input type="hidden" name="id" value={producto.id} />}

        <SubidorImagen control={subidor} etiqueta="Foto del producto" />

        <Campo etiqueta="Nombre del producto" error={error('name')}>
          <Entrada name="name" required maxLength={160} defaultValue={producto?.name ?? ''} />
        </Campo>

        <div className="flex flex-col gap-1.5">
          <Campo etiqueta="Categoría" error={error('categoryId')}>
            <Seleccion
              name="categoryId"
              required
              defaultValue={producto?.category_id ?? ''}
            >
              <option value="" disabled>
                Elegí una categoría
              </option>
              {opcionesCategoria.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Seleccion>
          </Campo>
          <Link
            href="/admin/categorias/nueva"
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit text-[12.5px] font-medium text-caramelo-texto"
          >
            Crear nueva categoría ↗
          </Link>
        </div>

        <Campo
          etiqueta="Descripción"
          ayuda="Contá brevemente qué incluye o qué lo hace especial."
          error={error('shortDescription')}
        >
          <AreaTexto
            name="shortDescription"
            rows={3}
            maxLength={300}
            defaultValue={producto?.short_description ?? ''}
          />
        </Campo>

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 p-0 text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
            Forma de venta
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {MODALIDADES.map((o) => (
              <label
                key={o.valor}
                className={`flex min-h-[44px] cursor-pointer flex-col gap-1 border p-3 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-verde ${
                  modalidad === o.valor
                    ? 'border-verde bg-verde/[0.06]'
                    : 'border-linea-fuerte bg-papel hover:border-verde/60'
                }`}
              >
                <input
                  type="radio"
                  name="saleMode"
                  value={o.valor}
                  checked={modalidad === o.valor}
                  onChange={() => setModalidad(o.valor)}
                  className="sr-only"
                />
                <span className="text-[13.5px] font-semibold">{o.titulo}</span>
                <span className="text-[12px] leading-relaxed text-tinta-suave">{o.texto}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {modalidad !== 'quote' && (
          <Campo
            etiqueta="Precio"
            ayuda={
              modalidad === 'direct'
                ? 'En pesos uruguayos. Por ejemplo: 990.'
                : 'Opcional: si lo dejás vacío, la tienda muestra "Precio pendiente".'
            }
            error={error('priceCents')}
          >
            <div className="relative">
              <span
                aria-hidden="true"
                className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-tinta-suave"
              >
                $
              </span>
              <Entrada
                name="price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="990"
                required={modalidad === 'direct'}
                defaultValue={producto?.price_cents != null ? producto.price_cents / 100 : ''}
                className="pl-7"
              />
            </div>
          </Campo>
        )}

        {modalidad === 'preorder' && (
          <Campo
            etiqueta="¿Con cuántos días de anticipación?"
            ayuda="Los pedidos se piden con al menos esta anticipación."
            error={error('leadTimeDays')}
          >
            <Entrada
              name="leadTimeDays"
              type="number"
              inputMode="numeric"
              min={0}
              max={365}
              defaultValue={producto ? producto.lead_time_days : 1}
            />
          </Campo>
        )}

        {producto && !archivado && (
          <Casilla
            etiqueta="Visible en la tienda"
            name="visible"
            defaultChecked={producto.status === 'active'}
          />
        )}

        <details className="border border-linea bg-papel-alt">
          <summary className="flex min-h-[48px] cursor-pointer items-center px-4 text-[13.5px] font-semibold select-none">
            Más opciones
          </summary>
          <div className="flex flex-col gap-4 border-t border-linea p-4">
            <Campo
              etiqueta="Descripción completa"
              ayuda="Se muestra en la página del producto, debajo de la descripción breve."
              error={error('fullDescription')}
            >
              <AreaTexto
                name="fullDescription"
                rows={5}
                maxLength={5000}
                defaultValue={producto?.full_description ?? ''}
              />
            </Campo>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Retiro y entrega" error={error('fulfillment')}>
                <Seleccion name="fulfillment" defaultValue={producto?.fulfillment ?? 'both'}>
                  <option value="both">Retiro y entrega</option>
                  <option value="pickup">Sólo retiro</option>
                  <option value="delivery">Sólo entrega</option>
                </Seleccion>
              </Campo>
              <Campo etiqueta="Cantidad mínima por pedido" error={error('minQuantity')}>
                <Entrada
                  name="minQuantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  defaultValue={producto?.min_quantity ?? 1}
                />
              </Campo>
            </div>

            <div className="flex flex-col gap-3">
              <Casilla
                etiqueta="¿Querés controlar la cantidad disponible?"
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
                      inputMode="numeric"
                      min={0}
                      defaultValue={producto?.stock_quantity ?? 0}
                    />
                  </Campo>
                  <Campo
                    etiqueta="Avisarme cuando queden"
                    ayuda="Con esta cantidad o menos, aparece un aviso en el resumen."
                    error={error('lowStockThreshold')}
                  >
                    <Entrada
                      name="lowStockThreshold"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      defaultValue={producto?.low_stock_threshold ?? 0}
                    />
                  </Campo>
                </div>
              )}
            </div>

            <Campo etiqueta="Título para buscadores" error={error('seoTitle')}>
              <Entrada name="seoTitle" maxLength={120} defaultValue={producto?.seo_title ?? ''} />
            </Campo>
            <Campo etiqueta="Descripción para buscadores" error={error('seoDescription')}>
              <AreaTexto
                name="seoDescription"
                rows={2}
                maxLength={300}
                defaultValue={producto?.seo_description ?? ''}
              />
            </Campo>

            {producto && (
              <Campo
                etiqueta="Dirección en la tienda (avanzado)"
                ayuda="Cambiarla rompe los enlaces ya compartidos. Sólo minúsculas, números y guiones."
                error={error('slug')}
              >
                <Entrada name="slug" defaultValue={producto.slug} />
              </Campo>
            )}
          </div>
        </details>

        <div className="sticky bottom-0 z-20 -mx-1 flex flex-col gap-2 border-t border-linea bg-papel px-1 py-3">
          <AvisoSinGuardar formId="form-producto" />
          <Feedback
            estado={estado}
            mensajeOk={esNuevo ? 'Producto guardado.' : 'Cambios guardados.'}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/productos"
              className="inline-flex min-h-[44px] items-center px-3 text-[13px] font-medium text-tinta-suave underline underline-offset-[3px]"
            >
              Cancelar
            </Link>
            {producto?.status === 'active' && (
              <Link
                href={`/producto/${producto.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center border border-linea-fuerte px-4 text-[13px] font-medium text-tinta no-underline"
              >
                Vista previa
              </Link>
            )}
            <span className="flex-1" />
            {esNuevo ? (
              <>
                <BotonGuardar variante="secundario" name="accion" value="borrador">
                  Guardar como borrador
                </BotonGuardar>
                <BotonGuardar name="accion" value="publicar">
                  Publicar producto
                </BotonGuardar>
              </>
            ) : (
              <BotonGuardar>Guardar cambios</BotonGuardar>
            )}
          </div>
        </div>
      </form>

      {producto && <ZonaArchivo producto={producto} />}
    </div>
  )
}

/**
 * Archivar y restaurar, apartado del formulario.
 *
 * No hay borrado: un producto que ya figura en un pedido no puede eliminarse
 * —lo impide un trigger en la base— y borrar el resto rompería el historial.
 */
function ZonaArchivo({ producto }: { producto: FilaProducto }) {
  const [estado, setEstado] = useState<Resultado>({})
  const [confirmando, setConfirmando] = useState(false)
  const archivado = producto.status === 'archived'

  return (
    <section className="flex flex-col gap-3 border border-linea bg-papel-alt p-4">
      <h2 className="m-0 font-display text-xl font-normal">
        {archivado ? 'Producto archivado' : 'Archivar'}
      </h2>
      <p className="m-0 text-[12.5px] leading-relaxed text-tinta-suave">
        {archivado
          ? 'No aparece en la tienda. Restaurarlo lo deja oculto, listo para revisarlo y publicarlo de nuevo.'
          : 'Lo saca de la tienda sin borrar su historial de ventas. Los productos no se eliminan.'}
      </p>
      <Feedback estado={estado} />
      {archivado ? (
        <button
          type="button"
          onClick={async () => setEstado(await restaurarProducto(producto.id))}
          className="inline-flex min-h-[44px] w-fit items-center border border-verde px-4 text-[13px] font-semibold text-verde"
        >
          Restaurar producto
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
