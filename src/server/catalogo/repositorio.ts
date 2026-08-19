import 'server-only'

import { clienteServidor } from '@/lib/supabase/servidor'
import { entornoPublico } from '@/lib/supabase/env'
import type { FilaCategoria, FilaProducto } from '@/lib/supabase/tipos'

/**
 * Repositorio del catálogo.
 *
 * Capa única entre la UI y Supabase: ningún componente habla con la base
 * directamente. Cuando no hay backend devuelve `null`, y quien llama decide
 * si cae a los fixtures (storefront) o avisa que falta configurar (panel).
 */

export interface ProductoConImagen extends FilaProducto {
  imagen: { path: string; alt: string } | null
}

/** URL pública de un archivo del bucket `media`. */
export function urlPublica(path: string): string {
  return `${entornoPublico.supabaseUrl}/storage/v1/object/public/media/${path}`
}

export async function listarCategoriasPublicas(): Promise<FilaCategoria[] | null> {
  const supabase = await clienteServidor()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true })

  if (error) throw error
  return data
}

export async function listarProductosPublicos(opciones?: {
  categoriaSlug?: string
  soloDestacados?: boolean
  limite?: number
}): Promise<ProductoConImagen[] | null> {
  const supabase = await clienteServidor()
  if (!supabase) return null

  let consulta = supabase
    .from('products')
    .select('*, product_images(media_id, alt, is_primary, position, media_assets(path))')
    .eq('status', 'active')
    .order('position', { ascending: true })

  if (opciones?.soloDestacados) consulta = consulta.eq('is_featured', true)
  if (opciones?.limite) consulta = consulta.limit(opciones.limite)

  if (opciones?.categoriaSlug) {
    const { data: categoria } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', opciones.categoriaSlug)
      .maybeSingle()
    if (!categoria) return []
    consulta = consulta.eq('category_id', categoria.id)
  }

  const { data, error } = await consulta
  if (error) throw error

  return (data ?? []).map((fila) => {
    const imagenes = (fila as unknown as { product_images?: ImagenCruda[] }).product_images ?? []
    const principal =
      imagenes.find((i) => i.is_primary) ??
      [...imagenes].sort((a, b) => a.position - b.position)[0]
    return {
      ...(fila as unknown as FilaProducto),
      imagen: principal?.media_assets
        ? { path: principal.media_assets.path, alt: principal.alt }
        : null,
    }
  })
}

interface ImagenCruda {
  media_id: string
  alt: string
  is_primary: boolean
  position: number
  media_assets: { path: string } | null
}

export async function productoPorSlugPublico(
  slug: string,
): Promise<ProductoConImagen | null | undefined> {
  const supabase = await clienteServidor()
  if (!supabase) return undefined

  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(media_id, alt, is_primary, position, media_assets(path))')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const imagenes = (data as unknown as { product_images?: ImagenCruda[] }).product_images ?? []
  const principal =
    imagenes.find((i) => i.is_primary) ??
    [...imagenes].sort((a, b) => a.position - b.position)[0]

  return {
    ...(data as unknown as FilaProducto),
    imagen: principal?.media_assets
      ? { path: principal.media_assets.path, alt: principal.alt }
      : null,
  }
}

// ── Panel ───────────────────────────────────────────────────────────────────

export interface FiltrosProductos {
  busqueda?: string
  estado?: 'draft' | 'active' | 'archived'
  categoriaId?: string
  soloStockBajo?: boolean
  orden?: 'position' | 'name' | 'created_at' | 'stock'
  pagina?: number
  porPagina?: number
}

export async function listarProductosAdmin(filtros: FiltrosProductos = {}) {
  const supabase = await clienteServidor()
  if (!supabase) return null

  const porPagina = Math.min(filtros.porPagina ?? 25, 100)
  const pagina = Math.max(filtros.pagina ?? 1, 1)
  const desde = (pagina - 1) * porPagina

  let consulta = supabase
    .from('products')
    .select('*, categories(name, slug)', { count: 'exact' })

  if (filtros.estado) consulta = consulta.eq('status', filtros.estado)
  if (filtros.categoriaId) consulta = consulta.eq('category_id', filtros.categoriaId)
  if (filtros.busqueda) {
    const termino = filtros.busqueda.replace(/[%,()]/g, ' ').trim()
    if (termino) consulta = consulta.or(`name.ilike.%${termino}%,slug.ilike.%${termino}%`)
  }

  const columna =
    filtros.orden === 'name'
      ? 'name'
      : filtros.orden === 'created_at'
        ? 'created_at'
        : filtros.orden === 'stock'
          ? 'stock_quantity'
          : 'position'

  const { data, error, count } = await consulta
    .order(columna, { ascending: columna !== 'created_at' })
    .range(desde, desde + porPagina - 1)

  if (error) throw error

  return {
    productos: (data ?? []) as unknown as (FilaProducto & {
      categories: { name: string; slug: string } | null
    })[],
    total: count ?? 0,
    pagina,
    porPagina,
  }
}

/** Productos por debajo de su umbral. Sólo cuenta los que llevan stock. */
export async function productosConStockBajo() {
  const supabase = await clienteServidor()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, stock_quantity, low_stock_threshold')
    .eq('track_stock', true)
    .eq('status', 'active')
    .order('stock_quantity', { ascending: true })

  if (error) throw error
  return (data ?? []).filter((p) => p.stock_quantity <= p.low_stock_threshold)
}

export async function listarCategoriasAdmin() {
  const supabase = await clienteServidor()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('position', { ascending: true })

  if (error) throw error
  return data
}

export async function productoPorId(id: string) {
  const supabase = await clienteServidor()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(id, media_id, alt, position, is_primary, media_assets(path, alt))')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}
