import { describe, expect, it } from 'vitest'
import {
  ZONA_NEGOCIO,
  diaDelNegocio,
  finDelDiaUtc,
  inicioDelDiaUtc,
  mesDelNegocio,
} from '../zona-horaria'

/**
 * Uruguay está en UTC−3 y no aplica horario de verano desde 2015.
 *
 * El caso que importa es el de la noche: un pedido de las 21:30 en Florida se
 * guarda como las 00:30 UTC del día siguiente. Antes se recortaba la cadena
 * ISO y ese pedido aparecía en el reporte del día equivocado.
 */

describe('diaDelNegocio', () => {
  it('usa la zona de Florida, no UTC', () => {
    // 2026-03-11T00:30Z son las 21:30 del 10 de marzo en Florida.
    expect(diaDelNegocio('2026-03-11T00:30:00.000Z')).toBe('2026-03-10')
  })

  it('el mediodía local cae en el mismo día en las dos zonas', () => {
    expect(diaDelNegocio('2026-03-10T15:00:00.000Z')).toBe('2026-03-10')
  })

  it('recortar la cadena ISO habría dado otro día', () => {
    const instante = '2026-03-11T02:00:00.000Z'
    expect(instante.slice(0, 10)).toBe('2026-03-11')
    expect(diaDelNegocio(instante)).toBe('2026-03-10')
  })

  it('cruza el cambio de mes correctamente', () => {
    // 1 de abril 01:00 UTC = 31 de marzo 22:00 en Florida.
    expect(diaDelNegocio('2026-04-01T01:00:00.000Z')).toBe('2026-03-31')
    expect(mesDelNegocio('2026-04-01T01:00:00.000Z')).toBe('2026-03')
  })

  it('cruza el cambio de año correctamente', () => {
    expect(diaDelNegocio('2027-01-01T02:00:00.000Z')).toBe('2026-12-31')
  })
})

describe('límites del día', () => {
  it('el día en Florida empieza a las 03:00 UTC', () => {
    expect(inicioDelDiaUtc('2026-03-10')).toBe('2026-03-10T03:00:00.000Z')
  })

  it('el fin es el comienzo del día siguiente', () => {
    expect(finDelDiaUtc('2026-03-10')).toBe('2026-03-11T03:00:00.000Z')
  })

  it('un pedido de las 23:00 locales entra en el día que corresponde', () => {
    // 23:00 del 10 en Florida = 02:00 UTC del 11.
    const pedido = '2026-03-11T02:00:00.000Z'
    expect(pedido >= inicioDelDiaUtc('2026-03-10')).toBe(true)
    expect(pedido < finDelDiaUtc('2026-03-10')).toBe(true)
    // Con el corte viejo —`${hasta}T23:59:59.999Z`— quedaba afuera.
    expect(pedido > '2026-03-10T23:59:59.999Z').toBe(true)
  })

  it('el primer instante del día entra y el último queda para el siguiente', () => {
    const inicio = inicioDelDiaUtc('2026-03-10')
    expect(diaDelNegocio(inicio)).toBe('2026-03-10')
    const fin = finDelDiaUtc('2026-03-10')
    expect(diaDelNegocio(fin)).toBe('2026-03-11')
  })

  it('los límites de meses consecutivos encajan sin hueco ni solape', () => {
    expect(finDelDiaUtc('2026-03-31')).toBe(inicioDelDiaUtc('2026-04-01'))
  })

  it('maneja un año bisiesto', () => {
    expect(finDelDiaUtc('2028-02-28')).toBe(inicioDelDiaUtc('2028-02-29'))
    expect(diaDelNegocio('2028-02-29T12:00:00.000Z')).toBe('2028-02-29')
  })
})

describe('ZONA_NEGOCIO', () => {
  it('es la zona de Uruguay y el entorno la conoce', () => {
    expect(ZONA_NEGOCIO).toBe('America/Montevideo')
    expect(() =>
      new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_NEGOCIO }).format(new Date()),
    ).not.toThrow()
  })
})
