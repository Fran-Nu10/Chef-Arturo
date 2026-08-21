// Stub local de PostgREST + Storage para QA visual del storefront cuando no
// hay red hacia Supabase.
//
// Sirve el catálogo real (37 productos, 4 categorías) con las 16 relaciones
// de imagen de pastelería que dejaría la importación real, y sirve las
// fotos desde el sistema de archivos en la misma ruta pública que usaría
// Supabase Storage (`/storage/v1/object/public/media/<path>`). No es un
// PostgREST completo: sólo entiende `select` con embeds, `eq`/`in`, `order`
// y `limit` — lo que de verdad usan los repositorios del storefront.
//
// Uso:
//   node scripts/qa-stub-datos.mjs categorias.json productos.json datos.json
//   node scripts/qa-stub-pasteleria.mjs datos.json
//   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54999 \
//     NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=stub \
//     npm run dev
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUERTO = Number(process.env.QA_STUB_PORT ?? 54999)

const datos = JSON.parse(readFileSync(process.argv[2] ?? '/dev/stdin'))
const DB = {
  categories: datos.categorias,
  products: datos.productos,
  media_assets: datos.mediaAssets,
  product_images: datos.productImages,
}

function parseFiltros(searchParams) {
  const filtros = []
  for (const [clave, valor] of searchParams) {
    if (['select', 'order', 'limit', 'offset'].includes(clave)) continue
    const [, operador, resto] = valor.match(/^(eq|neq|in)\.(.*)$/s) ?? []
    if (!operador) continue
    filtros.push({
      clave,
      operador,
      valor: operador === 'in' ? resto.replace(/^\(|\)$/g, '').split(',') : resto,
    })
  }
  return filtros
}

function cumpleFiltros(fila, filtros) {
  return filtros.every(({ clave, operador, valor }) => {
    const actual = String(fila[clave])
    if (operador === 'eq') return actual === valor
    if (operador === 'neq') return actual !== valor
    if (operador === 'in') return valor.includes(actual)
    return true
  })
}

/** Resuelve un `select` con embeds simples: `*,product_images(a,b,rel(c))`. */
function parseSelect(select) {
  const campos = []
  let i = 0
  while (i < select.length) {
    if (select[i] === ',') {
      i++
      continue
    }
    let nombre = ''
    while (i < select.length && select[i] !== ',' && select[i] !== '(') nombre += select[i++]
    if (select[i] === '(') {
      let profundidad = 1
      let interior = ''
      i++
      while (i < select.length && profundidad > 0) {
        if (select[i] === '(') profundidad++
        if (select[i] === ')') profundidad--
        if (profundidad > 0) interior += select[i]
        i++
      }
      campos.push({ tabla: nombre, hijos: parseSelect(interior) })
    } else {
      campos.push({ campo: nombre })
    }
  }
  return campos
}

function proyectar(fila, campos) {
  const salida = {}
  for (const c of campos) {
    if (c.campo === '*') Object.assign(salida, fila)
    else if (c.campo) salida[c.campo] = fila[c.campo]
    else if (c.tabla === 'product_images') {
      salida.product_images = DB.product_images
        .filter((pi) => pi.product_id === fila.id)
        .map((pi) => proyectarConMedia(pi, c.hijos))
    }
  }
  return salida
}

function proyectarConMedia(pi, campos) {
  const salida = {}
  for (const c of campos) {
    if (c.campo) salida[c.campo] = pi[c.campo]
    else if (c.tabla === 'media_assets') {
      const medio = DB.media_assets.find((m) => m.id === pi.media_id)
      salida.media_assets = medio ? proyectarPlano(medio, c.hijos) : null
    }
  }
  return salida
}

function proyectarPlano(fila, campos) {
  const salida = {}
  for (const c of campos) {
    if (c.campo === '*') Object.assign(salida, fila)
    else if (c.campo) salida[c.campo] = fila[c.campo]
  }
  return salida
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`)

  // Storage público: /storage/v1/object/public/media/<path>
  if (url.pathname.startsWith('/storage/v1/object/public/media/')) {
    const ruta = decodeURIComponent(url.pathname.replace('/storage/v1/object/public/media/', ''))
    const archivo = path.join(RAIZ, 'public', 'assets', ruta)
    if (!archivo.startsWith(path.join(RAIZ, 'public')) || !existsSync(archivo)) {
      res.writeHead(404).end('not found')
      return
    }
    res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'no-store' })
    res.end(readFileSync(archivo))
    return
  }

  // REST: /rest/v1/<tabla>
  const m = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/)
  if (!m) {
    res.writeHead(404).end('not found')
    return
  }
  const tabla = m[1]
  if (!(tabla in DB)) {
    res.writeHead(404).end(JSON.stringify({ message: `tabla desconocida: ${tabla}` }))
    return
  }

  let filas = [...DB[tabla]]
  const filtros = parseFiltros(url.searchParams)
  filas = filas.filter((f) => cumpleFiltros(f, filtros))

  const orden = url.searchParams.get('order')
  if (orden) {
    const [col, dir] = orden.split('.')
    filas.sort((a, b) => {
      if (a[col] < b[col]) return dir === 'desc' ? 1 : -1
      if (a[col] > b[col]) return dir === 'desc' ? -1 : 1
      return 0
    })
  }

  const limite = url.searchParams.get('limit')
  if (limite) filas = filas.slice(0, Number(limite))

  const select = url.searchParams.get('select') ?? '*'
  const campos = parseSelect(select)
  const resultado = filas.map((f) => proyectar(f, campos))

  const single = req.headers.accept?.includes('vnd.pgrst.object')
  res.writeHead(200, {
    'content-type': 'application/json',
    'content-range': `0-${resultado.length}/${resultado.length}`,
  })
  if (single) {
    res.end(JSON.stringify(resultado[0] ?? null))
  } else {
    res.end(JSON.stringify(resultado))
  }
})

servidor.listen(PUERTO, () => {
  console.log(`Stub de PostgREST + Storage escuchando en http://localhost:${PUERTO}`)
  console.log(
    `${DB.products.length} productos · ${DB.categories.length} categorías · ${DB.media_assets.length} imágenes de pastelería`,
  )
})
