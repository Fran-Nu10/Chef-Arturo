import { describe, expect, it } from 'vitest'
import {
  aCentesimos,
  calcularTotales,
  formatearImporte,
  ticketPromedio,
} from '../dinero'

describe('aCentesimos', () => {
  it('convierte pesos a centésimos sin error de coma flotante', () => {
    expect(aCentesimos(0.1)).toBe(10)
    expect(aCentesimos(0.2)).toBe(20)
    // El caso que rompe los flotantes: 0.1 + 0.2 !== 0.3
    expect(aCentesimos(0.1) + aCentesimos(0.2)).toBe(aCentesimos(0.3))
  })

  it('redondea al centésimo más cercano', () => {
    expect(aCentesimos(10.005)).toBe(1001)
    expect(aCentesimos(10.004)).toBe(1000)
  })

  it('rechaza importes imposibles', () => {
    expect(() => aCentesimos(-1)).toThrow()
    expect(() => aCentesimos(Number.NaN)).toThrow()
    expect(() => aCentesimos(Number.POSITIVE_INFINITY)).toThrow()
  })
})

describe('calcularTotales', () => {
  it('suma las líneas', () => {
    const t = calcularTotales([
      { unitPriceCents: 45000, quantity: 2 },
      { unitPriceCents: 30000, quantity: 1 },
    ])
    expect(t.subtotalCents).toBe(120000)
    expect(t.totalCents).toBe(120000)
  })

  it('suma el envío y resta el descuento', () => {
    const t = calcularTotales([{ unitPriceCents: 100000, quantity: 1 }], {
      shippingCents: 15000,
      discountCents: 20000,
    })
    expect(t.subtotalCents).toBe(100000)
    expect(t.shippingCents).toBe(15000)
    expect(t.discountCents).toBe(20000)
    expect(t.totalCents).toBe(95000)
  })

  it('nunca deja el total por debajo de cero', () => {
    const t = calcularTotales([{ unitPriceCents: 10000, quantity: 1 }], {
      discountCents: 999999,
    })
    expect(t.totalCents).toBe(0)
    expect(t.discountCents).toBe(10000)
  })

  it('trata un pedido vacío como cero, sin romperse', () => {
    expect(calcularTotales([]).totalCents).toBe(0)
  })

  it('ignora envíos y descuentos negativos en lugar de invertirlos', () => {
    const t = calcularTotales([{ unitPriceCents: 5000, quantity: 1 }], {
      shippingCents: -100,
      discountCents: -100,
    })
    expect(t.shippingCents).toBe(0)
    expect(t.discountCents).toBe(0)
    expect(t.totalCents).toBe(5000)
  })

  it('rechaza cantidades y precios inválidos', () => {
    expect(() => calcularTotales([{ unitPriceCents: 100, quantity: 0 }])).toThrow()
    expect(() => calcularTotales([{ unitPriceCents: 100, quantity: -1 }])).toThrow()
    expect(() => calcularTotales([{ unitPriceCents: -1, quantity: 1 }])).toThrow()
    expect(() => calcularTotales([{ unitPriceCents: 10.5, quantity: 1 }])).toThrow()
  })

  it('aguanta un pedido grande sin perder precisión', () => {
    const lineas = Array.from({ length: 50 }, () => ({
      unitPriceCents: 33_333,
      quantity: 3,
    }))
    expect(calcularTotales(lineas).subtotalCents).toBe(50 * 33_333 * 3)
  })
})

describe('ticketPromedio', () => {
  it('divide el total entre la cantidad de pedidos', () => {
    expect(ticketPromedio(300000, 3)).toBe(100000)
  })

  it('devuelve cero sin pedidos, en vez de inventar una media', () => {
    expect(ticketPromedio(0, 0)).toBe(0)
    expect(ticketPromedio(100000, 0)).toBe(0)
  })
})

describe('formatearImporte', () => {
  it('dice "Precio pendiente" cuando no hay precio', () => {
    expect(formatearImporte(null)).toBe('Precio pendiente')
    expect(formatearImporte(undefined)).toBe('Precio pendiente')
  })

  it('no confunde cero con ausencia de precio', () => {
    expect(formatearImporte(0)).not.toBe('Precio pendiente')
  })
})
