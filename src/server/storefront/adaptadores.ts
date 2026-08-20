import 'server-only'

import { formatearImporte } from '@/server/dinero'
import { urlPublica, type ProductoConImagen } from '@/server/catalogo/repositorio'
import type { Categoria, Disponibilidad, Modalidad, Producto } from '@/content/tipos'
import type { FilaCategoria } from '@/lib/supabase/tipos'

/**
 * De las filas de Supabase a las formas que consumen los componentes.
 *
 * Los componentes del storefront no cambian: siguen recibiendo `Producto` y
 * `Categoria` tal como los definía `src/content/tipos.ts`. Lo único que cambia
 * es de dónde salen. Así el diseño aprobado queda intacto y el cableado se
 * concentra en un archivo.
 *
 * Acá no se inventa nada. Cada campo del diseño que la base no tiene se
 * resuelve con lo que hay o queda vacío: nunca con un texto comercial
 * fabricado.
 */

const MODALIDAD: Record<string, Modalidad> = {
  direct: 'directa',
  preorder: 'encargo',
  quote: 'consultar',
}

/**
 * Disponibilidad a partir del estado real del producto.
 *
 * Sólo tres reglas, todas derivadas de datos que el administrador controla:
 * sin stock cuando lleva control y llegó a cero, con fecha cuando es por
 * encargo, y disponible en el resto. No se infieren plazos ni políticas que
 * nadie validó.
 */
function disponibilidadDe(fila: ProductoConImagen): Disponibilidad {
  if (fila.track_stock && fila.stock_quantity <= 0) return 'agotado'
  if (fila.sale_mode === 'preorder') return 'requiere-fecha'
  return 'disponible'
}

/** Nota bajo el nombre. Vacía si la base no da motivo para ponerla. */
function notaDe(fila: ProductoConImagen): string | undefined {
  if (fila.track_stock && fila.stock_quantity <= 0) return 'Agotado por hoy'
  if (fila.sale_mode === 'preorder' && fila.lead_time_days > 0) {
    return `Se encarga con ${fila.lead_time_days} ${fila.lead_time_days === 1 ? 'día' : 'días'} de anticipación`
  }
  if (fila.sale_mode === 'quote') return 'Se cotiza según la propuesta'
  if (fila.min_quantity > 1) return `Mínimo ${fila.min_quantity} unidades`
  return undefined
}

export interface ProductoStorefront extends Producto {
  /** URL de la foto principal, o `null` si el producto todavía no tiene. */
  imagenUrl: string | null
  imagenAlt: string
  descripcionCorta: string
}

export function aProductoStorefront(
  fila: ProductoConImagen,
  slugCategoria: string,
): ProductoStorefront {
  return {
    slug: fila.slug,
    nombre: fila.name,
    categoria: slugCategoria,
    modalidad: MODALIDAD[fila.sale_mode] ?? 'consultar',
    disponibilidad: disponibilidadDe(fila),
    // `formatearImporte` ya devuelve "Precio pendiente" cuando no hay número,
    // que es exactamente lo que corresponde para un producto a cotizar.
    precio: formatearImporte(fila.price_cents),
    nota: notaDe(fila),
    imagenPendiente: `Falta la foto de ${fila.name}`,
    imagenUrl: fila.imagen ? urlPublica(fila.imagen.path) : null,
    imagenAlt: fila.imagen?.alt ?? '',
    descripcionCorta: fila.short_description,
  }
}

export interface CategoriaStorefront extends Categoria {
  imagenUrl: string | null
}

export function aCategoriaStorefront(
  fila: FilaCategoria,
  indice: number,
  rutaImagen: string | null,
): CategoriaStorefront {
  return {
    slug: fila.slug,
    nombre: fila.name,
    // El número es posicional, como en el diseño: 01, 02, 03…
    numero: String(indice + 1).padStart(2, '0'),
    descripcion: fila.description,
    // El diseño necesita un texto de botón. Se arma con el nombre real de la
    // categoría en lugar de inventar una frase de venta.
    cta: `Ver ${fila.name.toLocaleLowerCase('es')}`,
    imagenPendiente: `Falta la foto de ${fila.name}`,
    imagenUrl: rutaImagen ? urlPublica(rutaImagen) : null,
  }
}
