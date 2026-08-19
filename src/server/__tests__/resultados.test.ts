import { describe, expect, it } from 'vitest'
import { confirmarEscritura, mensajeDeBase } from '../resultados'

/**
 * Estas pruebas fijan la corrección central de la auditoría.
 *
 * Con RLS activo, un UPDATE o un DELETE que ninguna política autoriza no
 * devuelve error: afecta cero filas y termina bien. Verificado contra
 * PostgreSQL 16 en `supabase/tests/01_rls.sql`. Acá se comprueba el otro lado:
 * que la capa de aplicación traduzca esas cero filas a un error visible en vez
 * de a un "Cambios guardados".
 */

const respuesta = (data: unknown[] | null, error: { code?: string; message: string } | null = null) =>
  Promise.resolve({ data, error })

describe('confirmarEscritura', () => {
  it('confirma cuando la escritura alcanzó una fila', async () => {
    const r = await confirmarEscritura(respuesta([{ id: 'abc' }]), 'no alcanzó')
    expect(r.ok).toBe(true)
    expect(r.id).toBe('abc')
    expect(r.error).toBeUndefined()
  })

  it('trata cero filas como error, no como éxito', async () => {
    // El caso de RLS: sin política aplicable no hay error, hay cero filas.
    const r = await confirmarEscritura(respuesta([]), 'no alcanzó')
    expect(r.ok).toBeUndefined()
    expect(r.error).toBe('no alcanzó')
  })

  it('trata data nula como error', async () => {
    const r = await confirmarEscritura(respuesta(null), 'no alcanzó')
    expect(r.ok).toBeUndefined()
    expect(r.error).toBe('no alcanzó')
  })

  it('propaga el error de la base traducido', async () => {
    const r = await confirmarEscritura(
      respuesta(null, { code: '42501', message: 'permission denied for table products' }),
      'no alcanzó',
    )
    expect(r.ok).toBeUndefined()
    expect(r.error).toBe('No tenés permiso para esta operación.')
    // El mensaje crudo de Postgres no llega al operador.
    expect(r.error).not.toContain('permission denied for table')
  })

  it('no inventa un id cuando la fila devuelta no lo trae', async () => {
    const r = await confirmarEscritura(respuesta([{ key: 'hero' }]), 'no alcanzó')
    expect(r.ok).toBe(true)
    expect(r.id).toBeUndefined()
  })
})

describe('mensajeDeBase', () => {
  it('traduce los códigos que el operador puede llegar a ver', () => {
    expect(mensajeDeBase({ code: '23505', message: 'x' })).toContain('Ya existe')
    expect(mensajeDeBase({ code: '23503', message: 'x' })).toContain('relacionado')
    expect(mensajeDeBase({ code: '23514', message: 'x' })).toContain('regla')
    expect(mensajeDeBase({ code: '42501', message: 'x' })).toContain('permiso')
    expect(mensajeDeBase({ code: '22P02', message: 'x' })).toContain('formato')
  })

  it('deja pasar el mensaje original cuando el código es desconocido', () => {
    expect(mensajeDeBase({ code: 'XX000', message: 'algo raro' })).toBe('algo raro')
  })
})
