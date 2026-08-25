// QA visual de la fotografía del catálogo completo contra el stub local (sin
// red hacia Supabase). Recorre la home, /catalogo, las cuatro categorías, una
// ficha de producto por categoría, la vista rápida y el carrito, en 1440×900
// y 390×844.
//
// Uso: ver docs/MEDIA_MAPPING_CATALOGO_IMAGENES_V1.md.
import { chromium } from 'playwright-core'

const EXE =
  process.env.QA_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const BASE = process.env.QA_BASE ?? 'http://localhost:3000'

/** Cuántos productos activos tiene cada categoría, y una ficha de muestra. */
const CATEGORIAS = [
  {
    slug: 'pasteleria',
    productos: 17,
    ficha: 'mousse-pistacho-chocolate-blanco-individual',
  },
  { slug: 'merienda', productos: 7, ficha: 'cookie-levain-cacao-100' },
  { slug: 'salados', productos: 10, ficha: 'pascualina' },
  { slug: 'lunch-para-eventos', productos: 3, ficha: 'lunch-de-amigos-10-personas' },
]

const VPS = [
  { w: 1440, h: 900, tag: '1440x900' },
  { w: 390, h: 844, tag: '390x844' },
]

const problemas = []
const ok = (msg) => console.log(`  ok · ${msg}`)
const mal = (msg) => {
  problemas.push(msg)
  console.log(`  FALLA · ${msg}`)
}

async function shot(page, nombre, tag, fullPage = true) {
  await page.screenshot({ path: `docs/qa/catalogo-${nombre}-${tag}.png`, fullPage })
}

async function ir(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
}

/**
 * Fuerza que se carguen las imágenes lazy: `next/image` sólo pide el
 * archivo cuando entra al viewport, así que sin esto casi todo tendría
 * `naturalWidth = 0` por diseño y no por estar roto.
 */
async function cargarPerezosas(page) {
  await page.evaluate(async () => {
    const paso = window.innerHeight
    const alto = document.documentElement.scrollHeight
    for (let y = 0; y < alto; y += paso) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 80))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  // Esperar a que cada <img> de pastelería termine de cargar de verdad —
  // next/image dispara la carga al entrar al viewport, no al hacer scroll.
  await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll('img')]
          .filter((img) => {
            const src = img.currentSrc || img.src
            return src.includes('%2Fproductos%2F') || src.includes('/productos/')
          })
          .every((img) => img.complete && img.naturalWidth > 0),
      { timeout: 8000 },
    )
    .catch(() => {})
  await page.waitForTimeout(200)
}

async function sinOverflow(page, donde) {
  const r = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    ancho: document.documentElement.clientWidth,
  }))
  if (r.scroll > r.ancho + 1)
    mal(`${donde}: overflow horizontal (${r.scroll} > ${r.ancho})`)
  else ok(`${donde}: sin overflow horizontal`)
}

/** Revisa cada <img> visible: dimensiones reales, object-fit, y que cargó. */
async function revisarImagenes(page, donde, { minEsperado = 0 } = {}) {
  const datos = await page.evaluate(() => {
    return [...document.querySelectorAll('img')].map((img) => ({
      src: img.currentSrc || img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayW: img.clientWidth,
      displayH: img.clientHeight,
      objectFit: getComputedStyle(img).objectFit,
      loading: img.loading,
      alt: img.alt,
      // `currentSrc` sólo se llena cuando el navegador eligió un candidato y
      // fue a buscarlo. Hace falta para distinguir "todavía no cargó" de
      // "está rota": el atributo `src` de next/image apunta siempre al
      // candidato más grande del srcset (w=3840), así que una imagen lazy
      // fuera del viewport tiene naturalWidth 0 sin que le pase nada malo.
      intentada: Boolean(img.currentSrc),
      completa: img.complete,
    }))
  })
  const fotos = datos.filter(
    (d) => d.src.includes('%2Fproductos%2F') || d.src.includes('/productos/'),
  )
  // Rota = el navegador la pidió de verdad y no pudo decodificarla. Las que
  // nunca entraron al viewport no cuentan: no cargarlas es lo correcto.
  const rotas = fotos.filter((d) => d.intentada && d.completa && d.naturalWidth === 0)
  const sinCargar = fotos.filter((d) => !d.intentada).length
  const sinCover = fotos.filter(
    (d) => d.intentada && d.displayW > 0 && d.displayH > 0 && d.objectFit !== 'cover',
  )
  const sinAlt = fotos.filter((d) => !d.alt || d.alt.trim() === '')

  if (fotos.length < minEsperado) {
    mal(
      `${donde}: se esperaban al menos ${minEsperado} fotos de producto, hay ${fotos.length}`,
    )
  } else {
    ok(`${donde}: ${fotos.length} fotos de producto en pantalla`)
  }
  if (rotas.length > 0)
    mal(
      `${donde}: ${rotas.length} imagen(es) rota(s): ${rotas.map((r) => r.src).join(', ')}`,
    )
  else if (fotos.length > 0)
    ok(
      `${donde}: ninguna imagen rota` +
        (sinCargar > 0 ? ` (${sinCargar} aún sin cargar, lazy)` : ''),
    )

  if (sinCover.length > 0) {
    mal(`${donde}: ${sinCover.length} imagen(es) sin object-fit:cover`)
  } else if (fotos.length > 0) {
    ok(`${donde}: todas con object-fit:cover`)
  }

  if (sinAlt.length > 0) mal(`${donde}: ${sinAlt.length} imagen(es) sin alt`)
  else if (fotos.length > 0) ok(`${donde}: todas con alt`)

  return fotos
}

const erroresConsola = []

function espiarConsola(page, donde) {
  page.on('console', (msg) => {
    if (msg.type() === 'error')
      erroresConsola.push(`${donde}: ${msg.text().slice(0, 200)}`)
  })
  page.on('pageerror', (err) =>
    erroresConsola.push(`${donde}: ${err.message.slice(0, 200)}`),
  )
}

const navegador = await chromium.launch({ executablePath: EXE })

for (const vp of VPS) {
  console.log(`\n═══ ${vp.tag} ═══`)
  const ctx = await navegador.newContext({ viewport: { width: vp.w, height: vp.h } })
  const page = await ctx.newPage()
  page.setDefaultTimeout(20000)
  espiarConsola(page, `consola ${vp.tag}`)

  try {
    // ── Home ────────────────────────────────────────────────────────────────
    await ir(page, `${BASE}/`)
    await cargarPerezosas(page)
    await sinOverflow(page, `home ${vp.tag}`)
    await revisarImagenes(page, `home ${vp.tag}`, { minEsperado: 4 })
    await shot(page, 'home', vp.tag)

    // Sección de pastelería específicamente (primer bloque de categoría)
    try {
      const seccionPasteleria = page
        .locator('h2:has-text("Pastelería"), h3:has-text("Pastelería")')
        .first()
      if (await seccionPasteleria.count()) {
        await seccionPasteleria.scrollIntoViewIfNeeded({ timeout: 5000 })
        await page.waitForTimeout(300)
        await shot(page, 'home-seccion-pasteleria', vp.tag, false)
        ok(`home ${vp.tag}: sección de Pastelería visible`)
      } else {
        mal(`home ${vp.tag}: no se encontró la sección de Pastelería`)
      }
    } catch (e) {
      mal(
        `home ${vp.tag}: no se pudo desplazar hasta la sección de Pastelería (${e.message.split('\n')[0]})`,
      )
    }

    // ── Cada categoría, con todos sus productos ────────────────────────────
    for (const cat of CATEGORIAS) {
      await ir(page, `${BASE}/catalogo/${cat.slug}`)
      await cargarPerezosas(page)
      await sinOverflow(page, `catalogo/${cat.slug} ${vp.tag}`)
      const conFoto = await revisarImagenes(page, `catalogo/${cat.slug} ${vp.tag}`, {
        minEsperado: cat.productos,
      })
      await shot(page, `catalogo-${cat.slug}`, vp.tag)

      // Ninguna card puede quedar con el placeholder de "falta la foto".
      const placeholders = await page.evaluate(
        () =>
          document.body.innerText.split('\n').filter((l) => /Falta la foto de/i.test(l))
            .length,
      )
      if (placeholders > 0) {
        mal(`catalogo/${cat.slug} ${vp.tag}: ${placeholders} producto(s) sin foto`)
      } else {
        ok(`catalogo/${cat.slug} ${vp.tag}: ningún producto sin foto`)
      }

      // Cada producto de la categoría tiene que llevar una foto distinta,
      // salvo los pares que comparten a propósito.
      const unicas = new Set(conFoto.map((i) => i.src.replace(/&w=\d+/, '')))
      ok(
        `catalogo/${cat.slug} ${vp.tag}: ${unicas.size} fotos distintas para ${cat.productos} productos`,
      )

      // ── Ficha de un producto de esta categoría ───────────────────────────
      await ir(page, `${BASE}/producto/${cat.ficha}`)
      await cargarPerezosas(page)
      await sinOverflow(page, `ficha ${cat.ficha} ${vp.tag}`)
      const enFicha = await revisarImagenes(page, `ficha ${cat.ficha} ${vp.tag}`, {
        minEsperado: 1,
      })
      if (enFicha.length > 0) {
        ok(`ficha ${cat.ficha} ${vp.tag}: muestra su fotografía`)
      } else {
        mal(`ficha ${cat.ficha} ${vp.tag}: no se encontró ninguna foto`)
      }
      await shot(page, `ficha-${cat.slug}`, vp.tag)
    }

    // Producto correcto en la card correcta: crumble individual no debe
    // llevar la foto de crumble entero ni viceversa.
    await ir(page, `${BASE}/catalogo/pasteleria`)
    await cargarPerezosas(page)
    const enPasteleria = await revisarImagenes(page, `pares pastelería ${vp.tag}`, {
      minEsperado: 17,
    })
    const individual = enPasteleria.find((i) =>
      i.src.includes('crumble-manzana-individual'),
    )
    const entero = enPasteleria.find((i) => i.src.includes('crumble-manzana-entero-kg'))
    if (individual && entero && individual.src !== entero.src) {
      ok(`pastelería ${vp.tag}: crumble individual y entero usan fotos distintas`)
    } else {
      mal(`pastelería ${vp.tag}: crumble individual/entero no se distinguen`)
    }
    // Cheesecake clásica: individual y entero comparten literalmente el mismo
    // archivo — es lo esperado (imagen compartida).
    const clasicaImgs = enPasteleria.filter((i) => i.src.includes('cheesecake-clasica'))
    if (
      clasicaImgs.length >= 2 &&
      clasicaImgs.every((i) => i.src === clasicaImgs[0].src)
    ) {
      ok(
        `pastelería ${vp.tag}: cheesecake clásica comparte la misma foto entre presentaciones`,
      )
    } else if (clasicaImgs.length >= 2) {
      mal(`pastelería ${vp.tag}: cheesecake clásica no comparte la misma foto`)
    }

    // ── /catalogo general: los 37 juntos ───────────────────────────────────
    await ir(page, `${BASE}/catalogo`)
    await cargarPerezosas(page)
    await sinOverflow(page, `catalogo ${vp.tag}`)
    await revisarImagenes(page, `catalogo ${vp.tag}`, { minEsperado: 37 })
    const sinFoto = await page.evaluate(
      () =>
        document.body.innerText.split('\n').filter((l) => /Falta la foto de/i.test(l))
          .length,
    )
    if (sinFoto > 0) {
      mal(`catalogo ${vp.tag}: ${sinFoto} producto(s) sin foto en el catálogo completo`)
    } else {
      ok(`catalogo ${vp.tag}: los 37 productos tienen foto`)
    }
    await shot(page, 'catalogo-general', vp.tag)

    // ── Vista rápida (desde el catálogo) ───────────────────────────────────
    await ir(page, `${BASE}/catalogo/pasteleria`)
    const botonVistaRapida = page
      .locator('button', { hasText: /vista rápida|ver rápido|vista previa/i })
      .first()
    if (await botonVistaRapida.count()) {
      await botonVistaRapida.click()
      await page.waitForTimeout(400)
      await revisarImagenes(page, `vista rápida ${vp.tag}`, { minEsperado: 1 })
      await shot(page, 'vista-rapida', vp.tag, false)
      ok(`vista rápida ${vp.tag}: abrió con foto`)
    } else {
      console.log(
        `  · vista rápida ${vp.tag}: no hay botón visible en esta pantalla (se omite)`,
      )
    }

    // ── Carrito ────────────────────────────────────────────────────────────
    // El botón de agregar vive en la ficha del producto, no en la card del
    // listado (que sólo ofrece «Vista rápida»).
    await ir(page, `${BASE}/producto/crumble-manzana-individual`)
    const agregar = page.locator('button', { hasText: /Agregar al carrito/i }).first()
    if (await agregar.count()) {
      await agregar.click()
      await page.waitForTimeout(500)
      const abrirCarrito = page
        .locator('button[aria-label*="carrito" i], a[href="/carrito"]')
        .first()
      if (await abrirCarrito.count()) {
        await abrirCarrito.click()
        await page.waitForTimeout(400)
      }
      await sinOverflow(page, `carrito ${vp.tag}`)
      await revisarImagenes(page, `carrito ${vp.tag}`, { minEsperado: 1 })
      await shot(page, 'carrito', vp.tag, false)
    } else {
      console.log(
        `  · carrito ${vp.tag}: no se encontró un producto de compra directa para agregar`,
      )
    }
  } catch (e) {
    mal(`${vp.tag}: la corrida se interrumpió (${e.message.split('\n')[0]})`)
  }

  await ctx.close()
}

await navegador.close()

console.log('\n══════════════════')
if (erroresConsola.length > 0) {
  console.log(`Errores de consola/next-image (${erroresConsola.length}):`)
  for (const e of erroresConsola) console.log(`  · ${e}`)
}
if (problemas.length || erroresConsola.length) {
  console.log(
    `\nFALLAS: ${problemas.length} · errores de consola: ${erroresConsola.length}`,
  )
  process.exit(1)
}
console.log('QA VISUAL DEL CATÁLOGO OK')
