// QA visual del panel simplificado de productos, categorías e imágenes.
//
// Corre contra el dev server en modo demostración (sin backend):
//
//   NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= \
//     DEMO_ADMIN_BYPASS=true npm run dev
//   node scripts/qa-admin-simple.mjs
//
// Capturas en docs/qa/admin-simple-*.png (1440×900 y 390×844). Sale con
// código 1 si alguna verificación falla.
import { chromium } from 'playwright-core'

const EXE = process.env.QA_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const BASE = 'http://localhost:3000'
const FOTO = 'public/fotos/LamesadeChefArturo.jpg'

// Archivos de prueba del subidor: un SVG (formato prohibido) y un "JPEG"
// de 11 MB (excede el límite). Se generan al vuelo en el tmp del sistema.
import { writeFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
const CARPETA_TMP = mkdtempSync(join(tmpdir(), 'qa-admin-'))
const SVG = join(CARPETA_TMP, 'mala.svg')
const GRANDE = join(CARPETA_TMP, 'grande.jpg')
writeFileSync(SVG, '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
writeFileSync(GRANDE, Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(11 * 1024 * 1024)]))

const VPS = [
  { w: 1440, h: 900, tag: '1440x900' },
  { w: 390, h: 844, tag: '390x844' },
]

const problemas = []
const ok = (msg) => console.log(`  ok · ${msg}`)
const mal = (msg) => { problemas.push(msg); console.log(`  FALLA · ${msg}`) }

async function shot(page, nombre, tag) {
  await page.screenshot({ path: `docs/qa/admin-simple-${nombre}-${tag}.png`, fullPage: false })
}

async function shotFull(page, nombre, tag) {
  await page.screenshot({ path: `docs/qa/admin-simple-${nombre}-${tag}.png`, fullPage: true })
}

async function sinOverflow(page, donde) {
  const r = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    ancho: document.documentElement.clientWidth,
  }))
  if (r.scroll > r.ancho + 1) mal(`${donde}: overflow horizontal (${r.scroll} > ${r.ancho})`)
  else ok(`${donde}: sin overflow horizontal`)
}

async function sinIds(page, donde) {
  const texto = await page.evaluate(() => document.body.innerText)
  const uuid = texto.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  if (uuid) mal(`${donde}: UUID visible: ${uuid[0]}`)
  else ok(`${donde}: sin UUIDs visibles`)
  if (/Copialo desde Medios|Id de la imagen|Id de imagen/i.test(texto)) {
    mal(`${donde}: texto de Medios/IDs presente`)
  }
}

async function login(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' })
  await page.fill('input[name="email"]', 'julia@demo.test')
  await page.fill('input[name="password"]', 'demodemo')
  await Promise.all([
    page.waitForURL('**/admin', { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ])
}

const navegador = await chromium.launch({ executablePath: EXE })

for (const vp of VPS) {
  console.log(`\n═══ ${vp.tag} ═══`)
  const ctx = await navegador.newContext({ viewport: { width: vp.w, height: vp.h } })
  const page = await ctx.newPage()
  page.setDefaultTimeout(30000)
  await login(page)

  // ── Lista de productos ────────────────────────────────────────────────
  await page.goto(`${BASE}/admin/productos`, { waitUntil: 'networkidle' })
  await shot(page, 'productos-lista', vp.tag)
  await sinOverflow(page, `productos ${vp.tag}`)
  await sinIds(page, `productos ${vp.tag}`)
  const nav = await page.evaluate(() => document.body.innerText)
  if (/\bMedios\b/.test(nav)) mal(`productos ${vp.tag}: «Medios» sigue visible`)
  else ok(`productos ${vp.tag}: sin «Medios» en la navegación`)
  if (nav.includes('A consultar')) ok(`productos ${vp.tag}: precio «A consultar» presente`)
  const placeholder = await page.getAttribute('input[type="search"]', 'placeholder')
  if (placeholder === 'Buscar producto') ok(`placeholder correcto`)
  else mal(`placeholder: ${placeholder}`)

  if (vp.w < 500) {
    // Filtros detrás del botón en mobile
    const visible = await page.isVisible('select[name="estado"]')
    if (visible) mal('mobile: filtros visibles sin abrir')
    else ok('mobile: filtros ocultos por defecto')
    await page.click('button:has-text("Filtros")')
    await page.waitForSelector('select[name="estado"]', { state: 'visible' })
    await shot(page, 'productos-filtros', vp.tag)
    ok('mobile: filtros se abren con el botón')
  }

  // Menú de acciones de la primera fila (la tabla desktop está oculta en
  // mobile y duplica los nodos: hay que apuntar al visible)
  const resumen = page.locator('summary[aria-label^="Más acciones"]:visible').first()
  await resumen.click()
  await page.waitForTimeout(300)
  await shot(page, 'productos-menu-acciones', vp.tag)
  const menuTexto = await page.evaluate(() => document.body.innerText)
  for (const item of ['Duplicar', 'Archivar']) {
    if (menuTexto.includes(item)) ok(`menú: ${item}`)
    else mal(`menú sin ${item}`)
  }
  await resumen.click()

  // ── Producto nuevo ────────────────────────────────────────────────────
  await page.goto(`${BASE}/admin/productos/nuevo`, { waitUntil: 'networkidle' })
  await shotFull(page, 'producto-nuevo', vp.tag)
  await sinOverflow(page, `producto nuevo ${vp.tag}`)
  await sinIds(page, `producto nuevo ${vp.tag}`)
  const textoNuevo = await page.evaluate(() => document.body.innerText)
  for (const esperado of [
    'Foto del producto',
    'Usá una foto clara y vertical. JPG, PNG, WebP o AVIF, hasta 10 MB.',
    'El cliente ve el precio y puede agregarlo al carrito.',
    'El cliente elige el producto y coordina una fecha.',
    'El cliente consulta por WhatsApp antes de comprar.',
    'Guardar como borrador',
    'Publicar producto',
    'Crear nueva categoría',
    'Más opciones',
  ]) {
    // Algunas etiquetas se transforman a mayúsculas por CSS; innerText devuelve
    // el texto ya transformado.
    if (textoNuevo.toLowerCase().includes(esperado.toLowerCase())) {
      ok(`nuevo: «${esperado.slice(0, 40)}…»`)
    } else mal(`nuevo: falta «${esperado}»`)
  }
  if (textoNuevo.includes('Slug') || textoNuevo.includes('Destacado')) {
    mal('nuevo: Slug o Destacado visibles con el acordeón cerrado')
  } else ok('nuevo: sin Slug ni Destacado a la vista')

  // Modalidad «Por encargo» muestra anticipación; «Consultar precio» oculta el precio
  await page.click('label:has-text("Por encargo")')
  if (await page.isVisible('input[name="leadTimeDays"]')) ok('encargo: pregunta la anticipación')
  else mal('encargo: no muestra anticipación')
  await page.click('label:has-text("Consultar precio")')
  if (await page.isVisible('input[name="price"]')) mal('consultar: el precio sigue visible')
  else ok('consultar: el precio se oculta')
  await page.click('label:has-text("Compra directa")')

  // Acordeón avanzado
  await page.click('summary:has-text("Más opciones")')
  await page.waitForTimeout(200)
  await shotFull(page, 'producto-nuevo-avanzado', vp.tag)
  const avanzado = await page.evaluate(() => document.body.innerText)
  if (avanzado.includes('¿Querés controlar la cantidad disponible?')) ok('avanzado: control de stock en lenguaje simple')
  else mal('avanzado: falta la pregunta de stock')
  await page.click('summary:has-text("Más opciones")')

  // Estados del subidor: foto elegida, formato inválido, tamaño excedido
  await page.setInputFiles('input[type="file"]', FOTO)
  await page.waitForSelector('text=La foto se sube al guardar.')
  await shot(page, 'producto-foto-elegida', vp.tag)
  ok('subidor: previsualización local + aviso «se sube al guardar»')

  await page.setInputFiles('input[type="file"]', SVG)
  await page.waitForSelector('text=Ese formato de imagen no está permitido')
  await shot(page, 'producto-error-formato', vp.tag)
  ok('subidor: SVG rechazado con mensaje en español')

  await page.setInputFiles('input[type="file"]', GRANDE)
  await page.waitForSelector('text=La foto supera el máximo de 10 MB.')
  await shot(page, 'producto-error-tamano', vp.tag)
  ok('subidor: archivo de 11 MB rechazado')

  // El error no borró el formulario
  await page.fill('input[name="name"]', 'Torta de prueba QA')
  await page.setInputFiles('input[type="file"]', SVG)
  await page.waitForSelector('text=Ese formato de imagen no está permitido')
  const nombre = await page.inputValue('input[name="name"]')
  if (nombre === 'Torta de prueba QA') ok('el error de formato no borra lo escrito')
  else mal('el formulario perdió datos tras un error')

  // ── Editar producto (con foto elegida y error de subida sin backend) ──
  await page.goto(`${BASE}/admin/productos`, { waitUntil: 'networkidle' })
  await page.locator('a:has-text("Editar"):visible').first().click()
  await page.waitForSelector('text=Guardar cambios')
  await shotFull(page, 'producto-editar', vp.tag)
  await sinIds(page, `producto editar ${vp.tag}`)
  if (await page.isVisible('text=Visible en la tienda')) ok('editar: toggle «Visible en la tienda»')
  else mal('editar: falta el toggle de visibilidad')

  await page.setInputFiles('input[type="file"]', FOTO)
  await page.waitForSelector('text=La foto se sube al guardar.')
  await shot(page, 'producto-editar-con-foto', vp.tag)
  await page.click('button:has-text("Guardar cambios")')
  await page.waitForSelector('text=Para subir fotos, el backend tiene que estar conectado.')
  await shot(page, 'producto-error-subida', vp.tag)
  const sigueNombre = await page.inputValue('input[name="name"]')
  if (sigueNombre.length > 0) ok('editar: el error de subida conserva el formulario')

  // ── Ordenar productos ─────────────────────────────────────────────────
  await page.goto(`${BASE}/admin/productos/ordenar`, { waitUntil: 'networkidle' })
  await shotFull(page, 'ordenar-productos', vp.tag)
  await sinOverflow(page, `ordenar ${vp.tag}`)

  const items = page.locator('[data-orden-item]')
  const antes = await items.first().textContent()
  await page.locator('button[aria-label^="Bajar"]').first().click()
  const despues = await items.first().textContent()
  if (antes !== despues) ok('ordenar: «Bajar» mueve el producto')
  else mal('ordenar: «Bajar» no movió nada')
  await page.waitForSelector('text=Tenés cambios de orden sin guardar.')
  ok('ordenar: aviso de cambios sin guardar')

  if (vp.w > 500) {
    // Arrastre con el puntero: primer manubrio hasta debajo del tercero
    const manubrio = page.locator('button[aria-label^="Arrastrar"]').first()
    const destino = page.locator('[data-orden-item]').nth(2)
    const a = await manubrio.boundingBox()
    const b = await destino.boundingBox()
    const antesDrag = await items.first().textContent()
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
    await page.mouse.down()
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(
        a.x + a.width / 2,
        a.y + ((b.y + b.height - a.y) * i) / 8,
      )
    }
    await page.mouse.up()
    const despuesDrag = await items.first().textContent()
    if (antesDrag !== despuesDrag) ok('ordenar: arrastre con mouse funciona')
    else mal('ordenar: el arrastre no movió nada')
    await shot(page, 'ordenar-arrastrado', vp.tag)
  }

  // ── Categorías ────────────────────────────────────────────────────────
  await page.goto(`${BASE}/admin/categorias`, { waitUntil: 'networkidle' })
  await shotFull(page, 'categorias-lista', vp.tag)
  await sinOverflow(page, `categorías ${vp.tag}`)
  await sinIds(page, `categorías ${vp.tag}`)
  const textoCat = await page.evaluate(() => document.body.innerText)
  if (/\d+ productos/.test(textoCat)) ok('categorías: cantidad de productos visible')
  else mal('categorías: falta la cantidad de productos')
  if (textoCat.includes('Nueva categoría')) ok('categorías: botón «Nueva categoría»')

  await page.locator('a:has-text("Editar"):visible').first().click()
  await page.waitForSelector('text=Foto de la categoría')
  await shotFull(page, 'categoria-editar', vp.tag)
  await sinIds(page, `categoría editar ${vp.tag}`)
  if (await page.isVisible('button:has-text("Quitar foto")')) {
    await page.click('button:has-text("Quitar foto")')
    await page.waitForSelector('text=La foto se quitará al guardar.')
    await shot(page, 'categoria-quitar-foto', vp.tag)
    ok('categoría: estado «quitando» con Deshacer')
    await page.click('button:has-text("Deshacer")')
  }

  // ── Nueva categoría ───────────────────────────────────────────────────
  await page.goto(`${BASE}/admin/categorias/nueva`, { waitUntil: 'networkidle' })
  await shotFull(page, 'categoria-nueva', vp.tag)

  // ── Editor de contenido ───────────────────────────────────────────────
  await page.goto(`${BASE}/admin/contenido`, { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Imagen del arco')
  await shotFull(page, 'contenido-imagen', vp.tag)
  await sinIds(page, `contenido ${vp.tag}`)
  const textoCont = await page.evaluate(() => document.body.innerText)
  if (textoCont.includes('Elegir foto') || textoCont.includes('Reemplazar foto')) {
    ok('contenido: el campo de imagen es un subidor')
  } else mal('contenido: no aparece el subidor')

  // ── Objetivos táctiles ────────────────────────────────────────────────
  await page.goto(`${BASE}/admin/productos`, { waitUntil: 'networkidle' })
  const chicos = await page.evaluate(() => {
    const malos = []
    for (const el of document.querySelectorAll('a[href], button, input, select')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.height < 43.5) malos.push(`${el.tagName}:${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}=${Math.round(r.height)}px`)
    }
    return malos.slice(0, 8)
  })
  if (chicos.length) mal(`objetivos <44px: ${chicos.join(' | ')}`)
  else ok('todos los objetivos interactivos ≥44px')

  await ctx.close()
}

await navegador.close()

console.log('\n══════════════════')
if (problemas.length) {
  console.log(`FALLAS: ${problemas.length}`)
  for (const p of problemas) console.log(` - ${p}`)
  process.exit(1)
}
console.log('QA VISUAL OK')
