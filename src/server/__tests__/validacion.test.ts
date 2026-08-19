import { describe, expect, it } from 'vitest'
import {
  CategoriaEntrada,
  PedidoPublico,
  ProductoEntrada,
  Slug,
  Telefono,
  TRANSICIONES,
  esEstadoTerminal,
  transicionPermitida,
  validarArchivo,
} from '../validacion'

describe('Slug', () => {
  it('acepta slugs bien formados', () => {
    expect(Slug.parse('torta-de-chocolate')).toBe('torta-de-chocolate')
    expect(Slug.parse('pasteleria01')).toBe('pasteleria01')
  })

  it('rechaza mayúsculas, espacios, acentos y guiones dobles', () => {
    for (const malo of ['Torta', 'torta de', 'pastelería', 'torta--doble', '-torta', 'torta-']) {
      expect(Slug.safeParse(malo).success).toBe(false)
    }
  })
})

describe('Telefono', () => {
  it('normaliza a dígitos', () => {
    expect(Telefono.parse('099 111 222')).toBe('099111222')
    expect(Telefono.parse('+598 99 111 222')).toBe('59899111222')
    expect(Telefono.parse('(099) 111-222')).toBe('099111222')
  })

  it('rechaza lo que no llega a ser un teléfono', () => {
    expect(Telefono.safeParse('123').success).toBe(false)
    expect(Telefono.safeParse('sin números').success).toBe(false)
  })
})

describe('ProductoEntrada', () => {
  const base = { slug: 'producto-x', name: 'Producto X' }

  it('exige precio en compra directa', () => {
    const r = ProductoEntrada.safeParse({ ...base, saleMode: 'direct' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('priceCents'))).toBe(true)
    }
  })

  it('permite un producto a cotizar sin precio', () => {
    expect(ProductoEntrada.safeParse({ ...base, saleMode: 'quote' }).success).toBe(true)
  })

  it('convierte el precio de pesos a centésimos', () => {
    const r = ProductoEntrada.parse({ ...base, saleMode: 'direct', priceCents: 450.5 })
    expect(r.priceCents).toBe(45050)
  })

  it('rechaza precios negativos', () => {
    const r = ProductoEntrada.safeParse({ ...base, saleMode: 'direct', priceCents: -1 })
    expect(r.success).toBe(false)
  })

  it('rechaza stock negativo', () => {
    const r = ProductoEntrada.safeParse({
      ...base,
      saleMode: 'quote',
      stockQuantity: -5,
    })
    expect(r.success).toBe(false)
  })

  it('exige cantidad mínima de al menos 1', () => {
    expect(
      ProductoEntrada.safeParse({ ...base, saleMode: 'quote', minQuantity: 0 }).success,
    ).toBe(false)
  })
})

describe('CategoriaEntrada', () => {
  it('valida el slug de la categoría', () => {
    expect(CategoriaEntrada.safeParse({ slug: 'Pastelería', name: 'X' }).success).toBe(false)
    expect(CategoriaEntrada.safeParse({ slug: 'pasteleria', name: 'Pastelería' }).success).toBe(
      true,
    )
  })
})

describe('validarArchivo', () => {
  it('acepta los formatos previstos', () => {
    expect(validarArchivo({ type: 'image/webp', size: 1000 }).ok).toBe(true)
    expect(validarArchivo({ type: 'video/mp4', size: 1000 }).ok).toBe(true)
  })

  it('rechaza formatos peligrosos o inesperados', () => {
    expect(validarArchivo({ type: 'image/svg+xml', size: 10 }).ok).toBe(false)
    expect(validarArchivo({ type: 'text/html', size: 10 }).ok).toBe(false)
    expect(validarArchivo({ type: 'application/x-msdownload', size: 10 }).ok).toBe(false)
  })

  it('rechaza archivos que superan el límite', () => {
    expect(validarArchivo({ type: 'image/jpeg', size: 11 * 1024 * 1024 }).ok).toBe(false)
  })
})

describe('PedidoPublico', () => {
  const base = {
    customerName: 'Ana',
    customerPhone: '099111222',
    fulfillment: 'pickup' as const,
    paymentMethod: 'whatsapp' as const,
    items: [{ productId: '11111111-1111-4111-8111-111111111111', quantity: 2 }],
  }

  it('acepta un pedido bien formado', () => {
    expect(PedidoPublico.safeParse(base).success).toBe(true)
  })

  it('no admite ningún campo de importe: el precio lo pone el servidor', () => {
    const conPrecio = PedidoPublico.parse({
      ...base,
      totalCents: 1,
      items: [{ ...base.items[0], unitPriceCents: 1 }],
    }) as Record<string, unknown>
    expect(conPrecio.totalCents).toBeUndefined()
    expect((conPrecio.items as Record<string, unknown>[])[0].unitPriceCents).toBeUndefined()
  })

  it('sólo acepta los métodos de pago que el comprador puede elegir', () => {
    expect(PedidoPublico.safeParse({ ...base, paymentMethod: 'cash' }).success).toBe(false)
  })

  it('exige dirección cuando hay entrega a domicilio', () => {
    expect(PedidoPublico.safeParse({ ...base, fulfillment: 'delivery' }).success).toBe(false)
    expect(
      PedidoPublico.safeParse({
        ...base,
        fulfillment: 'delivery',
        address: 'Calle 123',
      }).success,
    ).toBe(true)
  })

  it('rechaza pedidos vacíos o desmesurados', () => {
    expect(PedidoPublico.safeParse({ ...base, items: [] }).success).toBe(false)
    expect(
      PedidoPublico.safeParse({
        ...base,
        items: Array.from({ length: 51 }, () => base.items[0]),
      }).success,
    ).toBe(false)
  })

  it('rechaza cantidades cero o negativas', () => {
    expect(
      PedidoPublico.safeParse({
        ...base,
        items: [{ ...base.items[0], quantity: 0 }],
      }).success,
    ).toBe(false)
  })
})

describe('transiciones de estado', () => {
  it('permite el avance previsto', () => {
    expect(transicionPermitida('pending', 'confirmed')).toBe(true)
    expect(transicionPermitida('confirmed', 'preparing')).toBe(true)
    expect(transicionPermitida('preparing', 'ready')).toBe(true)
    expect(transicionPermitida('ready', 'completed')).toBe(true)
  })

  it('permite cancelar desde cualquier estado en curso', () => {
    for (const estado of ['pending', 'confirmed', 'preparing', 'ready'] as const) {
      expect(transicionPermitida(estado, 'cancelled')).toBe(true)
    }
  })

  it('no permite saltear pasos ni retroceder', () => {
    expect(transicionPermitida('pending', 'ready')).toBe(false)
    expect(transicionPermitida('ready', 'pending')).toBe(false)
    expect(transicionPermitida('completed', 'preparing')).toBe(false)
  })

  it('trata completado y cancelado como terminales', () => {
    expect(esEstadoTerminal('completed')).toBe(true)
    expect(esEstadoTerminal('cancelled')).toBe(true)
    expect(esEstadoTerminal('pending')).toBe(false)
  })

  it('no deja ningún estado fuera del mapa', () => {
    const estados = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'completed',
      'cancelled',
    ] as const
    for (const e of estados) expect(TRANSICIONES[e]).toBeDefined()
  })
})
