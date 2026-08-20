#!/usr/bin/env node
/**
 * Importador de imágenes · Pastelería V1
 *
 * Sube a Supabase Storage las fotografías reales de pastelería que ya están
 * en el repositorio (`public/assets/productos/pasteleria/`), las registra en
 * `media_assets` y las vincula como imagen principal de cada producto en
 * `product_images`.
 *
 * El mapeo archivo → producto es el MANIFIESTO de abajo: explícito, escrito
 * a mano a partir de la inspección visual de cada foto. Este script no hace
 * matching difuso en tiempo de ejecución — sólo valida que el manifiesto siga
 * siendo correcto (archivos presentes, formato real, productos existentes).
 *
 * Idempotente:
 *   - `media_assets` tiene `unique (bucket, path)`: la ruta es determinística
 *     (`productos/pasteleria/<slug>.jpg`), así que subir de nuevo el mismo
 *     archivo actualiza la fila existente — el `id` (UUID) no cambia entre
 *     corridas porque el upsert es por conflicto, no por borrar-e-insertar.
 *   - Vincular una imagen ya vinculada es un no-op detectado antes de escribir.
 *   - Reemplazar la imagen principal de un producto es seguro: primero se
 *     sube y registra la nueva, se cambia la relación principal (baja la
 *     anterior, sube la nueva — nunca las dos a la vez, porque un índice
 *     único en la base sólo permite una imagen principal por producto), se
 *     verifica, y recién entonces se quita la relación anterior y se borra el
 *     asset viejo — sólo si `media_asset_usage` confirma que nada más lo usa.
 *   - Puede ejecutarse cuantas veces haga falta sin duplicar filas.
 *
 * Uso:
 *   node scripts/importar-imagenes-pasteleria-v1.mjs --dry-run   # sin tocar nada
 *   node scripts/importar-imagenes-pasteleria-v1.mjs              # aplica de verdad
 *
 * Variables de entorno requeridas para aplicar (--dry-run no las necesita):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY        — nunca se imprime, nunca se commitea
 *
 * La clave de servicio sólo vive en este proceso de Node. Nunca aparece en
 * esta salida, en un log ni en un archivo — y nunca debe usarse en el
 * navegador.
 */

import { createClient } from '@supabase/supabase-js'
import { imageSize } from 'image-size'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CARPETA_FOTOS = path.join(RAIZ, 'public', 'assets', 'productos', 'pasteleria')
const PREFIJO_STORAGE = 'productos/pasteleria'
const BUCKET = 'media'

/**
 * Manifiesto explícito: archivo → producto(s).
 *
 * Cada entrada sube un único archivo. `objetivos` es la lista de slugs de
 * producto que reciben esa foto como imagen principal — más de uno cuando la
 * misma fotografía representa dos presentaciones del mismo sabor (la
 * pastelería no tiene una toma diferenciada por presentación en esos casos).
 * `altMedio` es el texto alternativo que queda en `media_assets`; cada
 * objetivo puede pedir su propio alt para la relación en `product_images`
 * (más específico: menciona la presentación).
 */
const MANIFIESTO = [
  {
    archivo: 'crumble-manzana-individual.jpg',
    altMedio: 'Crumble de manzana — individual',
    objetivos: [{ slug: 'crumble-manzana-individual', alt: 'Crumble de manzana — individual' }],
  },
  {
    archivo: 'crumble-manzana-entero-kg.jpg',
    altMedio: 'Crumble de manzana — entero por kg',
    objetivos: [{ slug: 'crumble-manzana-entero-kg', alt: 'Crumble de manzana — entero por kg' }],
  },
  {
    archivo: 'cheesecake-naranja-individual.jpg',
    altMedio: 'Cheesecake de naranja — individual',
    objetivos: [
      { slug: 'cheesecake-naranja-individual', alt: 'Cheesecake de naranja — individual' },
    ],
  },
  {
    archivo: 'cheesecake-naranja-entero-kg.jpg',
    altMedio: 'Cheesecake de naranja — entero por kg',
    objetivos: [
      { slug: 'cheesecake-naranja-entero-kg', alt: 'Cheesecake de naranja — entero por kg' },
    ],
  },
  {
    archivo: 'lemon-pie-individual.jpg',
    altMedio: 'Lemon pie — individual',
    objetivos: [{ slug: 'lemon-pie-individual', alt: 'Lemon pie — individual' }],
  },
  {
    archivo: 'lemon-pie-entero-kg.jpg',
    altMedio: 'Lemon pie — entero por kg',
    objetivos: [{ slug: 'lemon-pie-entero-kg', alt: 'Lemon pie — entero por kg' }],
  },
  {
    archivo: 'mango-maracuya-individual.jpg',
    altMedio: 'Mango y maracuyá — individual',
    objetivos: [{ slug: 'mango-maracuya-individual', alt: 'Mango y maracuyá — individual' }],
  },
  {
    archivo: 'mango-maracuya-entero-kg.jpg',
    altMedio: 'Mango y maracuyá — entero por kg',
    objetivos: [{ slug: 'mango-maracuya-entero-kg', alt: 'Mango y maracuyá — entero por kg' }],
  },
  {
    archivo: 'mousse-pistacho-chocolate-blanco-individual.jpg',
    altMedio: 'Mousse de pistacho y chocolate blanco — individual',
    objetivos: [
      {
        slug: 'mousse-pistacho-chocolate-blanco-individual',
        alt: 'Mousse de pistacho y chocolate blanco — individual',
      },
    ],
  },
  {
    archivo: 'mousse-pistacho-chocolate-blanco-entero-kg.jpg',
    altMedio: 'Mousse de pistacho y chocolate blanco — entero por kg',
    objetivos: [
      {
        slug: 'mousse-pistacho-chocolate-blanco-entero-kg',
        alt: 'Mousse de pistacho y chocolate blanco — entero por kg',
      },
    ],
  },
  {
    archivo: 'mousse-dulce-de-leche-frutos-rojos-individual.jpg',
    altMedio: 'Mousse de dulce de leche y frutos rojos — individual',
    objetivos: [
      {
        slug: 'mousse-dulce-de-leche-frutos-rojos-individual',
        alt: 'Mousse de dulce de leche y frutos rojos — individual',
      },
    ],
  },
  {
    archivo: 'mousse-dulce-de-leche-frutos-rojos-entero-kg.jpg',
    altMedio: 'Mousse de dulce de leche y frutos rojos — entero por kg',
    objetivos: [
      {
        slug: 'mousse-dulce-de-leche-frutos-rojos-entero-kg',
        alt: 'Mousse de dulce de leche y frutos rojos — entero por kg',
      },
    ],
  },
  {
    archivo: 'cheesecake-clasica.jpg',
    altMedio: 'Cheesecake clásica de Chef Arturo',
    compartida: true,
    objetivos: [
      { slug: 'cheesecake-clasica-individual', alt: 'Cheesecake clásica — individual' },
      { slug: 'cheesecake-clasica-entero-kg', alt: 'Cheesecake clásica — entero por kg' },
    ],
  },
  {
    archivo: 'cheesecake-maracuya.jpg',
    altMedio: 'Cheesecake de maracuyá de Chef Arturo',
    compartida: true,
    objetivos: [
      { slug: 'cheesecake-maracuya-individual', alt: 'Cheesecake de maracuyá — individual' },
      { slug: 'cheesecake-maracuya-entero-kg', alt: 'Cheesecake de maracuyá — entero por kg' },
    ],
  },
]

const dryRun = process.argv.includes('--dry-run')

// ── Validaciones que no requieren red ───────────────────────────────────────

/** JPEG empieza siempre con estos tres bytes, sea cual sea la extensión. */
function esJpegDeVerdad(bytes) {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
}

function validarManifiesto() {
  const errores = []

  const presentes = new Set(readdirSync(CARPETA_FOTOS))
  const archivosEsperados = new Set(MANIFIESTO.map((m) => m.archivo))

  // Todos los archivos del manifiesto tienen que existir.
  for (const m of MANIFIESTO) {
    if (!presentes.has(m.archivo)) errores.push(`Falta el archivo del manifiesto: ${m.archivo}`)
  }

  // Ningún archivo de la carpeta queda fuera del manifiesto sin explicación:
  // evita que una foto nueva se suba "gratis" sin haber sido revisada.
  for (const f of presentes) {
    if (!archivosEsperados.has(f)) errores.push(`Archivo sin mapear en el manifiesto: ${f}`)
  }

  // Dos entradas del manifiesto no pueden apuntar al mismo archivo (candidato
  // ambiguo) ni el mismo slug de producto no puede recibir dos imágenes.
  const archivosVistos = new Map()
  const slugsVistos = new Map()
  for (const m of MANIFIESTO) {
    archivosVistos.set(m.archivo, (archivosVistos.get(m.archivo) ?? 0) + 1)
    for (const o of m.objetivos) {
      slugsVistos.set(o.slug, (slugsVistos.get(o.slug) ?? 0) + 1)
    }
  }
  for (const [archivo, n] of archivosVistos) {
    if (n > 1) errores.push(`Archivo con más de una entrada en el manifiesto: ${archivo}`)
  }
  for (const [slug, n] of slugsVistos) {
    if (n > 1) errores.push(`Producto con dos imágenes candidatas en el manifiesto: ${slug}`)
  }

  return errores
}

function leerYValidarArchivo(nombre) {
  const ruta = path.join(CARPETA_FOTOS, nombre)
  const bytes = readFileSync(ruta)
  if (!esJpegDeVerdad(bytes)) {
    throw new Error(`${nombre}: la firma binaria no es JPEG (¿archivo renombrado?)`)
  }
  const { width, height } = imageSize(bytes)
  return { bytes, width, height, mime: 'image/jpeg', tamano: bytes.length }
}

function planCompleto() {
  return MANIFIESTO.map((item) => {
    const info = leerYValidarArchivo(item.archivo)
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

// ── Aplicación contra Supabase ──────────────────────────────────────────────

/**
 * Vincula `mediaId` como imagen principal de `slug`, reemplazando de forma
 * segura la que hubiera antes. Devuelve qué pasó, para el resumen final.
 */
async function vincularImagenPrincipal(supabase, slug, mediaId, alt) {
  const { data: producto, error: errorProducto } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (errorProducto) throw new Error(`${slug}: ${errorProducto.message}`)
  if (!producto) throw new Error(`${slug}: el producto no existe en la base`)

  const { data: actual, error: errorActual } = await supabase
    .from('product_images')
    .select('id, media_id')
    .eq('product_id', producto.id)
    .eq('is_primary', true)
    .maybeSingle()
  if (errorActual) throw new Error(`${slug}: ${errorActual.message}`)

  if (actual && actual.media_id === mediaId) {
    return { slug, resultado: 'ya-estaba' }
  }

  // Primero se baja la principal anterior: el índice único
  // `product_images_one_primary` sólo permite una fila `is_primary = true`
  // por producto, así que no puede haber un momento con dos.
  if (actual) {
    const { error } = await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('id', actual.id)
    if (error) throw new Error(`${slug}: no se pudo bajar la imagen anterior: ${error.message}`)
  }

  const { error: errorVinculo } = await supabase.from('product_images').upsert(
    { product_id: producto.id, media_id: mediaId, alt, position: 0, is_primary: true },
    { onConflict: 'product_id,media_id' },
  )
  if (errorVinculo) throw new Error(`${slug}: no se pudo vincular la imagen nueva: ${errorVinculo.message}`)

  // Verificación: la relación tiene que existir y estar marcada principal.
  const { data: verificacion, error: errorVerificacion } = await supabase
    .from('product_images')
    .select('is_primary')
    .eq('product_id', producto.id)
    .eq('media_id', mediaId)
    .maybeSingle()
  if (errorVerificacion || !verificacion?.is_primary) {
    throw new Error(`${slug}: la imagen nueva no quedó marcada como principal`)
  }

  if (!actual) return { slug, resultado: 'vinculada' }

  // Recién ahora se quita la relación anterior — la nueva ya está confirmada.
  const { error: errorBorrado } = await supabase
    .from('product_images')
    .delete()
    .eq('id', actual.id)
  if (errorBorrado) throw new Error(`${slug}: no se pudo quitar la relación anterior: ${errorBorrado.message}`)

  // El asset anterior se borra sólo si media_asset_usage confirma que nada
  // más lo referencia — nunca se borra una imagen compartida.
  const { data: usos } = await supabase.rpc('media_asset_usage', { p_media_id: actual.media_id })
  if (usos && usos.length === 0) {
    const { data: medioAnterior } = await supabase
      .from('media_assets')
      .select('bucket, path')
      .eq('id', actual.media_id)
      .maybeSingle()
    await supabase.from('media_assets').delete().eq('id', actual.media_id)
    if (medioAnterior) {
      await supabase.storage.from(medioAnterior.bucket).remove([medioAnterior.path])
    }
    return { slug, resultado: 'reemplazada', assetAnteriorBorrado: true }
  }

  return { slug, resultado: 'reemplazada', assetAnteriorBorrado: false }
}

async function main() {
  const erroresManifiesto = validarManifiesto()
  if (erroresManifiesto.length > 0) {
    console.error('El manifiesto no pasa la validación:')
    for (const e of erroresManifiesto) console.error(`  · ${e}`)
    process.exit(1)
  }

  const plan = planCompleto()

  if (dryRun) {
    console.log('── Plan (--dry-run, no se tocó nada) ──\n')
    for (const item of plan) {
      console.log(item.archivo)
      console.log(`  → storage: ${BUCKET}/${item.path}`)
      console.log(`  → ${item.width}×${item.height}px · ${item.mime} · ${item.bytes} bytes`)
      console.log(`  → productos: ${item.objetivos.map((o) => o.slug).join(', ')}`)
      if (item.compartida) console.log('  → imagen compartida entre presentaciones')
      console.log(`  → alt del medio: "${item.altMedio}"`)
      console.log()
    }
    const totalProductos = new Set(plan.flatMap((i) => i.objetivos.map((o) => o.slug))).size
    const compartidas = plan.filter((i) => i.compartida).length
    console.log(
      `${plan.length} archivos · ${totalProductos} productos a vincular · ${compartidas} imágenes compartidas`,
    )
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

  const resumen = { subidas: 0, vinculaciones: [], errores: [] }

  for (const item of plan) {
    process.stdout.write(`${item.archivo} … `)
    try {
      const { error: errorSubida } = await supabase.storage
        .from(BUCKET)
        .upload(item.path, readFileSync(path.join(CARPETA_FOTOS, item.archivo)), {
          contentType: item.mime,
          upsert: true,
        })
      if (errorSubida) throw new Error(`subida a Storage: ${errorSubida.message}`)

      const { data: medio, error: errorMedio } = await supabase
        .from('media_assets')
        .upsert(
          {
            bucket: BUCKET,
            path: item.path,
            alt: item.altMedio,
            width: item.width,
            height: item.height,
            mime_type: item.mime,
            bytes: item.bytes,
            source: 'own',
            source_url: null,
            credit: 'Chef Arturo',
            license: null,
            is_temporary: false,
          },
          { onConflict: 'bucket,path' },
        )
        .select('id')
        .single()
      if (errorMedio) throw new Error(`registro en media_assets: ${errorMedio.message}`)

      resumen.subidas++

      for (const objetivo of item.objetivos) {
        const resultado = await vincularImagenPrincipal(supabase, objetivo.slug, medio.id, objetivo.alt)
        resumen.vinculaciones.push(resultado)
      }

      console.log('ok')
    } catch (error) {
      console.log(`ERROR: ${error.message}`)
      resumen.errores.push({ archivo: item.archivo, error: error.message })
    }
  }

  console.log('\n── Resumen ──')
  console.log(`Archivos subidos y registrados: ${resumen.subidas}/${plan.length}`)
  console.log(`Productos vinculados: ${resumen.vinculaciones.length}`)
  const nuevas = resumen.vinculaciones.filter((v) => v.resultado === 'vinculada').length
  const yaEstaban = resumen.vinculaciones.filter((v) => v.resultado === 'ya-estaba').length
  const reemplazadas = resumen.vinculaciones.filter((v) => v.resultado === 'reemplazada').length
  console.log(`  · nuevas: ${nuevas} · ya estaban: ${yaEstaban} · reemplazadas: ${reemplazadas}`)
  if (resumen.errores.length > 0) {
    console.log(`\nErrores (${resumen.errores.length}):`)
    for (const e of resumen.errores) console.log(`  · ${e.archivo}: ${e.error}`)
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('Falló la importación:', error.message)
  process.exit(1)
})
