'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { clienteServidor } from '@/lib/supabase/servidor'
import { exigirAdmin } from '@/server/autorizacion'
import { CategoriaEntrada, ProductoEntrada, Uuid } from '@/server/validacion'
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

const camposProducto = (datos: FormData) => ({
  slug: datos.get('slug'),
  name: datos.get('name'),
  categoryId: datos.get('categoryId') || null,
  shortDescription: datos.get('shortDescription') ?? '',
  fullDescription: datos.get('fullDescription') ?? '',
  priceCents: datos.get('price') === '' ? null : datos.get('price'),
  status: datos.get('status') ?? 'draft',
  saleMode: datos.get('saleMode') ?? 'direct',
  isFeatured: datos.get('isFeatured') === 'on',
  position: datos.get('position') ?? 0,
  trackStock: datos.get('trackStock') === 'on',
  stockQuantity: datos.get('stockQuantity') ?? 0,
  lowStockThreshold: datos.get('lowStockThreshold') ?? 0,
  leadTimeDays: datos.get('leadTimeDays') ?? 0,
  minQuantity: datos.get('minQuantity') ?? 1,
  fulfillment: datos.get('fulfillment') ?? 'both',
  seoTitle: datos.get('seoTitle') || undefined,
  seoDescription: datos.get('seoDescription') || undefined,
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
    is_featured: p.isFeatured,
    position: p.position,
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

export async function crearProducto(_previo: Resultado, datos: FormData): Promise<Resultado> {
  await exigirAdmin()
  const analisis = ProductoEntrada.safeParse(camposProducto(datos))
  if (!analisis.success) return { errores: erroresDeZod(analisis.error) }

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const { data, error } = await supabase
    .from('products')
    .insert(aFila(analisis.data))
    .select('id')
    .single()

  if (error) return { error: mensajeDeBase(error) }

  revalidatePath('/admin/productos')
  revalidatePath('/catalogo')
  return { ok: true, id: data.id }
}

export async function actualizarProducto(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  await exigirAdmin()
  const id = Uuid.safeParse(datos.get('id'))
  if (!id.success) return { error: 'Producto inválido.' }

  const analisis = ProductoEntrada.safeParse(camposProducto(datos))
  if (!analisis.success) return { errores: erroresDeZod(analisis.error) }

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const resultado = await confirmarEscritura(
    supabase.from('products').update(aFila(analisis.data)).eq('id', id.data).select('id'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado

  revalidatePath('/admin/productos')
  revalidatePath(`/admin/productos/${id.data}`)
  revalidatePath('/catalogo')
  return resultado
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

  revalidatePath('/admin/productos')
  revalidatePath('/catalogo')
  return resultado
}

export async function restaurarProducto(id: string): Promise<Resultado> {
  await exigirAdmin()
  const valido = Uuid.safeParse(id)
  if (!valido.success) return { error: 'Producto inválido.' }

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  // Vuelve a borrador, nunca directo a publicado: que lo revise un humano.
  const resultado = await confirmarEscritura(
    supabase
      .from('products')
      .update({ status: 'draft', archived_at: null })
      .eq('id', valido.data)
      .select('id'),
    NO_ALCANZO,
  )
  if (!resultado.ok) return resultado
  revalidatePath('/admin/productos')
  return resultado
}

export async function ajustarStock(id: string, cantidad: number): Promise<Resultado> {
  await exigirAdmin()
  const valido = Uuid.safeParse(id)
  if (!valido.success) return { error: 'Producto inválido.' }
  if (!Number.isInteger(cantidad) || cantidad < 0) {
    return { error: 'La cantidad debe ser un entero no negativo.' }
  }

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

// ── Categorías ──────────────────────────────────────────────────────────────

export async function guardarCategoria(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  await exigirAdmin()
  const analisis = CategoriaEntrada.safeParse({
    slug: datos.get('slug'),
    name: datos.get('name'),
    description: datos.get('description') ?? '',
    position: datos.get('position') ?? 0,
    isActive: datos.get('isActive') === 'on',
    imageId: datos.get('imageId') || null,
    seoTitle: datos.get('seoTitle') || undefined,
    seoDescription: datos.get('seoDescription') || undefined,
  })
  if (!analisis.success) return { errores: erroresDeZod(analisis.error) }

  const supabase = await clienteServidor()
  if (!supabase) return { error: 'El backend no está configurado.' }

  const fila = {
    slug: analisis.data.slug,
    name: analisis.data.name,
    description: analisis.data.description,
    position: analisis.data.position,
    is_active: analisis.data.isActive,
    image_id: analisis.data.imageId ?? null,
    seo_title: analisis.data.seoTitle ?? null,
    seo_description: analisis.data.seoDescription ?? null,
  }

  const idCrudo = datos.get('id')
  let resultado: Resultado
  if (idCrudo) {
    const id = Uuid.safeParse(idCrudo)
    if (!id.success) return { error: 'Categoría inválida.' }
    resultado = await confirmarEscritura(
      supabase.from('categories').update(fila).eq('id', id.data).select('id'),
      NO_ALCANZO,
    )
  } else {
    resultado = await confirmarEscritura(
      supabase.from('categories').insert(fila).select('id'),
      'No se pudo crear la categoría.',
    )
  }
  if (!resultado.ok) return resultado

  revalidatePath('/admin/categorias')
  revalidatePath('/catalogo')
  return resultado
}
