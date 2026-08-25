#!/usr/bin/env node
/**
 * Importador de imágenes · Catálogo completo Chef Arturo V1
 *
 * Sube a Supabase Storage la fotografía de los 37 productos del catálogo,
 * las registra en `media_assets` y las vincula como imagen principal de cada
 * producto en `product_images`.
 *
 * Sustituye a `importar-imagenes-pasteleria-v1.mjs`, que sólo cubría los 16
 * productos de pastelería y nunca llegó a ejecutarse contra el proyecto real.
 * Este manifiesto lo incluye entero, con los mismos destinos de Storage, así
 * que si aquella importación se hubiera aplicado, ésta la respetaría sin
 * duplicar nada.
 *
 * El mapeo archivo → producto es el MANIFIESTO de abajo: explícito, escrito
 * a mano a partir de la inspección visual de cada foto. Este script no hace
 * matching difuso en tiempo de ejecución — sólo valida que el manifiesto siga
 * siendo correcto (archivos presentes, formato real, productos existentes).
 *
 * Idempotente:
 *   - `media_assets` tiene `unique (bucket, path)`: el destino es
 *     determinístico, así que subir de nuevo el mismo archivo actualiza la
 *     fila existente — el `id` (UUID) no cambia entre corridas porque el
 *     upsert es por conflicto, no por borrar-e-insertar.
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
 *   node scripts/importar-imagenes-catalogo-v1.mjs --dry-run   # sin tocar nada
 *   node scripts/importar-imagenes-catalogo-v1.mjs --json       # el plan, como JSON
 *   node scripts/importar-imagenes-catalogo-v1.mjs              # aplica de verdad
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
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUBLICO = path.join(RAIZ, 'public')
const BUCKET = 'media'

/** Carpetas cuyo contenido tiene que estar íntegramente mapeado acá. */
const CARPETAS_DE_PRODUCTO = [
  'assets/productos/pasteleria',
  'assets/productos/merienda',
  'assets/productos/salados',
  'assets/productos/lunch-para-eventos',
]

/**
 * Manifiesto explícito: archivo → producto(s).
 *
 * `origen` es la ruta dentro de `public/`; `destino`, la ruta dentro del
 * bucket. Casi siempre coinciden en nombre, pero no siempre: dos fotos de
 * lunch viven en `public/fotos/` porque el sitio ya las usa en la home
 * (`src/content/imagenes.ts`), y moverlas rompería esas secciones — así que
 * se leen de ahí y se suben con el nombre del producto.
 *
 * `objetivos` es la lista de slugs que reciben esa foto como imagen
 * principal — más de uno cuando la misma fotografía sirve a dos productos.
 * `altMedio` es el texto alternativo que queda en `media_assets`; cada
 * objetivo lleva el suyo, más específico, en `product_images`.
 */
const MANIFIESTO = [
  // ── Pastelería ────────────────────────────────────────────────────────────
  {
    origen: 'assets/productos/pasteleria/crumble-manzana-individual.jpg',
    destino: 'productos/pasteleria/crumble-manzana-individual.jpg',
    altMedio: 'Crumble de manzana — individual',
    objetivos: [
      { slug: 'crumble-manzana-individual', alt: 'Crumble de manzana — individual' },
    ],
  },
  {
    origen: 'assets/productos/pasteleria/crumble-manzana-entero-kg.jpg',
    destino: 'productos/pasteleria/crumble-manzana-entero-kg.jpg',
    altMedio: 'Crumble de manzana — entero por kg',
    objetivos: [
      { slug: 'crumble-manzana-entero-kg', alt: 'Crumble de manzana — entero por kg' },
    ],
  },
  {
    origen: 'assets/productos/pasteleria/cheesecake-naranja-individual.jpg',
    destino: 'productos/pasteleria/cheesecake-naranja-individual.jpg',
    altMedio: 'Cheesecake de naranja — individual',
    objetivos: [
      {
        slug: 'cheesecake-naranja-individual',
        alt: 'Cheesecake de naranja — individual',
      },
    ],
  },
  {
    origen: 'assets/productos/pasteleria/cheesecake-naranja-entero-kg.jpg',
    destino: 'productos/pasteleria/cheesecake-naranja-entero-kg.jpg',
    altMedio: 'Cheesecake de naranja — entero por kg',
    objetivos: [
      {
        slug: 'cheesecake-naranja-entero-kg',
        alt: 'Cheesecake de naranja — entero por kg',
      },
    ],
  },
  {
    origen: 'assets/productos/pasteleria/lemon-pie-individual.jpg',
    destino: 'productos/pasteleria/lemon-pie-individual.jpg',
    altMedio: 'Lemon pie — individual',
    objetivos: [{ slug: 'lemon-pie-individual', alt: 'Lemon pie — individual' }],
  },
  {
    origen: 'assets/productos/pasteleria/lemon-pie-entero-kg.jpg',
    destino: 'productos/pasteleria/lemon-pie-entero-kg.jpg',
    altMedio: 'Lemon pie — entero por kg',
    objetivos: [{ slug: 'lemon-pie-entero-kg', alt: 'Lemon pie — entero por kg' }],
  },
  {
    origen: 'assets/productos/pasteleria/mango-maracuya-individual.jpg',
    destino: 'productos/pasteleria/mango-maracuya-individual.jpg',
    altMedio: 'Mango y maracuyá — individual',
    objetivos: [
      { slug: 'mango-maracuya-individual', alt: 'Mango y maracuyá — individual' },
    ],
  },
  {
    origen: 'assets/productos/pasteleria/mango-maracuya-entero-kg.jpg',
    destino: 'productos/pasteleria/mango-maracuya-entero-kg.jpg',
    altMedio: 'Mango y maracuyá — entero por kg',
    objetivos: [
      { slug: 'mango-maracuya-entero-kg', alt: 'Mango y maracuyá — entero por kg' },
    ],
  },
  {
    origen: 'assets/productos/pasteleria/mousse-pistacho-chocolate-blanco-individual.jpg',
    destino: 'productos/pasteleria/mousse-pistacho-chocolate-blanco-individual.jpg',
    altMedio: 'Mousse de pistacho y chocolate blanco — individual',
    objetivos: [
      {
        slug: 'mousse-pistacho-chocolate-blanco-individual',
        alt: 'Mousse de pistacho y chocolate blanco — individual',
      },
    ],
  },
  {
    origen: 'assets/productos/pasteleria/mousse-pistacho-chocolate-blanco-entero-kg.jpg',
    destino: 'productos/pasteleria/mousse-pistacho-chocolate-blanco-entero-kg.jpg',
    altMedio: 'Mousse de pistacho y chocolate blanco — entero por kg',
    objetivos: [
      {
        slug: 'mousse-pistacho-chocolate-blanco-entero-kg',
        alt: 'Mousse de pistacho y chocolate blanco — entero por kg',
      },
    ],
  },
  {
    origen:
      'assets/productos/pasteleria/mousse-dulce-de-leche-frutos-rojos-individual.jpg',
    destino: 'productos/pasteleria/mousse-dulce-de-leche-frutos-rojos-individual.jpg',
    altMedio: 'Mousse de dulce de leche y frutos rojos — individual',
    objetivos: [
      {
        slug: 'mousse-dulce-de-leche-frutos-rojos-individual',
        alt: 'Mousse de dulce de leche y frutos rojos — individual',
      },
    ],
  },
  {
    origen:
      'assets/productos/pasteleria/mousse-dulce-de-leche-frutos-rojos-entero-kg.jpg',
    destino: 'productos/pasteleria/mousse-dulce-de-leche-frutos-rojos-entero-kg.jpg',
    altMedio: 'Mousse de dulce de leche y frutos rojos — entero por kg',
    objetivos: [
      {
        slug: 'mousse-dulce-de-leche-frutos-rojos-entero-kg',
        alt: 'Mousse de dulce de leche y frutos rojos — entero por kg',
      },
    ],
  },
  {
    origen: 'assets/productos/pasteleria/cheesecake-clasica.jpg',
    destino: 'productos/pasteleria/cheesecake-clasica.jpg',
    altMedio: 'Cheesecake clásica de Chef Arturo',
    compartida: true,
    objetivos: [
      { slug: 'cheesecake-clasica-individual', alt: 'Cheesecake clásica — individual' },
      { slug: 'cheesecake-clasica-entero-kg', alt: 'Cheesecake clásica — entero por kg' },
    ],
  },
  {
    origen: 'assets/productos/pasteleria/cheesecake-maracuya.jpg',
    destino: 'productos/pasteleria/cheesecake-maracuya.jpg',
    altMedio: 'Cheesecake de maracuyá de Chef Arturo',
    compartida: true,
    objetivos: [
      {
        slug: 'cheesecake-maracuya-individual',
        alt: 'Cheesecake de maracuyá — individual',
      },
      {
        slug: 'cheesecake-maracuya-entero-kg',
        alt: 'Cheesecake de maracuyá — entero por kg',
      },
    ],
  },
  {
    origen: 'assets/productos/pasteleria/box-coleccion-dulce-9-postres.jpg',
    destino: 'productos/pasteleria/box-coleccion-dulce-9-postres.jpg',
    altMedio: 'Box Colección Dulce — 9 postres variados',
    objetivos: [
      {
        slug: 'box-coleccion-dulce-9-postres',
        alt: 'Box Colección Dulce — 9 postres variados',
      },
    ],
  },

  // ── Merienda ──────────────────────────────────────────────────────────────
  {
    origen: 'assets/productos/merienda/cookie-levain-clasica-chips.jpg',
    destino: 'productos/merienda/cookie-levain-clasica-chips.jpg',
    altMedio: 'Cookies Levain con chips de chocolate',
    compartida: true,
    objetivos: [
      { slug: 'cookie-levain-clasica-chips', alt: 'Cookie Levain clásica con chips' },
      { slug: 'box-cookies-levain-6-unidades', alt: 'Box Cookies Levain — 6 unidades' },
    ],
  },
  {
    origen: 'assets/productos/merienda/cookie-levain-pistacho-chocolate-blanco.jpg',
    destino: 'productos/merienda/cookie-levain-pistacho-chocolate-blanco.jpg',
    altMedio: 'Cookie Levain de pistacho y chocolate blanco',
    objetivos: [
      {
        slug: 'cookie-levain-pistacho-chocolate-blanco',
        alt: 'Cookie Levain de pistacho y chocolate blanco',
      },
    ],
  },
  {
    origen: 'assets/productos/merienda/cookie-levain-red-velvet-chocolate-blanco.jpg',
    destino: 'productos/merienda/cookie-levain-red-velvet-chocolate-blanco.jpg',
    altMedio: 'Cookie Levain red velvet con chocolate blanco',
    objetivos: [
      {
        slug: 'cookie-levain-red-velvet-chocolate-blanco',
        alt: 'Cookie Levain red velvet con chocolate blanco',
      },
    ],
  },
  {
    origen: 'assets/productos/merienda/cookie-levain-cacao-100.jpg',
    destino: 'productos/merienda/cookie-levain-cacao-100.jpg',
    altMedio: 'Cookie Levain cacao al 100%',
    objetivos: [{ slug: 'cookie-levain-cacao-100', alt: 'Cookie Levain cacao al 100%' }],
  },
  {
    origen: 'assets/productos/merienda/cookie-levain-especiada.jpg',
    destino: 'productos/merienda/cookie-levain-especiada.jpg',
    altMedio: 'Cookie Levain especiada',
    objetivos: [{ slug: 'cookie-levain-especiada', alt: 'Cookie Levain especiada' }],
  },
  {
    origen: 'assets/productos/merienda/box-brownies-arturo-selection-6-unidades.jpg',
    destino: 'productos/merienda/box-brownies-arturo-selection-6-unidades.jpg',
    altMedio: 'Box Brownies Arturo Selection — 6 unidades',
    objetivos: [
      {
        slug: 'box-brownies-arturo-selection-6-unidades',
        alt: 'Box Brownies Arturo Selection — 6 unidades',
      },
    ],
  },

  // ── Salados ───────────────────────────────────────────────────────────────
  {
    origen: 'assets/productos/salados/empanada-carne-premium.jpg',
    destino: 'productos/salados/empanada-carne-premium.jpg',
    altMedio: 'Empanada de carne premium',
    objetivos: [{ slug: 'empanada-carne-premium', alt: 'Empanada de carne premium' }],
  },
  {
    origen: 'assets/productos/salados/empanada-cerdo-braseado.jpg',
    destino: 'productos/salados/empanada-cerdo-braseado.jpg',
    altMedio: 'Empanada de cerdo braseado',
    objetivos: [{ slug: 'empanada-cerdo-braseado', alt: 'Empanada de cerdo braseado' }],
  },
  {
    origen: 'assets/productos/salados/empanada-pollo-crema.jpg',
    destino: 'productos/salados/empanada-pollo-crema.jpg',
    altMedio: 'Empanada de pollo a la crema',
    objetivos: [{ slug: 'empanada-pollo-crema', alt: 'Empanada de pollo a la crema' }],
  },
  {
    origen: 'assets/productos/salados/empanada-espinaca-quesos.jpg',
    destino: 'productos/salados/empanada-espinaca-quesos.jpg',
    altMedio: 'Empanada de espinaca y quesos',
    objetivos: [
      { slug: 'empanada-espinaca-quesos', alt: 'Empanada de espinaca y quesos' },
    ],
  },
  {
    origen: 'assets/productos/salados/tarta-calabaza-especiada.jpg',
    destino: 'productos/salados/tarta-calabaza-especiada.jpg',
    altMedio: 'Tarta de calabaza especiada',
    objetivos: [{ slug: 'tarta-calabaza-especiada', alt: 'Tarta de calabaza especiada' }],
  },
  {
    origen: 'assets/productos/salados/tarta-pollo-verduras.jpg',
    destino: 'productos/salados/tarta-pollo-verduras.jpg',
    altMedio: 'Tarta de pollo y verduras',
    objetivos: [{ slug: 'tarta-pollo-verduras', alt: 'Tarta de pollo y verduras' }],
  },
  {
    origen: 'assets/productos/salados/tarta-jamon-quesos.jpg',
    destino: 'productos/salados/tarta-jamon-quesos.jpg',
    altMedio: 'Tarta de jamón y quesos',
    objetivos: [{ slug: 'tarta-jamon-quesos', alt: 'Tarta de jamón y quesos' }],
  },
  {
    origen: 'assets/productos/salados/pizza-rellena.jpg',
    destino: 'productos/salados/pizza-rellena.jpg',
    altMedio: 'Pizza rellena',
    objetivos: [{ slug: 'pizza-rellena', alt: 'Pizza rellena' }],
  },
  {
    origen: 'assets/productos/salados/pascualina.jpg',
    destino: 'productos/salados/pascualina.jpg',
    altMedio: 'Pascualina',
    objetivos: [{ slug: 'pascualina', alt: 'Pascualina' }],
  },
  {
    origen: 'assets/productos/salados/pack-matero-6-empanadas.jpg',
    destino: 'productos/salados/pack-matero-6-empanadas.jpg',
    altMedio: 'Pack Matero — 6 empanadas variadas',
    objetivos: [
      { slug: 'pack-matero-6-empanadas', alt: 'Pack Matero — 6 empanadas variadas' },
    ],
  },

  // ── Lunch para eventos ────────────────────────────────────────────────────
  // Estas dos se leen de `public/fotos/`: el sitio ya las usa en la home
  // (`src/content/imagenes.ts`), así que no se mueven de ahí.
  {
    origen: 'fotos/luncheventos1.jpg',
    destino: 'productos/lunch-para-eventos/lunch-petit-especial-4-personas.jpg',
    altMedio: 'Torre de postres petit variados',
    objetivos: [
      {
        slug: 'lunch-petit-especial-4-personas',
        alt: 'Lunch Petit Especial — 4 personas',
      },
    ],
  },
  {
    origen: 'fotos/luncheventos2.jpg',
    destino: 'productos/lunch-para-eventos/lunch-celebracion-10-personas.jpg',
    altMedio: 'Mesa dulce para celebraciones',
    objetivos: [
      { slug: 'lunch-celebracion-10-personas', alt: 'Lunch Celebración — 10 personas' },
    ],
  },
  {
    origen: 'assets/productos/lunch-para-eventos/lunch-de-amigos-10-personas.jpg',
    destino: 'productos/lunch-para-eventos/lunch-de-amigos-10-personas.jpg',
    altMedio: 'Mesa de lunch salado para compartir',
    objetivos: [
      { slug: 'lunch-de-amigos-10-personas', alt: 'Lunch de Amigos — 10 personas' },
    ],
  },
]

const dryRun = process.argv.includes('--dry-run')
/** Emite el plan como JSON, para documentación y para el stub de QA. */
const comoJson = process.argv.includes('--json')

// ── Validaciones que no requieren red ───────────────────────────────────────

/** JPEG empieza siempre con estos tres bytes, sea cual sea la extensión. */
function esJpegDeVerdad(bytes) {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
}

function validarManifiesto() {
  const errores = []

  // Todos los archivos del manifiesto tienen que existir.
  for (const m of MANIFIESTO) {
    if (!existsSync(path.join(PUBLICO, m.origen))) {
      errores.push(`Falta el archivo del manifiesto: ${m.origen}`)
    }
  }

  // Ningún archivo de las carpetas de producto queda fuera del manifiesto:
  // evita que una foto nueva se suba "gratis" sin haber sido revisada.
  const origenes = new Set(MANIFIESTO.map((m) => m.origen))
  for (const carpeta of CARPETAS_DE_PRODUCTO) {
    const absoluta = path.join(PUBLICO, carpeta)
    if (!existsSync(absoluta)) {
      errores.push(`Falta la carpeta de producto: ${carpeta}`)
      continue
    }
    for (const f of readdirSync(absoluta)) {
      if (!origenes.has(`${carpeta}/${f}`)) {
        errores.push(`Archivo sin mapear en el manifiesto: ${carpeta}/${f}`)
      }
    }
  }

  // Dos entradas no pueden compartir origen ni destino (candidato ambiguo),
  // y un mismo producto no puede recibir dos imágenes distintas.
  const cuenta = (valores) => {
    const mapa = new Map()
    for (const v of valores) mapa.set(v, (mapa.get(v) ?? 0) + 1)
    return mapa
  }
  for (const [origen, n] of cuenta(MANIFIESTO.map((m) => m.origen))) {
    if (n > 1) errores.push(`Archivo con más de una entrada en el manifiesto: ${origen}`)
  }
  for (const [destino, n] of cuenta(MANIFIESTO.map((m) => m.destino))) {
    if (n > 1)
      errores.push(`Dos entradas apuntan al mismo destino de Storage: ${destino}`)
  }
  for (const [slug, n] of cuenta(
    MANIFIESTO.flatMap((m) => m.objetivos.map((o) => o.slug)),
  )) {
    if (n > 1)
      errores.push(`Producto con dos imágenes candidatas en el manifiesto: ${slug}`)
  }

  return errores
}

function leerYValidarArchivo(origen) {
  const ruta = path.join(PUBLICO, origen)
  const bytes = readFileSync(ruta)
  if (!esJpegDeVerdad(bytes)) {
    throw new Error(`${origen}: la firma binaria no es JPEG (¿archivo renombrado?)`)
  }
  const { width, height } = imageSize(bytes)
  return { bytes, width, height, mime: 'image/jpeg', tamano: bytes.length }
}

function planCompleto() {
  return MANIFIESTO.map((item) => {
    const info = leerYValidarArchivo(item.origen)
    return {
      ...item,
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
    if (error)
      throw new Error(`${slug}: no se pudo bajar la imagen anterior: ${error.message}`)
  }

  const { error: errorVinculo } = await supabase
    .from('product_images')
    .upsert(
      { product_id: producto.id, media_id: mediaId, alt, position: 0, is_primary: true },
      { onConflict: 'product_id,media_id' },
    )
  if (errorVinculo) {
    throw new Error(
      `${slug}: no se pudo vincular la imagen nueva: ${errorVinculo.message}`,
    )
  }

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
  if (errorBorrado) {
    throw new Error(
      `${slug}: no se pudo quitar la relación anterior: ${errorBorrado.message}`,
    )
  }

  // El asset anterior se borra sólo si media_asset_usage confirma que nada
  // más lo referencia — nunca se borra una imagen compartida.
  const { data: usos } = await supabase.rpc('media_asset_usage', {
    p_media_id: actual.media_id,
  })
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
  const totalProductos = new Set(plan.flatMap((i) => i.objetivos.map((o) => o.slug))).size

  if (comoJson) {
    console.log(JSON.stringify(plan, null, 2))
    return
  }

  if (dryRun) {
    console.log('── Plan (--dry-run, no se tocó nada) ──\n')
    for (const item of plan) {
      console.log(item.origen)
      console.log(`  → storage: ${BUCKET}/${item.destino}`)
      console.log(
        `  → ${item.width}×${item.height}px · ${item.mime} · ${item.bytes} bytes`,
      )
      console.log(`  → productos: ${item.objetivos.map((o) => o.slug).join(', ')}`)
      if (item.compartida) console.log('  → imagen compartida entre dos productos')
      console.log()
    }
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
    console.error(
      'Este script no simula una carga exitosa: si faltan credenciales, no hace nada.',
    )
    process.exit(1)
  }

  // Clave de servicio: sólo en este proceso, nunca en un log ni en un archivo.
  const supabase = createClient(url, clave, { auth: { persistSession: false } })

  const resumen = { subidas: 0, vinculaciones: [], errores: [] }

  for (const item of plan) {
    process.stdout.write(`${item.destino} … `)
    try {
      const { error: errorSubida } = await supabase.storage
        .from(BUCKET)
        .upload(item.destino, readFileSync(path.join(PUBLICO, item.origen)), {
          contentType: item.mime,
          upsert: true,
        })
      if (errorSubida) throw new Error(`subida a Storage: ${errorSubida.message}`)

      const { data: medio, error: errorMedio } = await supabase
        .from('media_assets')
        .upsert(
          {
            bucket: BUCKET,
            path: item.destino,
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
        const resultado = await vincularImagenPrincipal(
          supabase,
          objetivo.slug,
          medio.id,
          objetivo.alt,
        )
        resumen.vinculaciones.push(resultado)
      }

      console.log('ok')
    } catch (error) {
      console.log(`ERROR: ${error.message}`)
      resumen.errores.push({ archivo: item.origen, error: error.message })
    }
  }

  console.log('\n── Resumen ──')
  console.log(`Archivos subidos y registrados: ${resumen.subidas}/${plan.length}`)
  console.log(`Productos vinculados: ${resumen.vinculaciones.length}/${totalProductos}`)
  const cuenta = (r) => resumen.vinculaciones.filter((v) => v.resultado === r).length
  console.log(
    `  · nuevas: ${cuenta('vinculada')} · ya estaban: ${cuenta('ya-estaba')} · reemplazadas: ${cuenta('reemplazada')}`,
  )
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
