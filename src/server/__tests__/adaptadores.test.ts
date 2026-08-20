import { describe, expect, it } from 'vitest'
import { aCategoriaStorefront, aProductoStorefront } from '../storefront/adaptadores'
import type { ProductoConImagen } from '../catalogo/repositorio'
import type { FilaCategoria } from '@/lib/supabase/tipos'

/**
 * El puente entre las filas de Supabase y lo que dibuja el diseño.
 *
 * Estas pruebas fijan la regla que gobierna el adaptador: **no inventar**.
 * Cada campo que el diseño pide y la base no tiene se resuelve con lo que hay
 * o queda vacío, nunca con un texto comercial fabricado.
 */

const producto = (p: Partial<ProductoConImagen> = {}): ProductoConImagen => ({
  id: 'a1',
  slug: 'torta',
  name: 'Torta',
  category_id: 'c1',
  short_description: 'Descripción corta.',
  full_description: '',
  price_cents: 145000,
  currency: 'UYU',
  status: 'active',
  sale_mode: 'direct',
  is_featured: false,
  position: 1,
  track_stock: false,
  stock_quantity: 0,
  low_stock_threshold: 0,
  lead_time_days: 0,
  min_quantity: 1,
  fulfillment: 'both',
  seo_title: null,
  seo_description: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  archived_at: null,
  imagen: null,
  ...p,
})

describe('aProductoStorefront · modalidad', () => {
  it('traduce las tres modalidades de la base', () => {
    expect(aProductoStorefront(producto({ sale_mode: 'direct' }), 'x').modalidad).toBe('directa')
    expect(aProductoStorefront(producto({ sale_mode: 'preorder' }), 'x').modalidad).toBe('encargo')
    expect(aProductoStorefront(producto({ sale_mode: 'quote' }), 'x').modalidad).toBe('consultar')
  })
})

describe('aProductoStorefront · precio', () => {
  it('formatea el importe en pesos uruguayos', () => {
    const p = aProductoStorefront(producto({ price_cents: 145000 }), 'x')
    expect(p.precio).toContain('1.450')
  })

  it('sin precio dice "Precio pendiente", no cero', () => {
    const p = aProductoStorefront(producto({ price_cents: null, sale_mode: 'quote' }), 'x')
    expect(p.precio).toBe('Precio pendiente')
    expect(p.precio).not.toContain('0')
  })
})

describe('aProductoStorefront · disponibilidad', () => {
  it('marca agotado sólo si lleva control de stock y llegó a cero', () => {
    expect(
      aProductoStorefront(producto({ track_stock: true, stock_quantity: 0 }), 'x').disponibilidad,
    ).toBe('agotado')
    // Sin control de stock, un cero no significa nada.
    expect(
      aProductoStorefront(producto({ track_stock: false, stock_quantity: 0 }), 'x').disponibilidad,
    ).toBe('disponible')
  })

  it('un producto por encargo requiere fecha', () => {
    expect(aProductoStorefront(producto({ sale_mode: 'preorder' }), 'x').disponibilidad).toBe(
      'requiere-fecha',
    )
  })

  it('sin stock gana sobre por encargo: primero hay que tenerlo', () => {
    const p = producto({ sale_mode: 'preorder', track_stock: true, stock_quantity: 0 })
    expect(aProductoStorefront(p, 'x').disponibilidad).toBe('agotado')
  })
})

describe('aProductoStorefront · nota', () => {
  it('sin motivo, no hay nota', () => {
    expect(aProductoStorefront(producto(), 'x').nota).toBeUndefined()
  })

  it('la anticipación sale de lead_time_days y concuerda en número', () => {
    expect(
      aProductoStorefront(producto({ sale_mode: 'preorder', lead_time_days: 1 }), 'x').nota,
    ).toBe('Se encarga con 1 día de anticipación')
    expect(
      aProductoStorefront(producto({ sale_mode: 'preorder', lead_time_days: 3 }), 'x').nota,
    ).toBe('Se encarga con 3 días de anticipación')
  })

  it('la cantidad mínima se dice cuando es mayor que uno', () => {
    expect(aProductoStorefront(producto({ min_quantity: 6 }), 'x').nota).toBe('Mínimo 6 unidades')
    expect(aProductoStorefront(producto({ min_quantity: 1 }), 'x').nota).toBeUndefined()
  })
})

describe('aProductoStorefront · imagen', () => {
  it('sin foto deja la URL en null y un texto de hueco con el nombre real', () => {
    const p = aProductoStorefront(producto({ name: 'Lemon pie' }), 'x')
    expect(p.imagenUrl).toBeNull()
    expect(p.imagenPendiente).toContain('Lemon pie')
  })

  it('con foto arma la URL y conserva el texto alternativo', () => {
    const p = aProductoStorefront(
      producto({ imagen: { path: 'productos/torta.jpg', alt: 'Torta sobre un plato' } }),
      'x',
    )
    expect(p.imagenUrl).toContain('productos/torta.jpg')
    expect(p.imagenAlt).toBe('Torta sobre un plato')
  })
})

describe('aCategoriaStorefront', () => {
  const categoria = (c: Partial<FilaCategoria> = {}): FilaCategoria => ({
    id: 'c1',
    slug: 'pasteleria',
    name: 'Pastelería',
    description: 'Tortas y piezas dulces.',
    position: 1,
    is_active: true,
    image_id: null,
    seo_title: null,
    seo_description: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...c,
  })

  it('numera por posición en la lista, como el diseño', () => {
    expect(aCategoriaStorefront(categoria(), 0, null).numero).toBe('01')
    expect(aCategoriaStorefront(categoria(), 9, null).numero).toBe('10')
  })

  it('el texto del botón usa el nombre real, sin inventar una frase de venta', () => {
    expect(aCategoriaStorefront(categoria({ name: 'Merienda' }), 0, null).cta).toBe('Ver merienda')
  })

  it('la descripción es la que cargó el administrador, tal cual', () => {
    const c = aCategoriaStorefront(categoria({ description: 'Lo que sea que escriban.' }), 0, null)
    expect(c.descripcion).toBe('Lo que sea que escriban.')
  })

  it('sin imagen, URL nula', () => {
    expect(aCategoriaStorefront(categoria(), 0, null).imagenUrl).toBeNull()
  })
})
