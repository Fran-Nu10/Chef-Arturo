# Carrito, acceso al panel y fluidez — diagnóstico y corrección

Cuatro síntomas reportados, siete causas distintas. Ninguna era de CSS.
Todo lo que sigue se midió contra un build de producción (`next build` +
`next start`), no en desarrollo, servido por un stub local de PostgREST y
Storage con el catálogo real de 37 productos: desde este entorno no hay
salida de red hacia Supabase.

---

## 1 · El carrito no funcionaba

### 1.1 Líneas de prototipo sembradas en el estado inicial

`estado-pedido.tsx` arrancaba con dos líneas cuyos slugs —`pasteleria-01`,
`pasteleria-02`— no existen en el catálogo real. El componente resolvía
cada línea contra el catálogo con `if (!producto) return null`.

Resultado: el contador del header decía "2 productos" y la lista salía
vacía. No había forma de vaciarlo, porque no había ninguna fila que tocar.

**Corrección.** Se elimina la siembra. Y se separa la fuente de verdad: el
contador y la lista salen los dos de `resolverCarrito()`, así que ya no
pueden discrepar. Lo que no resuelve va a `huerfanos` y se avisa, en lugar
de desaparecer en silencio.

### 1.2 El carrito no sobrevivía a una recarga

El estado vivía sólo en memoria. Recargar, volver desde otra pestaña o
abrir un producto en pestaña nueva lo perdía todo.

**Corrección.** `localStorage` versionado bajo `chef_arturo_pedido` con la
forma `{ v, lineas }`.

### 1.3 Migrar el formato no puede costarle el carrito a nadie

Antes de versionar se guardaba el array pelado. Una lectura estricta habría
vaciado el carrito de cualquiera que tuviera uno abierto en el momento del
despliegue.

**Corrección.** `leerGuardado()` acepta las dos formas, normaliza línea por
línea y descarta **sólo** las que no se entienden; el resto del carrito
sobrevive. Un JSON corrupto o el modo privado de Safari devuelven un
carrito vacío en vez de romper la tienda.

### 1.4 Precios

Los importes se leen de `price_cents` como enteros. Un producto a cotizar
no aporta al subtotal ni recibe un precio inventado: el resumen muestra el
subtotal conocido y dice que el resto se confirma por WhatsApp.

---

## 2 · La pantalla intermedia "Ver carrito"

La barra inferior era un `<Link href="/carrito">`. Para ver el carrito
había que abandonar la página y aterrizar en una pantalla que repetía las
mismas líneas y ofrecía volver. Un paso entero que no hacía nada.

Además el drawer existente no era un diálogo: sin foco atrapado, sin
Escape, sin bloqueo del scroll de fondo, y con un overlay que seguía
capturando clics después de cerrarse.

**Corrección.** La barra abre el drawer en la misma página. `/carrito`
sigue existiendo para enlaces directos e historial y muestra exactamente lo
mismo: `ContenidoCarrito` es un único componente compartido. El drawer pasa
a ser un diálogo modal completo, hoja inferior en móvil y panel lateral en
escritorio.

---

## 3 · La pantalla en blanco del panel

**El síntoma.** Entrar al panel desde el pie de la tienda dejaba la
pantalla completamente vacía. Recargar a mano sí funcionaba, lo que lo
hacía parecer intermitente.

**Lo medido.** Un clic de cliente sobre "Acceso de gestión" producía:

```
200 GET /admin?_rsc=ZmCQ44b92m4mXe_R
200 GET /admin/login?_rsc=V0SDEHvF-hwUkHc4
200 GET /admin/login?_rsc=D2BOO2MHYnUWS9lY   ← ×189, siempre el mismo hash
```

191 peticiones, `document.body.innerText === ""`, y el cuerpo reducido a un
límite de Suspense vacío (`<!--$--><!--/$-->`). Instrumentando el layout se
comprobó que **ninguna** de esas 189 peticiones lo ejecutaba.

Se verificó primero que el fallo era anterior a esta rama: con `main` y el
mismo build, idéntica pantalla vacía.

**La causa.** No era CSS ni la cabecera `x-pathname`. Era la forma del
árbol de rutas: **`/admin/login` colgaba del mismo layout que redirigía
hacia él.** `admin/layout.tsx` leía `x-pathname` para dejar pasar el login,
exigía sesión para todo lo demás y hacía `redirect('/admin/login')`. En una
navegación de cliente el router pedía `/admin`, recibía el redirect y pedía
el destino — que seguía estando por debajo del layout que acababa de
redirigir. El segmento nunca terminaba de resolverse y el router quedaba
pidiendo lo mismo indefinidamente.

Una carga directa no fallaba porque el navegador sigue un 307 y vuelve a
pedir la página entera, sin árbol de segmentos que reconciliar.

**Corrección.** Grupo de rutas `src/app/admin/(panel)/`, con el guard y el
chasis en `(panel)/layout.tsx`. `login` y `recuperar` quedan fuera: pasan a
ser hermanas del panel, no hijas. El destino del redirect deja de estar
dentro de quien redirige. Las URLs no cambian: un grupo de rutas no aparece
en la dirección.

De paso, el guard deja de depender de una cabecera para saber dónde está.
La estructura lo dice.

**Después de la corrección**, la misma navegación:

```
200 GET /admin?_rsc=ZmCQ44b92m4mXe_R
200 GET /admin/login?_rsc=CRMFyCm-lKt2umqR
```

Dos peticiones y el formulario a la vista.

### 3.1 No había ningún límite de error

El proyecto no tenía `error.tsx` en ninguna parte. Cualquier excepción de
render se mostraba como una pantalla vacía.

**Corrección.** `app/error.tsx`, `app/admin/error.tsx` y
`app/global-error.tsx`. Un fallo ahora dice qué pasó y ofrece una salida.

### 3.2 No se podía volver a la tienda

Desde `/admin/login`, sin credenciales, no había forma de volver salvo el
botón del navegador.

**Corrección.** "← Volver a la tienda" en el login y "← Ver tienda" en la
barra lateral del panel.

---

## 4 · Lentitud y doble toque

### 4.1 El layout raíz bloqueaba las rutas del panel

`app/layout.tsx` consultaba el catálogo completo antes de renderizar
cualquier ruta, incluidas las del panel, que no lo usan.

**Corrección.** El layout mira la ruta y se saltea la consulta en `/admin`.

### 4.2 Un `setTimeout` de 700 ms antes de agregar al carrito

`agregar.ts` esperaba 700 ms antes de agregar, para que se viera la
animación de confirmación. Quien tocaba y no veía reacción, tocaba otra
vez. La animación se conserva; el producto entra en el mismo toque.

### 4.3 El overlay de la vista rápida sobrevivía al cierre

`VistaRapida` tenía `role="dialog"` y ningún modo de cerrarla con el
teclado, y su overlay seguía interceptando clics tras cerrarse: el
siguiente toque se lo comía el overlay y hacía falta un segundo. Se añade
Escape y se libera el overlay al salir.

### 4.4 Lo que se probó y se descartó

Envolver la navegación de "Acceso de gestión" en `useTransition` para
mostrar "Abriendo…" en el mismo toque. Fue peor: `/admin` responde con un
redirect del servidor y empujarlo desde una transición dejaba la navegación
colgada. Se revirtió y la espera se resolvió donde estaba —§ 4.1— en vez de
disfrazarla.

También se descartó una hipótesis propia: una primera medición marcó "la
card de producto falla con un toque". Era un artefacto de la prueba, que
tocaba un elemento fuera de pantalla. Con `scrollIntoViewIfNeeded` la card
navega al primer toque en `/` y en `/catalogo`.

---

## Verificación

| Comprobación | Resultado |
|---|---|
| `npm run lint` | sin avisos |
| `npm run typecheck` | sin errores |
| `npm test` | 155 pruebas, 11 archivos |
| `npm run build` | correcto |
| `npm run db:test` | 113 comprobaciones de RLS, pedidos, stock, pagos e imágenes |

QA sobre build de producción, en 390×844, 430×932 y 1440×900:

- El carrito arranca en 0. Abre en 45–56 ms.
- Las fotos reales de cada línea cargan en los tres anchos.
- Las cantidades responden en ~200 ms, sin esperar red.
- El carrito sobrevive a la recarga; una línea guardada en el formato
  anterior se migra y se muestra; una línea huérfana se avisa sin arrastrar
  al resto.
- Diálogo modal con nombre accesible, foco atrapado y devuelto, Escape,
  scroll de fondo bloqueado, sin overlay residual.
- Sin desbordamiento horizontal ni errores de consola.
- Un toque por control, sin excepción: abrir carrito 90 ms, cerrar 718 ms,
  barra inferior 56 ms, seguir comprando 538 ms, card de producto 144 ms,
  acceso de gestión 150 ms, volver a la tienda 141 ms.
- Recorrido completo del panel en modo demostración: login, las seis
  secciones, "Ver tienda", y entrar al login con sesión ya abierta. Ninguna
  pantalla en blanco, ningún bucle.

### Lo que no se pudo verificar acá

**WebKit.** El contenedor sólo trae Chromium y la descarga de WebKit falla
sin salida de red hacia el CDN de Playwright. Safari e iOS son el navegador
principal de buena parte del público de esta tienda, así que conviene
recorrer el carrito en un iPhone real antes de dar esto por cerrado.
Los puntos con más riesgo son `100dvh`/`max-h-[90dvh]` en la hoja inferior
y `env(safe-area-inset-bottom)`.

**Supabase real.** Sin red hacia `*.supabase.co` desde este entorno, todo
se probó contra un stub local con el catálogo real. Las consultas y los
adaptadores son los mismos; lo que no se ejerció es la latencia real ni la
autenticación real de Supabase Auth. El recorrido del panel con sesión se
verificó en modo demostración.
