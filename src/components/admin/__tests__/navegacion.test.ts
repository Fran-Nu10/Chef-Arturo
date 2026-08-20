import { describe, expect, it } from 'vitest'
import { esRutaActiva } from '../navegacion'

describe('esRutaActiva', () => {
  it('marca solamente el resumen en la raíz del panel', () => {
    const resumen = { href: '/admin', exacto: true }
    expect(esRutaActiva('/admin', resumen)).toBe(true)
    expect(esRutaActiva('/admin/clientes', resumen)).toBe(false)
  })

  it('marca la sección actual y sus pantallas anidadas', () => {
    const clientes = { href: '/admin/clientes' }
    expect(esRutaActiva('/admin/clientes', clientes)).toBe(true)
    expect(esRutaActiva('/admin/clientes/cliente-1', clientes)).toBe(true)
    expect(esRutaActiva('/admin/pedidos', clientes)).toBe(false)
  })

  it('no confunde rutas que sólo comparten un prefijo', () => {
    const pedidos = { href: '/admin/pedidos' }
    expect(esRutaActiva('/admin/pedidos-archivados', pedidos)).toBe(false)
  })
})
