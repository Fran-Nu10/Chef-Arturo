/**
 * Auditoría de las fotografías de `public/fotos/`.
 *
 * Lee cada archivo, saca sus dimensiones reales y deduce el grupo únicamente
 * del nombre, según el contrato. No decide posiciones: eso se hace mirando las
 * fotos. Sirve para el inventario del handoff y para detectar archivos rotos.
 *
 *   node scripts/auditar-imagenes.mjs [--json]
 */
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { imageSize } from 'image-size'

const DIRECTORIO = 'public/fotos'
const EXTENSIONES = /\.(jpe?g|png|webp|avif)$/i

/** Mismos prefijos que `src/content/imagenes.ts`, en el mismo orden. */
const PREFIJOS = [
  ['lamesa', 'lamesadechefarturo'],
  ['luncheventos', 'luncheventos'],
  ['pasteleria', 'pasteleria'],
  ['merienda', 'merienda'],
]

function grupoDeArchivo(nombre) {
  const base = nombre.toLowerCase()
  return PREFIJOS.find(([, prefijo]) => base.startsWith(prefijo))?.[0] ?? null
}

function orientacion(ancho, alto) {
  const r = ancho / alto
  if (r > 1.15) return 'horizontal'
  if (r < 0.87) return 'vertical'
  return 'cuadrada'
}

const archivos = readdirSync(DIRECTORIO)
  .filter((n) => EXTENSIONES.test(n))
  .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))

const inventario = []
const rotos = []

for (const nombre of archivos) {
  const ruta = join(DIRECTORIO, nombre)
  const pesoBytes = statSync(ruta).size
  try {
    const { width, height } = imageSize(readFileSync(ruta))
    inventario.push({
      archivo: nombre,
      ancho: width,
      alto: height,
      ratio: +(width / height).toFixed(3),
      orientacion: orientacion(width, height),
      pesoKB: Math.round(pesoBytes / 1024),
      grupo: grupoDeArchivo(nombre),
    })
  } catch (error) {
    rotos.push({ archivo: nombre, pesoKB: Math.round(pesoBytes / 1024), error: String(error) })
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ inventario, rotos }, null, 2))
} else {
  const col = (v, n) => String(v).padEnd(n)
  console.log(
    col('ARCHIVO', 28) + col('DIMENSIONES', 14) + col('RATIO', 8) +
      col('ORIENTACIÓN', 14) + col('PESO', 9) + 'GRUPO',
  )
  for (const f of inventario) {
    console.log(
      col(f.archivo, 28) + col(`${f.ancho}×${f.alto}`, 14) + col(f.ratio, 8) +
        col(f.orientacion, 14) + col(`${f.pesoKB} KB`, 9) + (f.grupo ?? '— SIN GRUPO —'),
    )
  }
  console.log(`\n${inventario.length} archivos legibles.`)
  if (rotos.length) {
    console.log(`\nARCHIVOS QUE NO PUDIERON ABRIRSE (${rotos.length}):`)
    for (const r of rotos) console.log(`  ${r.archivo} (${r.pesoKB} KB) — ${r.error}`)
  }
  const huerfanos = inventario.filter((f) => !f.grupo)
  if (huerfanos.length) {
    console.log(
      `\nFUERA DEL CONTRATO DE NOMBRES (${huerfanos.length}): ` +
        huerfanos.map((f) => f.archivo).join(', '),
    )
  }
}
