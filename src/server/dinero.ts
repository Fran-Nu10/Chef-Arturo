/**
 * Dinero.
 *
 * Todo importe se mueve en centésimos enteros. Los flotantes no sirven para
 * cobrar: 0.1 + 0.2 da 0.30000000000000004, y ese error se acumula en cada
 * línea de cada pedido.
 */

export const MONEDA = 'UYU' as const

/** Convierte pesos a centésimos. Rechaza lo que no sea un importe razonable. */
export function aCentesimos(pesos: number): number {
  if (!Number.isFinite(pesos)) throw new RangeError('Importe inválido')
  if (pesos < 0) throw new RangeError('Un importe no puede ser negativo')
  const centesimos = Math.round(pesos * 100)
  if (!Number.isSafeInteger(centesimos)) throw new RangeError('Importe fuera de rango')
  return centesimos
}

/** Formatea centésimos para mostrar. */
export function formatearImporte(centesimos: number | null | undefined): string {
  if (centesimos === null || centesimos === undefined) return 'Precio pendiente'
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: MONEDA,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(centesimos / 100)
}

export interface LineaCalculable {
  unitPriceCents: number
  quantity: number
}

export interface TotalesPedido {
  subtotalCents: number
  shippingCents: number
  discountCents: number
  totalCents: number
}

/**
 * Recalcula los totales de un pedido.
 *
 * Espeja lo que hace `create_public_order` en la base. Existe en TypeScript
 * para poder probarlo con precisión y para que el panel muestre el mismo
 * número que va a guardar el servidor — nunca para reemplazar el cálculo de
 * la base, que es la única fuente de verdad de lo que se cobra.
 *
 * El descuento no puede dejar el total por debajo de cero.
 */
export function calcularTotales(
  lineas: LineaCalculable[],
  opciones: { shippingCents?: number; discountCents?: number } = {},
): TotalesPedido {
  const envio = Math.max(0, Math.trunc(opciones.shippingCents ?? 0))
  const descuentoPedido = Math.max(0, Math.trunc(opciones.discountCents ?? 0))

  let subtotal = 0
  for (const linea of lineas) {
    if (!Number.isInteger(linea.unitPriceCents) || linea.unitPriceCents < 0) {
      throw new RangeError('Precio unitario inválido')
    }
    if (!Number.isInteger(linea.quantity) || linea.quantity <= 0) {
      throw new RangeError('Cantidad inválida')
    }
    subtotal += linea.unitPriceCents * linea.quantity
  }

  // El descuento nunca puede superar subtotal + envío.
  const descuento = Math.min(descuentoPedido, subtotal + envio)
  const total = subtotal + envio - descuento

  return {
    subtotalCents: subtotal,
    shippingCents: envio,
    discountCents: descuento,
    totalCents: total,
  }
}

/** Ticket promedio. Sin pedidos, es cero: no se inventa una media. */
export function ticketPromedio(totalCents: number, cantidadPedidos: number): number {
  if (cantidadPedidos <= 0) return 0
  return Math.round(totalCents / cantidadPedidos)
}
