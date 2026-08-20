import { describe, expect, it } from 'vitest'
import {
  detectarFormatoImagen,
  esRutaDeSubida,
  mimeDeRuta,
  rutaDeSubida,
} from '@/lib/imagenes'
import { slugificar } from '@/server/validacion'
import {
  aplicarImagenDeCategoria,
  aplicarImagenDeProducto,
  leerImagenDelFormulario,
  registrarImagenDeContenido,
  type EnvioDeImagen,
} from '@/server/medios/imagenes'

// ── Detección de formato por firma binaria ──────────────────────────────────

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
const WEBP = new Uint8Array([...'RIFF'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WEBP'].map((c) => c.charCodeAt(0))))
const AVIF = new Uint8Array([0, 0, 0, 0x1c].concat([...'ftypavif'].map((c) => c.charCodeAt(0))))
const SVG = new Uint8Array([...'<svg xmlns="h'].map((c) => c.charCodeAt(0)))
const HTML = new Uint8Array([...'<!doctype htm'].map((c) => c.charCodeAt(0)))

describe('detectarFormatoImagen', () => {
  it('reconoce los cuatro formatos permitidos por su firma', () => {
    expect(detectarFormatoImagen(JPEG)).toBe('image/jpeg')
    expect(detectarFormatoImagen(PNG)).toBe('image/png')
    expect(detectarFormatoImagen(WEBP)).toBe('image/webp')
    expect(detectarFormatoImagen(AVIF)).toBe('image/avif')
  })

  it('acepta AVIF de secuencia (avis)', () => {
    const avis = new Uint8Array([0, 0, 0, 0x1c].concat([...'ftypavis'].map((c) => c.charCodeAt(0))))
    expect(detectarFormatoImagen(avis)).toBe('image/avif')
  })

  it('rechaza SVG y HTML aunque se renombren como .jpg', () => {
    // El nombre no importa: la firma es la del contenido real.
    expect(detectarFormatoImagen(SVG)).toBeNull()
    expect(detectarFormatoImagen(HTML)).toBeNull()
  })

  it('rechaza archivos truncados o vacíos', () => {
    expect(detectarFormatoImagen(new Uint8Array([]))).toBeNull()
    expect(detectarFormatoImagen(JPEG.slice(0, 4))).toBeNull()
  })

  it('rechaza un RIFF que no es WebP (por ejemplo un WAV)', () => {
    const wav = new Uint8Array([...'RIFF'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WAVE'].map((c) => c.charCodeAt(0))))
    expect(detectarFormatoImagen(wav)).toBeNull()
  })
})

// ── Rutas de subida ─────────────────────────────────────────────────────────

describe('rutas de subida', () => {
  const uuid = '11111111-2222-4333-8444-555555555555'

  it('genera <carpeta>/<uuid>.<ext> y la valida de vuelta', () => {
    const ruta = rutaDeSubida('productos', uuid, 'image/jpeg')
    expect(ruta).toBe(`productos/${uuid}.jpg`)
    expect(esRutaDeSubida(ruta, 'productos')).toBe(true)
    expect(mimeDeRuta(ruta)).toBe('image/jpeg')
  })

  it('exige que la carpeta coincida con el flujo que sube', () => {
    expect(esRutaDeSubida(`productos/${uuid}.jpg`, 'categorias')).toBe(false)
    expect(esRutaDeSubida(`categorias/${uuid}.webp`, 'categorias')).toBe(true)
    expect(esRutaDeSubida(`contenido/${uuid}.avif`, 'contenido')).toBe(true)
  })

  it('rechaza cualquier intento de escaparse de la carpeta', () => {
    expect(esRutaDeSubida(`../productos/${uuid}.jpg`)).toBe(false)
    expect(esRutaDeSubida(`productos/../private/${uuid}.jpg`)).toBe(false)
    expect(esRutaDeSubida(`productos/sub/${uuid}.jpg`)).toBe(false)
    expect(esRutaDeSubida('productos/foto de julia.jpg')).toBe(false)
    expect(esRutaDeSubida(`otros/${uuid}.jpg`)).toBe(false)
    expect(esRutaDeSubida(`productos/${uuid}.svg`)).toBe(false)
    expect(esRutaDeSubida(`productos/${uuid}`)).toBe(false)
    expect(esRutaDeSubida('productos/AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE.jpg')).toBe(false)
  })
})

// ── Slug automático ─────────────────────────────────────────────────────────

describe('slugificar', () => {
  it('normaliza acentos, eñes y símbolos', () => {
    expect(slugificar('Bombones de Dulce de Leche')).toBe('bombones-de-dulce-de-leche')
    expect(slugificar('Petit Fours · Clásicos')).toBe('petit-fours-clasicos')
    expect(slugificar('  Ñoquis & Salsas!!  ')).toBe('noquis-salsas')
  })

  it('cae al respaldo si el nombre no deja nada usable', () => {
    expect(slugificar('!!!')).toBe('producto')
    expect(slugificar('$', 'categoria')).toBe('categoria')
  })

  it('recorta a un largo que deja lugar para el sufijo de colisión', () => {
    expect(slugificar('a'.repeat(200)).length).toBeLessThanOrEqual(72)
  })
})

// ── Lectura del formulario ──────────────────────────────────────────────────

const UUID = '11111111-2222-4333-8444-555555555555'

describe('leerImagenDelFormulario', () => {
  it('sin campos de imagen no hay cambios', () => {
    const envio = leerImagenDelFormulario(new FormData(), 'productos')
    expect(envio).toEqual({ nueva: null, quitar: false })
  })

  it('lee una subida válida con sus metadatos', () => {
    const datos = new FormData()
    datos.set('imagenNueva', `productos/${UUID}.jpg`)
    datos.set('imagenAncho', '1600')
    datos.set('imagenAlto', '2000')
    datos.set('imagenPeso', '480000')
    expect(leerImagenDelFormulario(datos, 'productos')).toEqual({
      nueva: { path: `productos/${UUID}.jpg`, width: 1600, height: 2000, bytes: 480000 },
      quitar: false,
    })
  })

  it('descarta metadatos absurdos sin rechazar la imagen', () => {
    const datos = new FormData()
    datos.set('imagenNueva', `productos/${UUID}.jpg`)
    datos.set('imagenAncho', '-5')
    datos.set('imagenPeso', String(50 * 1024 * 1024))
    const envio = leerImagenDelFormulario(datos, 'productos') as EnvioDeImagen
    expect(envio.nueva).toMatchObject({ width: null, bytes: null })
  })

  it('rechaza rutas adulteradas o de otra carpeta', () => {
    for (const ruta of [`categorias/${UUID}.jpg`, '../etc/passwd', 'productos/x.jpg']) {
      const datos = new FormData()
      datos.set('imagenNueva', ruta)
      expect(leerImagenDelFormulario(datos, 'productos')).toHaveProperty('error')
    }
  })

  it('lee la señal de quitar', () => {
    const datos = new FormData()
    datos.set('imagenQuitar', '1')
    expect(leerImagenDelFormulario(datos, 'productos')).toEqual({ nueva: null, quitar: true })
  })
})

// ── Cliente falso para los flujos de guardado ───────────────────────────────

interface Operacion {
  tabla: string
  op: string
  datos?: unknown
  filtros: Record<string, unknown>
}

type Respuesta = { data?: unknown; error?: { code?: string; message: string } }
type Responder = (op: Operacion) => Respuesta

/**
 * Imita lo justo del cliente de Supabase: consultas encadenables y thenables,
 * `rpc` y `storage.remove`. Registra cada operación en orden, que es lo que
 * estas pruebas verifican: qué se tocó, con qué datos y en qué secuencia.
 */
function clienteFalso(responder: Responder) {
  const operaciones: Operacion[] = []
  const borradosStorage: string[] = []
  let fallarStorage = false

  class Consulta {
    op = 'select'
    datos: unknown
    filtros: Record<string, unknown> = {}
    constructor(private tabla: string) {}
    select() { return this }
    insert(d: unknown) { this.op = 'insert'; this.datos = d; return this }
    update(d: unknown) { this.op = 'update'; this.datos = d; return this }
    delete() { this.op = 'delete'; return this }
    eq(c: string, v: unknown) { this.filtros[c] = v; return this }
    neq() { return this }
    order() { return this }
    limit() { return this }
    maybeSingle() { return this }
    single() { return this }
    then(resolver: (r: { data: unknown; error: unknown }) => unknown, rechazar?: (e: unknown) => unknown) {
      const registro: Operacion = {
        tabla: this.tabla, op: this.op, datos: this.datos, filtros: this.filtros,
      }
      operaciones.push(registro)
      const r = responder(registro)
      return Promise
        .resolve({ data: r.data ?? null, error: r.error ?? null })
        .then(resolver, rechazar)
    }
  }

  const cliente = {
    from: (tabla: string) => new Consulta(tabla),
    rpc: async (fn: string, args: Record<string, unknown>) => {
      const registro: Operacion = { tabla: `rpc:${fn}`, op: 'rpc', datos: args, filtros: {} }
      operaciones.push(registro)
      const r = responder(registro)
      return { data: r.data ?? [], error: r.error ?? null }
    },
    storage: {
      from: () => ({
        remove: async (rutas: string[]) => {
          borradosStorage.push(...rutas)
          return { error: fallarStorage ? { message: 'sin red' } : null }
        },
      }),
    },
  }

  return {
    cliente: cliente as unknown as Parameters<typeof aplicarImagenDeProducto>[0],
    operaciones,
    borradosStorage,
    romperStorage: () => { fallarStorage = true },
  }
}

const NUEVA = {
  path: `productos/${UUID}.jpg`,
  width: 1600,
  height: 2000,
  bytes: 480000,
} as const

describe('aplicarImagenDeProducto', () => {
  it('sin cambios de imagen no toca nada', async () => {
    const { cliente, operaciones } = clienteFalso(() => ({}))
    const r = await aplicarImagenDeProducto(cliente, 'p1', 'Torta', { nueva: null, quitar: false })
    expect(r.ok).toBe(true)
    expect(operaciones).toHaveLength(0)
  })

  it('producto sin foto: registra el medio y crea la relación principal', async () => {
    const { cliente, operaciones } = clienteFalso((op) => {
      if (op.tabla === 'media_assets' && op.op === 'insert') return { data: { id: 'm-nuevo' } }
      if (op.tabla === 'product_images' && op.op === 'insert') return { data: [{ id: 'rel-1' }] }
      return {}
    })
    const r = await aplicarImagenDeProducto(cliente, 'p1', 'Torta de chocolate', {
      nueva: { ...NUEVA }, quitar: false,
    })
    expect(r.ok).toBe(true)

    const registro = operaciones.find((o) => o.tabla === 'media_assets' && o.op === 'insert')
    expect(registro?.datos).toMatchObject({
      bucket: 'media',
      path: NUEVA.path,
      alt: 'Torta de chocolate',
      mime_type: 'image/jpeg',
      is_temporary: false,
    })
    const relacion = operaciones.find((o) => o.tabla === 'product_images' && o.op === 'insert')
    expect(relacion?.datos).toMatchObject({ product_id: 'p1', media_id: 'm-nuevo', is_primary: true })
  })

  it('reemplazo: actualiza la relación antes de borrar la foto anterior, y sólo si quedó huérfana', async () => {
    const { cliente, operaciones, borradosStorage } = clienteFalso((op) => {
      if (op.tabla === 'product_images' && op.op === 'select') {
        return { data: { id: 'rel-1', media_id: 'm-viejo' } }
      }
      if (op.tabla === 'media_assets' && op.op === 'insert') return { data: { id: 'm-nuevo' } }
      if (op.tabla === 'product_images' && op.op === 'update') return { data: [{ id: 'rel-1' }] }
      if (op.tabla === 'rpc:media_asset_usage') return { data: [] }
      if (op.tabla === 'media_assets' && op.op === 'select') {
        return { data: { bucket: 'media', path: 'productos/vieja.jpg' } }
      }
      if (op.tabla === 'media_assets' && op.op === 'delete') return { data: [{ id: 'm-viejo' }] }
      return {}
    })

    const r = await aplicarImagenDeProducto(cliente, 'p1', 'Torta', { nueva: { ...NUEVA }, quitar: false })
    expect(r.ok).toBe(true)

    const orden = operaciones.map((o) => `${o.tabla}:${o.op}`)
    const posRelacion = orden.indexOf('product_images:update')
    const posBorrado = orden.indexOf('media_assets:delete')
    expect(posRelacion).toBeGreaterThan(-1)
    expect(posBorrado).toBeGreaterThan(posRelacion)
    expect(borradosStorage).toEqual(['productos/vieja.jpg'])
  })

  it('una imagen compartida por otro registro jamás se borra', async () => {
    const { cliente, operaciones, borradosStorage } = clienteFalso((op) => {
      if (op.tabla === 'product_images' && op.op === 'select') {
        return { data: { id: 'rel-1', media_id: 'm-compartido' } }
      }
      if (op.tabla === 'media_assets' && op.op === 'insert') return { data: { id: 'm-nuevo' } }
      if (op.tabla === 'product_images' && op.op === 'update') return { data: [{ id: 'rel-1' }] }
      if (op.tabla === 'rpc:media_asset_usage') {
        return { data: [{ usage_kind: 'product', usage_id: 'p2', usage_label: 'Otro producto' }] }
      }
      return {}
    })

    const r = await aplicarImagenDeProducto(cliente, 'p1', 'Torta', { nueva: { ...NUEVA }, quitar: false })
    expect(r.ok).toBe(true)
    expect(operaciones.some((o) => o.tabla === 'media_assets' && o.op === 'delete')).toBe(false)
    expect(borradosStorage).toEqual([])
  })

  it('si no puede comprobar el uso, no borra nada', async () => {
    const { cliente, operaciones } = clienteFalso((op) => {
      if (op.tabla === 'product_images' && op.op === 'select') {
        return { data: { id: 'rel-1', media_id: 'm-viejo' } }
      }
      if (op.tabla === 'product_images' && op.op === 'delete') return { data: [{ id: 'rel-1' }] }
      if (op.tabla === 'rpc:media_asset_usage') return { error: { message: 'sin permiso' } }
      return {}
    })
    const r = await aplicarImagenDeProducto(cliente, 'p1', 'Torta', { nueva: null, quitar: true })
    expect(r.ok).toBe(true)
    expect(operaciones.some((o) => o.tabla === 'media_assets' && o.op === 'delete')).toBe(false)
  })

  it('quitar: borra la relación y limpia la foto huérfana', async () => {
    const { cliente, borradosStorage } = clienteFalso((op) => {
      if (op.tabla === 'product_images' && op.op === 'select') {
        return { data: { id: 'rel-1', media_id: 'm-viejo' } }
      }
      if (op.tabla === 'product_images' && op.op === 'delete') return { data: [{ id: 'rel-1' }] }
      if (op.tabla === 'rpc:media_asset_usage') return { data: [] }
      if (op.tabla === 'media_assets' && op.op === 'select') {
        return { data: { bucket: 'media', path: 'productos/vieja.jpg' } }
      }
      if (op.tabla === 'media_assets' && op.op === 'delete') return { data: [{ id: 'm-viejo' }] }
      return {}
    })
    const r = await aplicarImagenDeProducto(cliente, 'p1', 'Torta', { nueva: null, quitar: true })
    expect(r.ok).toBe(true)
    expect(borradosStorage).toEqual(['productos/vieja.jpg'])
  })

  it('si la base falla al registrar, el archivo subido se elimina de Storage', async () => {
    const { cliente, borradosStorage } = clienteFalso((op) => {
      if (op.tabla === 'media_assets' && op.op === 'insert') {
        return { error: { code: '42501', message: 'permiso denegado' } }
      }
      return {}
    })
    const r = await aplicarImagenDeProducto(cliente, 'p1', 'Torta', { nueva: { ...NUEVA }, quitar: false })
    expect(r.ok).toBeUndefined()
    expect(r.error).toBeTruthy()
    expect(borradosStorage).toEqual([NUEVA.path])
  })

  it('si falla la relación después de registrar, deshace el registro y el archivo', async () => {
    const { cliente, operaciones, borradosStorage } = clienteFalso((op) => {
      if (op.tabla === 'media_assets' && op.op === 'insert') return { data: { id: 'm-nuevo' } }
      if (op.tabla === 'product_images' && op.op === 'insert') {
        return { error: { code: '23503', message: 'fk' } }
      }
      if (op.tabla === 'media_assets' && op.op === 'delete') return { data: [{ id: 'm-nuevo' }] }
      return {}
    })
    const r = await aplicarImagenDeProducto(cliente, 'p1', 'Torta', { nueva: { ...NUEVA }, quitar: false })
    expect(r.error).toBeTruthy()
    const deshecho = operaciones.find((o) => o.tabla === 'media_assets' && o.op === 'delete')
    expect(deshecho?.filtros).toMatchObject({ id: 'm-nuevo' })
    expect(borradosStorage).toEqual([NUEVA.path])
  })
})

describe('aplicarImagenDeCategoria', () => {
  const NUEVA_CAT = { ...NUEVA, path: `categorias/${UUID}.webp` }

  it('vincula la foto nueva con alt automático «Categoría <nombre>»', async () => {
    const { cliente, operaciones } = clienteFalso((op) => {
      if (op.tabla === 'categories' && op.op === 'select') return { data: { image_id: null } }
      if (op.tabla === 'media_assets' && op.op === 'insert') return { data: { id: 'm-cat' } }
      if (op.tabla === 'categories' && op.op === 'update') return { data: [{ id: 'c1' }] }
      return {}
    })
    const r = await aplicarImagenDeCategoria(cliente, 'c1', 'Pastelería', {
      nueva: { ...NUEVA_CAT }, quitar: false,
    })
    expect(r.ok).toBe(true)
    const registro = operaciones.find((o) => o.tabla === 'media_assets' && o.op === 'insert')
    expect(registro?.datos).toMatchObject({ alt: 'Categoría Pastelería', mime_type: 'image/webp' })
    const enlace = operaciones.find((o) => o.tabla === 'categories' && o.op === 'update')
    expect(enlace?.datos).toEqual({ image_id: 'm-cat' })
  })

  it('quitar limpia image_id y borra la foto sólo si quedó huérfana', async () => {
    const { cliente, borradosStorage } = clienteFalso((op) => {
      if (op.tabla === 'categories' && op.op === 'select') return { data: { image_id: 'm-cat' } }
      if (op.tabla === 'categories' && op.op === 'update') return { data: [{ id: 'c1' }] }
      if (op.tabla === 'rpc:media_asset_usage') return { data: [] }
      if (op.tabla === 'media_assets' && op.op === 'select') {
        return { data: { bucket: 'media', path: 'categorias/vieja.webp' } }
      }
      if (op.tabla === 'media_assets' && op.op === 'delete') return { data: [{ id: 'm-cat' }] }
      return {}
    })
    const r = await aplicarImagenDeCategoria(cliente, 'c1', 'Pastelería', { nueva: null, quitar: true })
    expect(r.ok).toBe(true)
    expect(borradosStorage).toEqual(['categorias/vieja.webp'])
  })

  it('si el enlace falla, deshace el registro y el archivo subido', async () => {
    const { cliente, borradosStorage } = clienteFalso((op) => {
      if (op.tabla === 'categories' && op.op === 'select') return { data: { image_id: null } }
      if (op.tabla === 'media_assets' && op.op === 'insert') return { data: { id: 'm-cat' } }
      if (op.tabla === 'categories' && op.op === 'update') return { data: [] } // RLS: cero filas
      if (op.tabla === 'media_assets' && op.op === 'delete') return { data: [{ id: 'm-cat' }] }
      return {}
    })
    const r = await aplicarImagenDeCategoria(cliente, 'c1', 'Pastelería', {
      nueva: { ...NUEVA_CAT }, quitar: false,
    })
    expect(r.error).toBeTruthy()
    expect(borradosStorage).toEqual([NUEVA_CAT.path])
  })
})

describe('registrarImagenDeContenido', () => {
  it('registra marcada como temporal hasta que el borrador la confirme', async () => {
    const { cliente, operaciones } = clienteFalso((op) => {
      if (op.tabla === 'media_assets' && op.op === 'insert') return { data: { id: 'm-cont' } }
      return {}
    })
    const r = await registrarImagenDeContenido(
      cliente,
      { path: `contenido/${UUID}.png`, width: 1200, height: 800, bytes: 90000 },
      'Vitrina de la mañana',
    )
    expect(r).toEqual({ id: 'm-cont' })
    const registro = operaciones.find((o) => o.tabla === 'media_assets' && o.op === 'insert')
    expect(registro?.datos).toMatchObject({ is_temporary: true, alt: 'Vitrina de la mañana' })
  })

  it('si el registro falla, borra el archivo subido', async () => {
    const { cliente, borradosStorage } = clienteFalso((op) => {
      if (op.tabla === 'media_assets' && op.op === 'insert') {
        return { error: { code: '23505', message: 'duplicado' } }
      }
      return {}
    })
    const r = await registrarImagenDeContenido(
      cliente,
      { path: `contenido/${UUID}.png`, width: null, height: null, bytes: null },
      '',
    )
    expect(r).toHaveProperty('error')
    expect(borradosStorage).toEqual([`contenido/${UUID}.png`])
  })
})
