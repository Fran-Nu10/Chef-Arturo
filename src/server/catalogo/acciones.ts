'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { clienteServidor } from '@/lib/supabase/servidor'
import { exigirAdmin } from '@/server/autorizacion'
import { CategoriaEntrada, ProductoEntrada, Uuid, slugificar } from '@/server/validacion'
import { rechazoDemo } from '@/server/demo/guardia'
import {
  aplicarImagenDeCategoria,
  aplicarImagenDeProducto,
  leerImagenDelFormulario,
} from '@/server/medios/imagenes'
import { confirmarEscritura, erroresDeZod, mensajeDeBase } from '@/server/resultados'
export type { Resultado } from '@/server/resultados'
import type { Resultado } from '@/server/resultados'

const NO_ALCANZO =
  'No se guardó: el registro no existe o tu usuario no tiene permiso para modificarlo.'

/**
 * Acciones de catálogo.
 *
 * Todas exigen sesión administrativa antes de tocar nada. Esa comprobación es
 * el segundo cerrojo: el primero es RLS, que rechazaría la escritura aunque
 * alguien invocara la acción sin permisos.
 */

/**
 * Revalida todo lo que muestra el catálogo.
 *
 * Un producto o una foto tocan la home, `/catalogo`, la página de su
 * categoría, su ficha y las pantallas del panel. En lugar de enumerar cada
 * ruta —y olvidar alguna—, se revalida desde el layout raíz: cubre todas.
 */
function revalidarCatalogo() {
  revalidatePath('/', 'layout')
}

type Cliente = NonNullable<Awaited<ReturnType<typeof clienteServidor>>>

/** Lo que el formulario simplificado envía. El slug no viene del formulario. */
const camposProducto = (datos: FormData, slug: string, status: string) => ({
  slug,
  name: datos.get('name'),
  categoryId: datos.get('categoryId') || null,
  shortDescription: datos.get('shortDescription') ?? '',
  fullDescription: datos.get('fullDescription') ?? '',
  // "Consultar precio" guarda NULL aunque el campo hubiera quedado con algo.
  priceCents:
    datos.get('saleMode') === 'quote' || datos.get('price') === '' || datos.get('price') == null
      ? null
      : datos.get('price'),
  status,
  saleMode: datos.get('saleMode') ?? 'direct',
  trackStock: datos.get('trackStock') === 'on',
  stockQuantity: datos.get('stockQuantity') ?? 0,
  lowStockThreshold: datos.get('lowStockThreshold') ?? 0,
  leadTimeDays: datos.get('leadTimeDays') ?? 0,
  minQuantity: datos.get('minQuantity') ?? 1,
  fulfillment: datos.get('fulfillment') ?? 'both',
  seoTitle: datos.get('seoTitle') || undefined,
  seoDescription: datos.get('seoDescription') || undefined,
  isFeatured: false,
  position: 0,
})

function aFila(p: z.infer<typeof ProductoEntrada>) {
  return {
    slug: p.slug,
    name: p.name,
    category_id: p.categoryId ?? null,
    short_description: p.shortDescription,
    full_description: p.fullDescription,
    price_cents: p.priceCents ?? null,
    status: p.status,
    sale_mode: p.saleMode,
    track_stock: p.trackStock,
    stock_quantity: p.stockQuantity,
    low_stock_threshold: p.lowStockThreshold,
    lead_time_days: p.leadTimeDays,
    min_quantity: p.minQuantity,
    fulfillment: p.fulfillment,
    seo_title: p.seoTitle ?? null,
    seo_description: p.seoDescription ?? null,
  }
}

/** La categoría es obligatoria en el formulario nuevo; Zod la admite nula. */
function faltaCategoria(datos: FormData): Resultado | null {
  if (datos.get('categoryId')) return null
  return { errores: { categoryId: 'Elegí una categoría.' } }
}

/**
 * Inserta una fila resolviendo colisiones de slug con un sufijo.
 *
 * El dueño ya no ve el slug: si «Alfajores» ya existe, el nuevo queda como
 * `alfajores-2` sin preguntar nada. El único índice único de `products` y de
 * `categories` es el del slug, así que un 23505 acá siempre es una colisión
 * de slug.
 */
async function insertarConSlugUnico(
  supabase: Cliente,
  tabla: 'products' | 'categories',
  fila: Record<string, unknown>,
  base: string,
): Promise<{ id: string; slug: string } | { error: string }> {
  for (let intento = 0; intento < 8; intento++) {
    const slug = intento === 0 ? base : `${base}-${intento + 1}`
    const { data, error } = await supabase
      .from(tabla)
      .insert({ ...fila, slug })
      .select('id')
      .single()

    if (!error) return { id: data.id as string, slug }
    if (error.code !== '23505') return { error: mensajeDeBase(error) }
  }
  return { error: 'Hay demasiados registros con un nombre casi igual. Cambiá el nombre.' }
}

export async function crearProducto(_previo: Resultado, datos: FormData): Promise<Resultado> {
  await exigirAdmin()

  const publicar = datos.get('accion') === 'publicar'
  const nombre = String(datos.get('name') ?? '')
  const base = slugificar(nombre)

  const sinCategoria = faltaCategoria(datos)
  if (sinCategoria) return sinCategoria

  const analisis = ProductoEntrada.safeParse(
    camposProducto(datos, base, publicar ? 'active' : 'draft'),
  )
  if (!analisis.success) return { errores: erroresDeZod(analisis.error) }

  const imagen = leerImagenDelFormulario(datos, 'productos')
  if ('error' in imagen) return { error: imagen.error }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  // Los productos nuevos van al final; el orden fino se maneja en «Ordenar».
  const { data: ultimo } = await supabase
    .from('products')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const creado = await insertarConSlugUnico(
    supabase,
    'products',
    { ...aFila(analisis.data), position: (ultimo?.position ?? -1) + 1 },
    base,
  )
  if ('error' in creado) return { error: creado.error }

  // La foto va después del producto porque la relación necesita su id. Si
  // falla, el producto recién creado se deshace: no puede quedar publicado
  // incompleto sin que el dueño lo sepa, y volver a guardar no lo duplica.
  const resultadoImagen = await aplicarImagenDeProducto(
    supabase,
    creado.id,
    analisis.data.name,
    imagen,
  )
  if (!resultadoImagen.ok) {
    await supabase.from('products').delete().eq('id', creado.id)
    return { error: resultadoImagen.error ?? 'No se guardaron los cambios.' }
  }

  revalidarCatalogo()
  return { ok: true, id: creado.id }
}

export async function actualizarProducto(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  await exigirAdmin()
  const id = Uuid.safeParse(datos.get('id'))
  if (!id.success) return { error: 'Producto inválido.' }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const { data: actual, error: errorActual } = await supabase
    .from('products')
    .select('slug, status')
    .eq('id', id.data)
    .maybeSingle()
  if (errorActual) return { error: mensajeDeBase(errorActual) }
  if (!actual) return { error: NO_ALCANZO }

  // El slug se conserva salvo que el dueño lo cambie desde «Más opciones».
  const slugAvanzado = String(datos.get('slug') ?? '').trim()
  const slug = slugAvanzado || actual.slug

  // Un producto archivado sigue archivado aunque se editen sus datos;
  // restaurarlo es una acción aparte y deliberada.
  const status =
    actual.status === 'archived'
      ? 'archived'
      : datos.get('visible') === 'on'
        ? 'active'
        : 'draft'

  const sinCategoria = faltaCategoria(datos)
  if (sinCategoria) return sinCategoria

  const analisis = ProductoEntrada.safeParse(camposProducto(datos, slug, status))
  if (!analisis.success) return { errores: erroresDeZod(analisis.error) }

  const imagen = leerImagenDelFormulario(datos, 'productos')
  if ('error' in imagen) return { error: imagen.error }

  // La posición no viaja en el formulario: se administra desde «Ordenar».
  const resultado = await confirmarEscritura(
    supabase.from('products').update(aFila(analisis.data)).eq('id', id.data).select('id'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado

  const resultadoImagen = await aplicarImagenDeProducto(
    supabase,
    id.data,
    analisis.data.name,
    imagen,
  )
  if (!resultadoImagen.ok) {
    return {
      error:
        'Los datos se guardaron, pero la foto no. Probá subirla nuevamente.',
    }
  }

  revalidarCatalogo()
  return { ok: true, id: id.data }
}

/**
 * Duplica un producto como borrador.
 *
 * La copia comparte la misma imagen (la relación apunta al mismo archivo:
 * no se duplica nada en Storage) y nace oculta para que el dueño la revise
 * antes de publicarla.
 */
export async function duplicarProducto(id: string): Promise<Resultado> {
  await exigirAdmin()
  const valido = Uuid.safeParse(id)
  if (!valido.success) return { error: 'Producto inválido.' }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const { data: original, error: errorOriginal } = await supabase
    .from('products')
    .select('*')
    .eq('id', valido.data)
    .maybeSingle()
  if (errorOriginal) return { error: mensajeDeBase(errorOriginal) }
  if (!original) return { error: NO_ALCANZO }

  const nombre = `${original.name} (copia)`.slice(0, 160)
  const base = slugificar(nombre)

  const creado = await insertarConSlugUnico(
    supabase,
    'products',
    {
      name: nombre,
      category_id: original.category_id,
      short_description: original.short_description,
      full_description: original.full_description,
      price_cents: original.price_cents,
      status: 'draft',
      sale_mode: original.sale_mode,
      track_stock: original.track_stock,
      stock_quantity: original.stock_quantity,
      low_stock_threshold: original.low_stock_threshold,
      lead_time_days: original.lead_time_days,
      min_quantity: original.min_quantity,
      fulfillment: original.fulfillment,
      seo_title: original.seo_title,
      seo_description: original.seo_description,
      position: original.position + 1,
    },
    base,
  )
  if ('error' in creado) return { error: creado.error }

  // Misma imagen, mismo archivo: sólo se copia la relación.
  const { data: imagenes } = await supabase
    .from('product_images')
    .select('media_id, alt, position, is_primary')
    .eq('product_id', valido.data)

  if (imagenes && imagenes.length > 0) {
    const { error: errorCopia } = await supabase
      .from('product_images')
      .insert(imagenes.map((i) => ({ ...i, product_id: creado.id })))
    if (errorCopia) {
      revalidarCatalogo()
      return {
        ok: true,
        id: creado.id,
        error: 'Se duplicó el producto, pero la foto no se pudo copiar. Agregala al editarlo.',
      }
    }
  }

  revalidarCatalogo()
  return { ok: true, id: creado.id }
}

/** Publica u oculta un producto desde la lista, sin pasar por el formulario. */
export async function cambiarVisibilidadProducto(
  id: string,
  visible: boolean,
): Promise<Resultado> {
  await exigirAdmin()
  const valido = Uuid.safeParse(id)
  if (!valido.success) return { error: 'Producto inválido.' }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  // Un archivado no se publica desde acá: primero se restaura, a conciencia.
  const resultado = await confirmarEscritura(
    supabase
      .from('products')
      .update({ status: visible ? 'active' : 'draft' })
      .eq('id', valido.data)
      .neq('status', 'archived')
      .select('id'),
    'No se pudo cambiar la visibilidad. Si el producto está archivado, restauralo primero.',
  )
  if (!resultado.ok) return resultado

  revalidarCatalogo()
  return { ok: true }
}

/**
 * Archivar en lugar de borrar.
 *
 * Un producto que ya figura en un pedido no puede eliminarse —lo impide un
 * trigger—, así que el panel no ofrece borrado: ofrece archivado, que lo saca
 * del storefront sin romper el historial.
 */
export async function archivarProducto(id: string): Promise<Resultado> {
  await exigirAdmin()
  const valido = Uuid.safeParse(id)
  if (!valido.success) return { error: 'Producto inválido.' }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const resultado = await confirmarEscritura(
    supabase
      .from('products')
      .update({ status: 'archived', archived_at: new Date().toISOString() })
      .eq('id', valido.data)
      .select('id'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado

  revalidarCatalogo()
  return resultado
}

export async function restaurarProducto(id: string): Promise<Resultado> {
  await exigirAdmin()
  const valido = Uuid.safeParse(id)
  if (!valido.success) return { error: 'Producto inválido.' }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  // Vuelve oculto, nunca directo a publicado: que lo revise un humano.
  const resultado = await confirmarEscritura(
    supabase
      .from('products')
      .update({ status: 'draft', archived_at: null })
      .eq('id', valido.data)
      .select('id'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado
  revalidarCatalogo()
  return resultado
}

export async function ajustarStock(id: string, cantidad: number): Promise<Resultado> {
  await exigirAdmin()
  const valido = Uuid.safeParse(id)
  if (!valido.success) return { error: 'Producto inválido.' }
  if (!Number.isInteger(cantidad) || cantidad < 0) {
    return { error: 'La cantidad debe ser un entero no negativo.' }
  }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const resultado = await confirmarEscritura(
    supabase
      .from('products')
      .update({ stock_quantity: cantidad })
      .eq('id', valido.data)
      .select('id'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado
  revalidatePath('/admin/productos')
  return resultado
}

// ── Orden ───────────────────────────────────────────────────────────────────

const OrdenEntrada = z
  .array(z.object({ id: Uuid, position: z.number().int().min(0).max(9999) }))
  .min(1)
  .max(500)

/**
 * Guarda el orden que el dueño armó arrastrando (o con Subir/Bajar).
 *
 * Recibe la lista completa de posiciones y las escribe una por una. No hay
 * números visibles en la interfaz: la posición es un detalle interno.
 */
export async function reordenarProductos(
  ordenes: { id: string; position: number }[],
): Promise<Resultado> {
  await exigirAdmin()
  const analisis = OrdenEntrada.safeParse(ordenes)
  if (!analisis.success) return { error: 'El orden recibido no es válido.' }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  for (const { id, position } of analisis.data) {
    const resultado = await confirmarEscritura(
      supabase.from('products').update({ position }).eq('id', id).select('id'),
      'No se pudo guardar el nuevo orden.',
    )
    if (!resultado.ok) return resultado
  }

  revalidarCatalogo()
  return { ok: 'El nuevo orden se guardó.' }
}

// ── Categorías ──────────────────────────────────────────────────────────────

/** Lo que el formulario de categoría envía. El slug no viene del formulario. */
const camposCategoria = (datos: FormData, slug: string) => ({
  slug,
  name: datos.get('name'),
  description: datos.get('description') ?? '',
  position: 0,
  isActive: datos.get('visible') === 'on',
  seoTitle: datos.get('seoTitle') || undefined,
  seoDescription: datos.get('seoDescription') || undefined,
})

export async function crearCategoria(_previo: Resultado, datos: FormData): Promise<Resultado> {
  await exigirAdmin()

  const base = slugificar(String(datos.get('name') ?? ''), 'categoria')
  const analisis = CategoriaEntrada.safeParse(camposCategoria(datos, base))
  if (!analisis.success) return { errores: erroresDeZod(analisis.error) }

  const imagen = leerImagenDelFormulario(datos, 'categorias')
  if ('error' in imagen) return { error: imagen.error }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const { data: ultima } = await supabase
    .from('categories')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const creada = await insertarConSlugUnico(
    supabase,
    'categories',
    {
      name: analisis.data.name,
      description: analisis.data.description,
      position: (ultima?.position ?? -1) + 1,
      is_active: analisis.data.isActive,
      seo_title: analisis.data.seoTitle ?? null,
      seo_description: analisis.data.seoDescription ?? null,
    },
    base,
  )
  if ('error' in creada) return { error: creada.error }

  // Recién creada no tiene productos: si la foto falla, se deshace entera y
  // el formulario conserva lo escrito.
  const resultadoImagen = await aplicarImagenDeCategoria(
    supabase,
    creada.id,
    analisis.data.name,
    imagen,
  )
  if (!resultadoImagen.ok) {
    await supabase.from('categories').delete().eq('id', creada.id)
    return { error: resultadoImagen.error ?? 'No se guardaron los cambios.' }
  }

  revalidarCatalogo()
  return { ok: true, id: creada.id }
}

export async function actualizarCategoria(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  await exigirAdmin()
  const id = Uuid.safeParse(datos.get('id'))
  if (!id.success) return { error: 'Categoría inválida.' }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  // El slug se conserva al editar: cambiarle el nombre a una categoría no
  // rompe /catalogo/<slug> ya compartido.
  const { data: actual, error: errorActual } = await supabase
    .from('categories')
    .select('slug')
    .eq('id', id.data)
    .maybeSingle()
  if (errorActual) return { error: mensajeDeBase(errorActual) }
  if (!actual) return { error: NO_ALCANZO }

  const analisis = CategoriaEntrada.safeParse(camposCategoria(datos, actual.slug))
  if (!analisis.success) return { errores: erroresDeZod(analisis.error) }

  const imagen = leerImagenDelFormulario(datos, 'categorias')
  if ('error' in imagen) return { error: imagen.error }

  // Ni la posición ni la imagen viajan acá: la posición se maneja en la
  // lista y la imagen la aplica su propio flujo, que limpia huérfanos.
  const resultado = await confirmarEscritura(
    supabase
      .from('categories')
      .update({
        name: analisis.data.name,
        description: analisis.data.description,
        is_active: analisis.data.isActive,
        seo_title: analisis.data.seoTitle ?? null,
        seo_description: analisis.data.seoDescription ?? null,
      })
      .eq('id', id.data)
      .select('id'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado

  const resultadoImagen = await aplicarImagenDeCategoria(
    supabase,
    id.data,
    analisis.data.name,
    imagen,
  )
  if (!resultadoImagen.ok) {
    return { error: 'Los datos se guardaron, pero la foto no. Probá subirla nuevamente.' }
  }

  revalidarCatalogo()
  return { ok: true, id: id.data }
}

/** Guarda el orden de las categorías armado en la lista. */
export async function reordenarCategorias(
  ordenes: { id: string; position: number }[],
): Promise<Resultado> {
  await exigirAdmin()
  const analisis = OrdenEntrada.safeParse(ordenes)
  if (!analisis.success) return { error: 'El orden recibido no es válido.' }

  const demo = rechazoDemo()
  if (demo) return demo

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  for (const { id, position } of analisis.data) {
    const resultado = await confirmarEscritura(
      supabase.from('categories').update({ position }).eq('id', id).select('id'),
      'No se pudo guardar el nuevo orden.',
    )
    if (!resultado.ok) return resultado
  }

  revalidarCatalogo()
  return { ok: 'El nuevo orden se guardó.' }
}
