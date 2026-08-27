import { describe, expect, it } from 'vitest'
import { resolverCarrito, resumenDePrecios } from '@/lib/carrito'
import type { LineaCarrito, Producto } from '@/content/tipos'

/**
 * Reglas del carrito.
 *
 * Estas pruebas existen por un bug concreto: el carrito arrancaba con dos
 * líneas de prototipo cuyos slugs no estaban en el catálogo real, y el
 * componente hacía `if (!producto) return null`. Resultado: el contador decía
 * "2 productos" y la lista salía vacía, sin ningún aviso. Ahora una línea que
 * no resuelve se aparta en `huerfanos` y se puede decir qué pasó.
 */

const base: Omit<Producto, 'slug' | 'nombre' | 'precio' | 'precioCentesimos'> = {
  categoria: 'pasteleria',
  modalidad: 'directa',
  disponibilidad: 'disponible',
  imagenPendiente: 'Falta la foto',
}

const producto = (
  slug: string,
  precioCentesimos: number | null,
  extra: Partial<Producto> = {},
): Producto => ({
  ...base,
  slug,
  nombre: slug,
  precio: precioCentesimos === null ? 'Precio pendiente' : `$ ${precioCentesimos / 100}`,
  precioCentesimos,
  ...extra,
})

const linea = (productoSlug: string, cantidad = 1, fecha?: string): LineaCarrito => ({
  productoSlug,
  cantidad,
  fecha,
})

const CATALOGO = [
  producto('cheesecake', 24000),
  producto('lemon-pie-entero', 99000, { modalidad: 'encargo' }),
  producto('empanada', null, { modalidad: 'consultar' }),
]

describe('resolverCarrito', () => {
  it('cruza cada línea con su producto y multiplica por la cantidad', () => {
    const r = resolverCarrito([linea('cheesecake', 3)], CATALOGO)
    expect(r.lineas).toHaveLength(1)
    expect(r.lineas[0].unitario).toBe(24000)
    expect(r.lineas[0].total).toBe(72000)
    expect(r.unidades).toBe(3)
    expect(r.subtotal).toBe(72000)
  })

  it('aparta las líneas cuyo producto ya no existe, sin perder las demás', () => {
    const r = resolverCarrito(
      [linea('pasteleria-01'), linea('cheesecake', 2), linea('pasteleria-02')],
      CATALOGO,
    )
    expect(r.lineas).toHaveLength(1)
    expect(r.lineas[0].producto.slug).toBe('cheesecake')
    expect(r.huerfanos).toEqual(['pasteleria-01', 'pasteleria-02'])
  })

  it('el contador de unidades sólo cuenta lo que se puede mostrar', () => {
    // Ésta es la regresión: antes el contador salía de las líneas guardadas y
    // la lista de las resueltas, así que podían discrepar.
    const r = resolverCarrito([linea('inexistente', 5), linea('cheesecake', 2)], CATALOGO)
    expect(r.unidades).toBe(2)
    expect(r.lineas).toHaveLength(1)
  })

  it('un producto a cotizar no aporta al subtotal ni inventa un precio', () => {
    const r = resolverCarrito([linea('empanada', 4)], CATALOGO)
    expect(r.lineas[0].unitario).toBeNull()
    expect(r.lineas[0].total).toBeNull()
    expect(r.subtotal).toBe(0)
    expect(r.aConsultar).toBe(1)
    expect(r.todoAConsultar).toBe(true)
  })

  it('conserva la fecha de las líneas por encargo', () => {
    const r = resolverCarrito([linea('lemon-pie-entero', 1, '24/12/2026')], CATALOGO)
    expect(r.lineas[0].linea.fecha).toBe('24/12/2026')
  })

  it('un carrito vacío no es un carrito a cotizar', () => {
    const r = resolverCarrito([], CATALOGO)
    expect(r.todoAConsultar).toBe(false)
    expect(r.subtotal).toBe(0)
  })
})

describe('resumenDePrecios', () => {
  it('con todo cotizado muestra el subtotal y ninguna nota', () => {
    const r = resumenDePrecios(
      resolverCarrito([linea('cheesecake', 2), linea('lemon-pie-entero')], CATALOGO),
    )
    // 24000 × 2 + 99000 = 147000 centésimos → "$ 1.470", con separador de miles.
    expect(r.subtotal).toContain('1.470')
    expect(r.nota).toBeNull()
    expect(r.cerrado).toBe(true)
  })

  it('sin ningún precio no dice "pendiente" a secas', () => {
    const r = resumenDePrecios(resolverCarrito([linea('empanada')], CATALOGO))
    expect(r.subtotal).toBeNull()
    expect(r.nota).toBe('Hay productos cuyo precio se confirma por WhatsApp.')
    expect(r.cerrado).toBe(false)
  })

  it('mezclando precios y cotizaciones muestra el subtotal conocido y avisa', () => {
    const r = resumenDePrecios(
      resolverCarrito([linea('cheesecake'), linea('empanada')], CATALOGO),
    )
    // El subtotal es real, pero no se presenta como total definitivo.
    expect(r.subtotal).toContain('240')
    expect(r.nota).toContain('se cotiza por WhatsApp')
    expect(r.cerrado).toBe(false)
  })

  it('pluraliza el aviso cuando hay más de un producto a cotizar', () => {
    const catalogo = [...CATALOGO, producto('tarta', null)]
    const r = resumenDePrecios(
      resolverCarrito(
        [linea('cheesecake'), linea('empanada'), linea('tarta')],
        catalogo,
      ),
    )
    expect(r.nota).toContain('Otros 2 productos')
  })

  it('un carrito vacío no muestra ni subtotal ni nota', () => {
    const r = resumenDePrecios(resolverCarrito([], CATALOGO))
    expect(r.subtotal).toBeNull()
    expect(r.nota).toBeNull()
  })
})
