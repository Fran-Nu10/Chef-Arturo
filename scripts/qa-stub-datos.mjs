// Genera los datos que sirve scripts/qa-stub-catalogo.mjs: el catálogo real
// (categorías + productos, volcados de una base recién migrada) más
// media_assets/product_images sintéticos que reproducen exactamente lo que
// dejaría scripts/importar-imagenes-catalogo-v1.mjs contra Supabase real.
//
// El mapeo NO se repite acá: se lee del propio importador con `--json`, que es
// la única fuente de verdad.
//
//   node scripts/qa-stub-datos.mjs categorias.json productos.json salida.json
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const categorias = JSON.parse(readFileSync(process.argv[2]))
const productos = JSON.parse(readFileSync(process.argv[3]))

const plan = JSON.parse(
  execFileSync(
    process.execPath,
    [path.join(RAIZ, 'scripts', 'importar-imagenes-catalogo-v1.mjs'), '--json'],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  ),
)

const mediaAssets = []
const productImages = []
/** Path en Storage → ruta real dentro de `public/`, para que el stub la sirva. */
const archivos = {}
const sinProducto = []

for (const item of plan) {
  const mediaId = randomUUID()
  mediaAssets.push({
    id: mediaId,
    bucket: 'media',
    path: item.destino,
    alt: item.altMedio,
    mime_type: item.mime,
    width: item.width,
    height: item.height,
    bytes: item.bytes,
    source: 'own',
    credit: 'Chef Arturo',
    is_temporary: false,
  })
  archivos[item.destino] = item.origen

  for (const objetivo of item.objetivos) {
    const producto = productos.find((p) => p.slug === objetivo.slug)
    if (!producto) {
      sinProducto.push(objetivo.slug)
      continue
    }
    productImages.push({
      id: randomUUID(),
      product_id: producto.id,
      media_id: mediaId,
      alt: objetivo.alt,
      position: 0,
      is_primary: true,
    })
  }
}

if (sinProducto.length > 0) {
  console.error(
    `Slugs del manifiesto que no existen en el catálogo: ${sinProducto.join(', ')}`,
  )
  process.exit(1)
}

writeFileSync(
  process.argv[4],
  JSON.stringify(
    { categorias, productos, mediaAssets, productImages, archivos },
    null,
    2,
  ),
)

const conFoto = new Set(productImages.map((pi) => pi.product_id)).size
console.log(
  `${mediaAssets.length} media_assets · ${productImages.length} product_images · ` +
    `${conFoto}/${productos.length} productos con foto · ${categorias.length} categorías`,
)
