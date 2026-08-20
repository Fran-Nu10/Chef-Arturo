#!/usr/bin/env node
/**
 * Importador de medios · Catálogo real Chef Arturo V1
 *
 * Sube a Supabase Storage las fotografías propias que corresponden al
 * catálogo cargado en `supabase/migrations/20260821090000_catalogo_real_chef_arturo_v1.sql`,
 * y las vincula en `media_assets`, `categories.image_id` y `product_images`.
 *
 * Por qué es un script y no SQL: los binarios no se incrustan en una
 * migración. La migración deja las categorías y los productos listos; este
 * script es el segundo paso, separado a propósito.
 *
 * Idempotente:
 *   - `media_assets` tiene `unique (bucket, path)`: subir el mismo archivo dos
 *     veces actualiza la fila existente en vez de duplicarla, y `storage.upload`
 *     se llama con `upsert: true` sobre la misma ruta determinística.
 *   - `categories.image_id` se pisa con el mismo valor si ya estaba puesto.
 *   - `product_images`: si el producto YA tiene una imagen principal distinta
 *     de la que este script asignaría, no la reemplaza — se avisa y se sigue.
 *     No hay forma de que una corrida repetida le saque a un producto una
 *     imagen que un administrador haya elegido a mano después.
 *
 * Uso:
 *   node scripts/importar-medios-catalogo.mjs --dry-run   # sin tocar nada
 *   node scripts/importar-medios-catalogo.mjs              # aplica de verdad
 *
 * Variables de entorno requeridas (para aplicar; `--dry-run` no las necesita):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY        — nunca se imprime, nunca se commitea
 *
 * La clave de servicio nunca aparece en la salida de este script, ni en un
 * log, ni en un archivo. Si falta, el script lo dice por nombre y no arranca.
 */

import { createClient } from '@supabase/supabase-js'
import { imageSize } from 'image-size'
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CARPETA_FOTOS = path.join(RAIZ, 'public', 'fotos')
const PREFIJO_STORAGE = 'catalogo/chef-arturo-v1'
const BUCKET = 'media'

/**
 * Qué imagen va a qué categoría y a qué producto.
 *
 * Sólo entran acá fotografías sin marca de un tercero visible y sin datos que
 * contradigan el catálogo real (nombres, precios en otra moneda). El criterio
 * completo, imagen por imagen, está en `docs/MEDIA_MAPPING_CATALOGO_V1.md`.
 *
 * Ninguna es la foto exacta de un producto — Chef Arturo no tiene todavía
 * fotografía propia por sabor —, así que todas se marcan `temporal: true` y
 * llevan un alt genérico y honesto. Los productos que no figuran acá se
 * quedan sin imagen: el storefront ya sabe mostrar ese hueco sin romperse.
 */
const PLAN = [
  {
    archivo: 'luncheventos1.jpg',
    alt: 'Selección de mini postres en una torre de exhibición, imagen ilustrativa.',
    categorias: ['pasteleria'],
    productos: [],
  },
  {
    archivo: 'merienda1.jpg',
    alt: 'Cookie de chocolate partida al medio, imagen ilustrativa.',
    categorias: ['merienda'],
    productos: ['box-cookies-levain-6-unidades'],
  },
  {
    archivo: 'luncheventos2.jpg',
    alt: 'Mesa dulce para eventos, imagen ilustrativa — no representa el contenido exacto de los packs de lunch.',
    categorias: ['lunch-para-eventos'],
    productos: [],
  },
  {
    archivo: 'pasteleria5.jpg',
    alt: 'Torta entera de cheesecake con frutos rojos, imagen ilustrativa.',
    categorias: [],
    productos: ['cheesecake-clasica-entero-kg'],
  },
  {
    archivo: 'pasteleria1.jpg',
    alt: 'Brownies con dulce de leche, imagen ilustrativa — no representa exactamente las variedades del box.',
    categorias: [],
    productos: ['box-brownies-arturo-selection-6-unidades'],
  },
  {
    archivo: 'luncheventos3.jpg',
    alt: 'Selección de postres pequeños variados, imagen ilustrativa — no representa los sabores exactos del box.',
    categorias: [],
    productos: ['box-coleccion-dulce-9-postres'],
  },
]

const MIME_POR_EXTENSION = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

const dryRun = process.argv.includes('--dry-run')

function leerArchivo(nombre) {
  const ruta = path.join(CARPETA_FOTOS, nombre)
  const bytes = readFileSync(ruta)
  const { width, height } = imageSize(bytes)
  const extension = path.extname(nombre).toLowerCase()
  const mime = MIME_POR_EXTENSION[extension]
  if (!mime) throw new Error(`Extensión sin MIME conocido: ${nombre}`)
  return { bytes, width, height, mime, tamano: statSync(ruta).size }
}

function planCompleto() {
  return PLAN.map((item) => {
    const info = leerArchivo(item.archivo)
    return {
      ...item,
      path: `${PREFIJO_STORAGE}/${item.archivo}`,
      width: info.width,
      height: info.height,
      mime: info.mime,
      bytes: info.tamano,
    }
  })
}

async function main() {
  const plan = planCompleto()

  if (dryRun) {
    console.log('── Plan (--dry-run, no se tocó nada) ──\n')
    for (const item of plan) {
      console.log(`${item.archivo}`)
      console.log(`  → storage: ${BUCKET}/${item.path}`)
      console.log(`  → ${item.width}×${item.height}px · ${item.mime} · ${item.bytes} bytes`)
      console.log(`  → categorías: ${item.categorias.join(', ') || '(ninguna)'}`)
      console.log(`  → productos:  ${item.productos.join(', ') || '(ninguno)'}`)
      console.log(`  → alt: "${item.alt}"`)
      console.log()
    }
    const totalCategorias = new Set(plan.flatMap((i) => i.categorias)).size
    const totalProductos = new Set(plan.flatMap((i) => i.productos)).size
    console.log(`${plan.length} archivos · ${totalCategorias} categorías vinculadas · ${totalProductos} productos vinculados`)
    return
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const clave = process.env.SUPABASE_SECRET_KEY
  const faltan = []
  if (!url) faltan.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!clave) faltan.push('SUPABASE_SECRET_KEY')
  if (faltan.length > 0) {
    console.error(`Faltan variables de entorno: ${faltan.join(', ')}`)
    console.error('Este script no simula una carga exitosa: si faltan credenciales, no hace nada.')
    process.exit(1)
  }

  // Clave de servicio: sólo en este proceso, nunca en un log ni en un archivo.
  const supabase = createClient(url, clave, { auth: { persistSession: false } })

  for (const item of plan) {
    process.stdout.write(`${item.archivo} … `)

    const { error: errorSubida } = await supabase.storage
      .from(BUCKET)
      .upload(item.path, readFileSync(path.join(CARPETA_FOTOS, item.archivo)), {
        contentType: item.mime,
        upsert: true,
      })
    if (errorSubida) {
      console.log(`ERROR al subir: ${errorSubida.message}`)
      continue
    }

    const { data: medio, error: errorMedio } = await supabase
      .from('media_assets')
      .upsert(
        {
          bucket: BUCKET,
          path: item.path,
          alt: item.alt,
          width: item.width,
          height: item.height,
          mime_type: item.mime,
          bytes: item.bytes,
          source: 'own',
          source_url: null,
          credit: 'Chef Arturo',
          license: null,
          is_temporary: true,
        },
        { onConflict: 'bucket,path' },
      )
      .select('id')
      .single()
    if (errorMedio) {
      console.log(`ERROR al registrar en media_assets: ${errorMedio.message}`)
      continue
    }

    for (const slugCategoria of item.categorias) {
      const { error } = await supabase
        .from('categories')
        .update({ image_id: medio.id })
        .eq('slug', slugCategoria)
      if (error) console.log(`\n  categoría ${slugCategoria}: ${error.message}`)
    }

    for (const slugProducto of item.productos) {
      const { data: producto } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slugProducto)
        .maybeSingle()
      if (!producto) {
        console.log(`\n  producto ${slugProducto}: no existe (¿corriste la migración 0009?)`)
        continue
      }

      const { data: primariaActual } = await supabase
        .from('product_images')
        .select('media_id')
        .eq('product_id', producto.id)
        .eq('is_primary', true)
        .maybeSingle()

      if (primariaActual && primariaActual.media_id !== medio.id) {
        // Ya tiene otra imagen principal — un administrador pudo haberla
        // elegido a mano. No se la saca.
        console.log(`\n  producto ${slugProducto}: ya tiene otra imagen principal, no se reemplaza`)
        continue
      }

      const { error } = await supabase.from('product_images').upsert(
        {
          product_id: producto.id,
          media_id: medio.id,
          alt: item.alt,
          position: 0,
          is_primary: true,
        },
        { onConflict: 'product_id,media_id' },
      )
      if (error) console.log(`\n  producto ${slugProducto}: ${error.message}`)
    }

    console.log('ok')
  }
}

main().catch((error) => {
  console.error('Falló la importación:', error.message)
  process.exit(1)
})
