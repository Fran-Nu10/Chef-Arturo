import 'server-only'

import { cache } from 'react'
import {
  listarCategoriasPublicas,
  listarProductosPublicos,
  productoPorSlugPublico,
} from '@/server/catalogo/repositorio'
import { clienteServidor } from '@/lib/supabase/servidor'
import {
  aCategoriaStorefront,
  aProductoStorefront,
  type CategoriaStorefront,
  type ProductoStorefront,
} from './adaptadores'

/**
 * Lo que la tienda pública le pide a la base.
 *
 * Una sola puerta: las páginas llaman acá y le pasan el resultado a los
 * componentes, que siguen siendo los mismos de siempre.
 *
 * **No hay respaldo a fixtures.** Si la base está vacía, el catálogo se ve
 * vacío. Es deliberado: mezclar productos reales con productos de ejemplo en
 * la misma pantalla es peor que mostrar una vitrina sin nada, porque nadie
 * puede distinguir cuál es cuál.
 *
 * `cache()` de React evita repetir la misma consulta cuando dos secciones de
 * la home necesitan el catálogo.
 */

export interface CatalogoPublico {
  categorias: CategoriaStorefront[]
  productos: ProductoStorefront[]
  /** `true` cuando la base respondió pero no hay nada cargado todavía. */
  vacio: boolean
  /**
   * `true` cuando la base no respondió.
   *
   * Se distingue de `vacio` a propósito: no es lo mismo "todavía no cargamos
   * el catálogo" que "no pudimos consultarlo". El visitante ve un mensaje
   * distinto en cada caso y en los dos se le ofrece WhatsApp.
   */
  caido: boolean
}

/** Resuelve la ruta de la imagen de cada categoría en una sola consulta. */
async function rutasDeImagen(ids: string[]): Promise<Map<string, string>> {
  const mapa = new Map<string, string>()
  if (ids.length === 0) return mapa

  const supabase = await clienteServidor()
  if (!supabase) return mapa

  const { data } = await supabase.from('media_assets').select('id, path').in('id', ids)
  for (const m of data ?? []) mapa.set(m.id, m.path)
  return mapa
}

const CATALOGO_CAIDO: CatalogoPublico = {
  categorias: [],
  productos: [],
  vacio: true,
  caido: true,
}

export const catalogoPublico = cache(async (): Promise<CatalogoPublico> => {
  // La tienda pública no puede caerse porque Supabase no conteste. Los
  // repositorios lanzan —está bien para el panel, que necesita ver el error—
  // pero acá una excepción se traduciría en un 500 para todo el sitio, y un
  // corte de red del proveedor no tiene por qué tirar abajo la vidriera.
  let categorias, productos
  try {
    ;[categorias, productos] = await Promise.all([
      listarCategoriasPublicas(),
      listarProductosPublicos(),
    ])
  } catch (error) {
    console.error('[storefront] no se pudo leer el catálogo:', error)
    return CATALOGO_CAIDO
  }

  // `null` significa "sin backend configurado". El storefront no puede hacer
  // nada útil con eso, así que se comporta igual que con la base vacía.
  const filasCategorias = categorias ?? []
  const filasProductos = productos ?? []

  const imagenes = await rutasDeImagen(
    filasCategorias.map((c) => c.image_id).filter((id): id is string => Boolean(id)),
  )

  const porId = new Map(filasCategorias.map((c) => [c.id, c.slug]))

  return {
    categorias: filasCategorias.map((c, i) =>
      aCategoriaStorefront(c, i, c.image_id ? (imagenes.get(c.image_id) ?? null) : null),
    ),
    productos: filasProductos.map((p) =>
      aProductoStorefront(p, p.category_id ? (porId.get(p.category_id) ?? '') : ''),
    ),
    vacio: filasCategorias.length === 0 && filasProductos.length === 0,
    caido: false,
  }
})

/**
 * Los productos marcados como destacados, para "Del mostrador de hoy".
 *
 * Si no hay ninguno destacado se devuelven los primeros del catálogo: la
 * sección existe en el diseño y quedarse sin nada que mostrar sería peor que
 * mostrar el principio de la vitrina. No se inventa ningún producto.
 */
export const seleccionDeLaCasa = cache(async (): Promise<ProductoStorefront[]> => {
  const { productos } = await catalogoPublico()

  try {
    const destacados = await listarProductosPublicos({ soloDestacados: true, limite: 6 })
    if (destacados && destacados.length > 0) {
      const slugs = new Set(destacados.map((d) => d.slug))
      return productos.filter((p) => slugs.has(p.slug))
    }
  } catch (error) {
    // Igual que en `catalogoPublico`: la home no se cae por el proveedor.
    console.error('[storefront] no se pudieron leer los destacados:', error)
  }

  return productos.slice(0, 6)
})

export async function productoPublico(slug: string): Promise<ProductoStorefront | null> {
  let fila
  try {
    fila = await productoPorSlugPublico(slug)
  } catch (error) {
    console.error('[storefront] no se pudo leer el producto:', error)
    return null
  }
  if (!fila) return null

  const { categorias } = await catalogoPublico()
  const supabase = await clienteServidor()

  let slugCategoria = ''
  if (fila.category_id && supabase) {
    const { data } = await supabase
      .from('categories')
      .select('slug')
      .eq('id', fila.category_id)
      .maybeSingle()
    slugCategoria = data?.slug ?? ''
  }

  // Se resuelve contra la lista ya cargada cuando se puede, para no repetir
  // la consulta en la ficha.
  const conocida = categorias.find((c) => c.slug === slugCategoria)
  return aProductoStorefront(fila, conocida?.slug ?? slugCategoria)
}
