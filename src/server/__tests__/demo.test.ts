import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * El interruptor del modo demostración.
 *
 * Es la puerta que saltea la autenticación, así que la regla que más importa
 * no es "se enciende con la variable" sino "se apaga solo en cuanto hay
 * Supabase". Esa segunda condición es lo que impide que quede abierto por
 * olvido al pasar a producción.
 *
 * `entornoPublico` se arma al cargar el módulo —las variables `NEXT_PUBLIC_`
 * se incrustan en el build—, así que cada caso recarga el módulo con
 * `resetModules()` en lugar de tocar `process.env` y esperar que se note.
 */

const ENTORNO = { ...process.env }

async function cargarEnv(vars: Record<string, string | undefined>) {
  vi.resetModules()
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  return import('@/lib/supabase/env')
}

const SUPABASE = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://ejemplo.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x',
}

const SIN_SUPABASE = {
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
}

beforeEach(() => {
  process.env = { ...ENTORNO }
})

afterEach(() => {
  process.env = { ...ENTORNO }
  vi.resetModules()
})

describe('modoDemo', () => {
  it('se activa con la variable en true y sin Supabase', async () => {
    const env = await cargarEnv({ ...SIN_SUPABASE, DEMO_ADMIN_BYPASS: 'true' })
    expect(env.modoDemo()).toBe(true)
  })

  it('NO se activa si Supabase está configurado, aunque la variable siga en true', async () => {
    // Ésta es la garantía central: al conectar la base real, la puerta se
    // cierra sola sin tener que acordarse de sacar la variable.
    const env = await cargarEnv({ ...SUPABASE, DEMO_ADMIN_BYPASS: 'true' })
    expect(env.modoDemo()).toBe(false)
  })

  it('no se activa sin la variable', async () => {
    const env = await cargarEnv({ ...SIN_SUPABASE, DEMO_ADMIN_BYPASS: undefined })
    expect(env.modoDemo()).toBe(false)
  })

  it('exige exactamente "true": ningún otro valor lo enciende', async () => {
    for (const valor of ['1', 'TRUE', 'True', 'yes', 'sí', 'on', '']) {
      const env = await cargarEnv({ ...SIN_SUPABASE, DEMO_ADMIN_BYPASS: valor })
      expect(env.modoDemo(), `valor ${JSON.stringify(valor)}`).toBe(false)
    }
  })

  it('tampoco se activa con Supabase a medio configurar', async () => {
    // Con una sola de las dos variables no hay backend, así que el modo demo
    // sí se activa. Se deja explícito para que el día que cambie se note.
    const env = await cargarEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://ejemplo.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: undefined,
      DEMO_ADMIN_BYPASS: 'true',
    })
    expect(env.hayBackend()).toBe(false)
    expect(env.modoDemo()).toBe(true)
  })
})

describe('demoAnuladoPorBackend', () => {
  it('avisa cuando se pidió demo pero hay Supabase', async () => {
    const env = await cargarEnv({ ...SUPABASE, DEMO_ADMIN_BYPASS: 'true' })
    expect(env.demoAnuladoPorBackend()).toBe(true)
  })

  it('no avisa si no se pidió demo', async () => {
    const env = await cargarEnv({ ...SUPABASE, DEMO_ADMIN_BYPASS: undefined })
    expect(env.demoAnuladoPorBackend()).toBe(false)
  })

  it('no avisa si la demo está realmente activa', async () => {
    const env = await cargarEnv({ ...SIN_SUPABASE, DEMO_ADMIN_BYPASS: 'true' })
    expect(env.demoAnuladoPorBackend()).toBe(false)
  })
})

describe('panelOperativo', () => {
  it('es verdadero con Supabase', async () => {
    const env = await cargarEnv({ ...SUPABASE, DEMO_ADMIN_BYPASS: undefined })
    expect(env.panelOperativo()).toBe(true)
  })

  it('es verdadero en demostración', async () => {
    const env = await cargarEnv({ ...SIN_SUPABASE, DEMO_ADMIN_BYPASS: 'true' })
    expect(env.panelOperativo()).toBe(true)
  })

  it('es falso sin ninguna de las dos cosas', async () => {
    const env = await cargarEnv({ ...SIN_SUPABASE, DEMO_ADMIN_BYPASS: undefined })
    expect(env.panelOperativo()).toBe(false)
  })
})

describe('la variable de demostración no puede viajar al navegador', () => {
  it('no lleva prefijo público', () => {
    // `NEXT_PUBLIC_` es lo que Next incrusta en el bundle del cliente. Que el
    // nombre no lo tenga es lo que garantiza que el interruptor viva sólo en
    // el servidor.
    expect('DEMO_ADMIN_BYPASS'.startsWith('NEXT_PUBLIC_')).toBe(false)
    expect('DEMO_ADMIN_SECRET'.startsWith('NEXT_PUBLIC_')).toBe(false)
  })

  it('`entornoPublico` sólo expone lo que puede ser público', async () => {
    const env = await cargarEnv({ ...SUPABASE, DEMO_ADMIN_BYPASS: 'true' })
    expect(Object.keys(env.entornoPublico).sort()).toEqual([
      'siteUrl',
      'supabaseKey',
      'supabaseUrl',
    ])
    expect(JSON.stringify(env.entornoPublico)).not.toContain('DEMO')
  })
})
