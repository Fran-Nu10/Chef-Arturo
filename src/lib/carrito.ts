import type { LineaCarrito, Producto } from '@/content/tipos'
import { formatearImporte } from '@/server/dinero'

/**
 * Resolución y totales del carrito.
 *
 * Vive aparte de los componentes porque es la única parte del carrito con
 * reglas propias —qué línea se puede mostrar, qué se puede sumar y qué no— y
 * eso se prueba sin montar nada.
 */

/** Una línea ya cruzada con su producto. */
export interface LineaResuelta {
  linea: LineaCarrito
  producto: Producto
  /** Precio unitario en centésimos, o `null` si el producto se cotiza. */
  unitario: number | null
  /** Total de la línea, o `null` si no hay precio que multiplicar. */
  total: number | null
}

export interface CarritoResuelto {
  lineas: LineaResuelta[]
  /**
   * Slugs que estaban guardados pero ya no existen en el catálogo: producto
   * dado de baja, renombrado, o un carrito viejo del prototipo. Se informan en
   * vez de desaparecer en silencio, que era el bug original.
   */
  huerfanos: string[]
  /** Unidades totales, contando sólo lo que se pudo resolver. */
  unidades: number
  /** Suma de las líneas con precio, en centésimos. */
  subtotal: number
  /** Cuántas líneas quedan a cotizar. */
  aConsultar: number
  /** `true` cuando ninguna línea tiene precio. */
  todoAConsultar: boolean
}

/**
 * Cruza las líneas guardadas con el catálogo.
 *
 * Una línea sin producto no rompe el resto: se aparta en `huerfanos` para que
 * la interfaz pueda decir qué pasó.
 */
export function resolverCarrito(
  lineas: readonly LineaCarrito[],
  productos: readonly Producto[],
): CarritoResuelto {
  const porSlug = new Map(productos.map((p) => [p.slug, p]))
  const resueltas: LineaResuelta[] = []
  const huerfanos: string[] = []

  for (const linea of lineas) {
    const producto = porSlug.get(linea.productoSlug)
    if (!producto) {
      huerfanos.push(linea.productoSlug)
      continue
    }
    const unitario =
      typeof producto.precioCentesimos === 'number' ? producto.precioCentesimos : null
    resueltas.push({
      linea,
      producto,
      unitario,
      total: unitario === null ? null : unitario * linea.cantidad,
    })
  }

  const conPrecio = resueltas.filter((l) => l.total !== null)
  return {
    lineas: resueltas,
    huerfanos,
    unidades: resueltas.reduce((n, l) => n + l.linea.cantidad, 0),
    subtotal: conPrecio.reduce((n, l) => n + (l.total ?? 0), 0),
    aConsultar: resueltas.length - conPrecio.length,
    todoAConsultar: resueltas.length > 0 && conPrecio.length === 0,
  }
}

/**
 * Qué decir en el pie del carrito.
 *
 * Los tres casos del catálogo se dicen distinto a propósito. Mezclar productos
 * con precio y productos a cotizar bajo un único "Total" sería afirmar una
 * cifra que no es el total.
 */
export function resumenDePrecios(carrito: CarritoResuelto): {
  subtotal: string | null
  nota: string | null
  cerrado: boolean
} {
  if (carrito.lineas.length === 0) return { subtotal: null, nota: null, cerrado: false }

  if (carrito.todoAConsultar) {
    return {
      subtotal: null,
      nota: 'Hay productos cuyo precio se confirma por WhatsApp.',
      cerrado: false,
    }
  }

  if (carrito.aConsultar > 0) {
    return {
      subtotal: formatearImporte(carrito.subtotal),
      nota:
        carrito.aConsultar === 1
          ? 'Un producto más se cotiza por WhatsApp y todavía no está sumado.'
          : `Otros ${carrito.aConsultar} productos se cotizan por WhatsApp y todavía no están sumados.`,
      cerrado: false,
    }
  }

  return { subtotal: formatearImporte(carrito.subtotal), nota: null, cerrado: true }
}
