// Genera los datos que sirve scripts/qa-stub-pasteleria.mjs: el catálogo
// real (categorías + productos, volcados de una base recién migrada) más
// media_assets/product_images sintéticos que reproducen exactamente lo que
// dejaría scripts/importar-imagenes-pasteleria-v1.mjs contra Supabase real.
import { readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

const categorias = JSON.parse(readFileSync(process.argv[2]))
const productos = JSON.parse(readFileSync(process.argv[3]))

const MANIFIESTO = [
  { archivo: 'crumble-manzana-individual.jpg', slugs: ['crumble-manzana-individual'] },
  { archivo: 'crumble-manzana-entero-kg.jpg', slugs: ['crumble-manzana-entero-kg'] },
  { archivo: 'cheesecake-naranja-individual.jpg', slugs: ['cheesecake-naranja-individual'] },
  { archivo: 'cheesecake-naranja-entero-kg.jpg', slugs: ['cheesecake-naranja-entero-kg'] },
  { archivo: 'lemon-pie-individual.jpg', slugs: ['lemon-pie-individual'] },
  { archivo: 'lemon-pie-entero-kg.jpg', slugs: ['lemon-pie-entero-kg'] },
  { archivo: 'mango-maracuya-individual.jpg', slugs: ['mango-maracuya-individual'] },
  { archivo: 'mango-maracuya-entero-kg.jpg', slugs: ['mango-maracuya-entero-kg'] },
  {
    archivo: 'mousse-pistacho-chocolate-blanco-individual.jpg',
    slugs: ['mousse-pistacho-chocolate-blanco-individual'],
  },
  {
    archivo: 'mousse-pistacho-chocolate-blanco-entero-kg.jpg',
    slugs: ['mousse-pistacho-chocolate-blanco-entero-kg'],
  },
  {
    archivo: 'mousse-dulce-de-leche-frutos-rojos-individual.jpg',
    slugs: ['mousse-dulce-de-leche-frutos-rojos-individual'],
  },
  {
    archivo: 'mousse-dulce-de-leche-frutos-rojos-entero-kg.jpg',
    slugs: ['mousse-dulce-de-leche-frutos-rojos-entero-kg'],
  },
  {
    archivo: 'cheesecake-clasica.jpg',
    slugs: ['cheesecake-clasica-individual', 'cheesecake-clasica-entero-kg'],
  },
  {
    archivo: 'cheesecake-maracuya.jpg',
    slugs: ['cheesecake-maracuya-individual', 'cheesecake-maracuya-entero-kg'],
  },
]

const mediaAssets = []
const productImages = []

for (const item of MANIFIESTO) {
  const mediaId = randomUUID()
  mediaAssets.push({
    id: mediaId,
    bucket: 'media',
    path: `productos/pasteleria/${item.archivo}`,
    alt: item.slugs.length > 1 ? 'Foto compartida de Chef Arturo' : item.archivo,
    mime_type: 'image/jpeg',
    source: 'own',
    credit: 'Chef Arturo',
    is_temporary: false,
  })
  for (const slug of item.slugs) {
    const producto = productos.find((p) => p.slug === slug)
    if (!producto) throw new Error(`Falta el producto ${slug} en el volcado del catálogo`)
    productImages.push({
      id: randomUUID(),
      product_id: producto.id,
      media_id: mediaId,
      alt: producto.name,
      position: 0,
      is_primary: true,
    })
  }
}

writeFileSync(
  process.argv[4],
  JSON.stringify({ categorias, productos, mediaAssets, productImages }, null, 2),
)
console.log(
  `${mediaAssets.length} media_assets · ${productImages.length} product_images · ${productos.length} productos · ${categorias.length} categorías`,
)
