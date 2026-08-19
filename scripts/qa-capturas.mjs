/**
 * Capturas de QA.
 *
 *   npm run dev                 (en otra terminal)
 *   node scripts/qa-capturas.mjs
 *
 * Recorre las pantallas accesibles sin sesión en los cuatro anchos del
 * checklist y deja las imágenes en `docs/qa/`. Además informa el scroll
 * horizontal de cada una, que es el defecto responsive más común.
 *
 * Lo que necesita sesión administrativa NO se puede capturar sin un proyecto
 * Supabase real: `exigirAdmin()` redirige al login antes de renderizar. Está
 * anotado en docs/QA.md en lugar de simularse.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = process.env.QA_BASE ?? 'http://localhost:3000'
const SALIDA = 'docs/qa'

const VIEWPORTS = [
  { nombre: '390x844', width: 390, height: 844 },
  { nombre: '768x1024', width: 768, height: 1024 },
  { nombre: '1440x900', width: 1440, height: 900 },
  { nombre: '1920x1080', width: 1920, height: 1080 },
]

const PANTALLAS = [
  { nombre: 'admin-login', ruta: '/admin/login' },
  { nombre: 'admin-recuperar', ruta: '/admin/recuperar' },
  { nombre: 'admin-raiz', ruta: '/admin' },
  { nombre: 'home', ruta: '/' },
  { nombre: 'catalogo', ruta: '/catalogo' },
  { nombre: 'checkout-pago', ruta: '/checkout/pago' },
]

await mkdir(SALIDA, { recursive: true })

// El Chromium del entorno puede no coincidir con el build que espera la
// versión instalada de Playwright. `QA_CHROMIUM` permite apuntar al binario
// que hay, sin descargar nada.
const navegador = await chromium.launch(
  process.env.QA_CHROMIUM ? { executablePath: process.env.QA_CHROMIUM } : {},
)
const problemas = []

for (const vp of VIEWPORTS) {
  const contexto = await navegador.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  })
  const pagina = await contexto.newPage()

  const errores = []
  pagina.on('console', (m) => m.type() === 'error' && errores.push(m.text()))
  pagina.on('pageerror', (e) => errores.push(String(e)))

  for (const pantalla of PANTALLAS) {
    await pagina.goto(`${BASE}${pantalla.ruta}`, { waitUntil: 'networkidle' })
    await pagina.screenshot({
      path: `${SALIDA}/${pantalla.nombre}-${vp.nombre}.png`,
      fullPage: false,
    })

    const desborde = await pagina.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    if (desborde > 0) {
      problemas.push(`scroll horizontal · ${pantalla.ruta} @ ${vp.nombre}: ${desborde}px`)
    }
    // Toda área táctil tiene que llegar a 44px de alto, pero sólo se exige en
    // los anchos que se tocan con el dedo: en escritorio son objetivos de
    // mouse y la guía no aplica.
    //
    // El objetivo real de un radio o un checkbox es su <label>, no el input:
    // el patrón accesible deja el input en 1×1 y agranda la etiqueta. Medir el
    // input daba nueve falsos positivos por página.
    if (vp.width <= 768) {
      const chicas = await pagina.evaluate(() => {
        const controles = [...document.querySelectorAll('a, button, input, select, textarea')]
        return controles
          .filter((el) => {
            const objetivo = el.closest('label') ?? el
            const r = objetivo.getBoundingClientRect()
            return r.width > 0 && r.height > 0 && r.height < 44
          })
          .map((el) => `${el.tagName.toLowerCase()}: ${(el.textContent ?? '').trim().slice(0, 30)}`)
      })
      if (chicas.length > 0) {
        problemas.push(`áreas < 44px · ${pantalla.ruta} @ ${vp.nombre}: ${chicas.join(' | ')}`)
      }
    }
  }

  for (const e of errores) problemas.push(`consola @ ${vp.nombre}: ${e}`)
  await contexto.close()
}

await navegador.close()

if (problemas.length === 0) {
  console.log('✓ sin scroll horizontal, sin áreas táctiles chicas y sin errores de consola')
} else {
  console.log('Hallazgos:')
  for (const p of problemas) console.log('  ·', p)
}
