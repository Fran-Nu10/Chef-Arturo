// QA visual de las fotos reales de pastelería contra el stub local (sin red
// hacia Supabase). Recorre home, /catalogo, /catalogo/pasteleria, la ficha
// de un producto, la vista rápida y el carrito en 390×844 y 1440×900.
//
// Uso: ver docs/MEDIA_MAPPING_PASTELERIA_V1.md.
import { chromium } from 'playwright-core'

const EXE =
  process.env.QA_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const BASE = process.env.QA_BASE ?? 'http://localhost:3001'

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
  await page.screenshot({ path: `docs/qa/pasteleria-${nombre}-${tag}.png`, fullPage })
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
          .filter((img) => (img.currentSrc || img.src).includes('pasteleria'))
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
    }))
  })
  const pasteleria = datos.filter((d) => d.src.includes('pasteleria'))
  const rotas = pasteleria.filter((d) => d.naturalWidth === 0)
  const sinCover = pasteleria.filter(
    (d) => d.displayW > 0 && d.displayH > 0 && d.objectFit !== 'cover',
  )
  const sinAlt = pasteleria.filter((d) => !d.alt || d.alt.trim() === '')

  if (pasteleria.length < minEsperado) {
    mal(
      `${donde}: se esperaban al menos ${minEsperado} fotos de pastelería, hay ${pasteleria.length}`,
    )
  } else {
    ok(`${donde}: ${pasteleria.length} fotos de pastelería en pantalla`)
  }
  if (rotas.length > 0)
    mal(
      `${donde}: ${rotas.length} imagen(es) rota(s): ${rotas.map((r) => r.src).join(', ')}`,
    )
  else if (pasteleria.length > 0) ok(`${donde}: ninguna imagen rota`)

  if (sinCover.length > 0) {
    mal(`${donde}: ${sinCover.length} imagen(es) sin object-fit:cover`)
  } else if (pasteleria.length > 0) {
    ok(`${donde}: todas con object-fit:cover`)
  }

  if (sinAlt.length > 0) mal(`${donde}: ${sinAlt.length} imagen(es) sin alt`)
  else if (pasteleria.length > 0) ok(`${donde}: todas con alt`)

  return pasteleria
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

    // ── /catalogo/pasteleria ───────────────────────────────────────────────
    await ir(page, `${BASE}/catalogo/pasteleria`)
    await cargarPerezosas(page)
    await sinOverflow(page, `catalogo/pasteleria ${vp.tag}`)
    const conFoto = await revisarImagenes(page, `catalogo/pasteleria ${vp.tag}`, {
      minEsperado: 16,
    })
    await shot(page, 'catalogo-pasteleria', vp.tag)

    // Producto correcto en la card correcta: crumble individual no debe
    // llevar la foto de crumble entero ni viceversa.
    const individual = conFoto.find((i) => i.src.includes('crumble-manzana-individual'))
    const entero = conFoto.find((i) => i.src.includes('crumble-manzana-entero-kg'))
    if (individual && entero && individual.src !== entero.src) {
      ok(
        `catalogo/pasteleria ${vp.tag}: crumble individual y entero usan fotos distintas`,
      )
    } else {
      mal(`catalogo/pasteleria ${vp.tag}: crumble individual/entero no se distinguen`)
    }
    // Cheesecake clásica: individual y entero comparten literalmente el mismo
    // archivo — es lo esperado (imagen compartida).
    const clasicaImgs = conFoto.filter((i) => i.src.includes('cheesecake-clasica'))
    if (
      clasicaImgs.length >= 2 &&
      clasicaImgs.every((i) => i.src === clasicaImgs[0].src)
    ) {
      ok(
        `catalogo/pasteleria ${vp.tag}: cheesecake clásica comparte la misma foto entre presentaciones`,
      )
    } else if (clasicaImgs.length >= 2) {
      mal(`catalogo/pasteleria ${vp.tag}: cheesecake clásica no comparte la misma foto`)
    }

    // ── /catalogo general ──────────────────────────────────────────────────
    await ir(page, `${BASE}/catalogo`)
    await cargarPerezosas(page)
    await sinOverflow(page, `catalogo ${vp.tag}`)
    await revisarImagenes(page, `catalogo ${vp.tag}`, { minEsperado: 16 })
    await shot(page, 'catalogo-general', vp.tag)

    // ── Ficha de producto ──────────────────────────────────────────────────
    await ir(page, `${BASE}/producto/mousse-pistacho-chocolate-blanco-individual`)
    await cargarPerezosas(page)
    await sinOverflow(page, `ficha producto ${vp.tag}`)
    const enFicha = await revisarImagenes(page, `ficha producto ${vp.tag}`, {
      minEsperado: 1,
    })
    if (
      enFicha.some((i) => i.src.includes('mousse-pistacho-chocolate-blanco-individual'))
    ) {
      ok(`ficha producto ${vp.tag}: muestra la foto del producto correcto`)
    } else {
      mal(`ficha producto ${vp.tag}: no se encontró la foto esperada`)
    }
    await shot(page, 'ficha-producto', vp.tag)

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
console.log('QA VISUAL DE PASTELERÍA OK')
