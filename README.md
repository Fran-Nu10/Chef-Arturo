# Chef Arturo · La Vitrina

E-commerce gastronómico de Chef Arturo (Florida, Uruguay), implementado sobre la
dirección visual **La Vitrina** exportada desde Claude Design.

Stack: **Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Framer Motion ·
Supabase (PostgreSQL, Auth, Storage) · Zod**.

```bash
npm install
cp .env.example .env.local   # opcional: sin esto arranca en modo demo
npm run dev                  # http://localhost:3000
npm run lint
npm run typecheck
npm run test                 # 97 pruebas de dominio
npm run db:test              # 81 aserciones SQL/RLS contra PostgreSQL real
npm run build
```

## Modo demo

Sin credenciales de Supabase la aplicación **arranca igual**: el storefront
público muestra los datos de `src/content/` y el panel avisa qué variables
faltan. Nunca finge un guardado ni muestra un panel operativo vacío.

## Panel de demostración

Para mostrar el panel completo antes de conectar Supabase:

```bash
echo 'DEMO_ADMIN_BYPASS=true' >> .env.local
npm run dev
```

Después, **Acceso de gestión** en el pie de la tienda, o `/admin/login`
directamente. Entrá con cualquier email y cualquier contraseña —los dos campos
tienen que tener algo— y el panel carga con productos, pedidos, clientes,
contenido y reportes de ejemplo.

Todo el panel muestra arriba un banner que dice **«Modo demostración — los
cambios no se guardan»**, con un botón para salir. Los formularios se abren y
validan como siempre, pero al guardar avisan que es una demostración: no se
finge ninguna persistencia.

**Cómo se apaga.** Borrá `DEMO_ADMIN_BYPASS` de `.env.local`, o poné cualquier
valor que no sea exactamente `true`. Y sobre todo: **se apaga sola**. Con las
variables de Supabase configuradas el bypass queda desactivado aunque la
variable siga en `true`, así que no puede quedar abierto por olvido al pasar a
producción. En modo real sólo funciona la autenticación de Supabase.

Los datos de ejemplo están en `src/server/demo/datos.ts` y son inventados: no
son el catálogo del negocio ni su lista de precios.

## Backend y panel

| Documento | Qué cubre |
| --- | --- |
| [`docs/BACKEND.md`](docs/BACKEND.md) | Arquitectura, puesta en marcha, definiciones del reporte |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Tablas, reglas en la base y relaciones |
| [`docs/SECURITY.md`](docs/SECURITY.md) | RLS, `security definer`, secretos, riesgos pendientes |
| [`docs/ADMIN_BOOTSTRAP.md`](docs/ADMIN_BOOTSTRAP.md) | Crear el primer dueño |
| [`docs/MERCADO_PAGO.md`](docs/MERCADO_PAGO.md) | Checkout Pro y webhook |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Despliegue, backups, rollback |
| [`docs/QA.md`](docs/QA.md) | Qué se probó, contra qué, y qué queda pendiente |

El panel vive en `/admin`. No hay registro público: las cuentas se crean a mano
siguiendo `docs/ADMIN_BOOTSTRAP.md`.

## De dónde sale esto

El diseño original vive en [`project/`](project/) como prototipos HTML/CSS/JS y no se
toca: es la referencia. Los archivos que se implementaron son

| Prototipo | Implementación |
| --- | --- |
| `Home.dc.html` | `/` — las once secciones |
| `Pantallas 1 - Catalogo y Producto.dc.html` | pantallas 1–8 |
| `Pantallas 2 - Carrito y Checkout.dc.html` | pantallas 9–18 |
| `Pantallas 3 - Evento y Estado.dc.html` | pantallas 19–21 |
| `Especificacion.dc.html` | tokens, inventario de componentes, spec de movimiento y assets pendientes |

`project/README-handoff.md` es el README original del bundle de Claude Design.

## Rutas

| # | Pantalla | Ruta |
| --- | --- | --- |
| — | Home | `/` |
| 1 | Catálogo general | `/catalogo` |
| 2 | Catálogo filtrado | `/catalogo/[categoria]` |
| 3 | Búsqueda sin resultados | `/catalogo` (al buscar sin coincidencias) |
| 4 | Ficha de compra directa | `/producto/pasteleria-01` |
| 5 | Ficha por encargo | `/producto/pasteleria-02` |
| 6 | Producto que requiere fecha | `/producto/lunch-01` |
| 7 | Producto no disponible | `/producto/merienda-03` |
| 8 | Vista rápida (m + d) | overlay desde catálogo y home |
| 9 | Carrito vacío | `/carrito` (sin líneas) |
| 10 | Carrito con productos | `/carrito` · drawer desde el header |
| 11 | Retiro o entrega | `/checkout/entrega` |
| 12 | Fecha y horario | `/checkout/fecha` |
| 13 | Datos del comprador | `/checkout/datos` |
| 14 | Resumen del pedido | `/checkout/resumen` |
| 15 | Mercado Pago o WhatsApp | `/checkout/pago` |
| 16 | Pago pendiente | `/pedido/pendiente` |
| 17 | Pedido confirmado | `/pedido/confirmado` |
| 18 | Error de pago recuperable | `/pedido/error` |
| 19 | Solicitud para evento | `/evento` |
| 20 | Confirmación de solicitud | `/evento/confirmacion` |
| 21 | Estado del pedido | `/estado` |

## Estructura

```
src/
  app/            rutas del App Router (una por pantalla) + globals.css con los tokens
  components/
    home/         las once secciones de la home
    layout/       header, barra y drawer de carrito, pie
    pantallas/    piezas de las vistas comerciales (catálogo, ficha, checkout…)
    ui/           primitivas del sistema: botón, tag de modalidad, arco, vista rápida
  content/        el contenido, separado del diseño (productos, campañas, FAQ, galería)
  lib/            estado del pedido, ciclo de agregado al carrito, utilidades de scroll
```

### Tokens

Están en `src/app/globals.css`, dentro de `@theme`, copiados uno a uno de la
especificación: `--color-verde` `#1E4B40`, `--color-papel` `#F7F3EA`,
`--color-caramelo` `#C1762F`, la escala tipográfica en `clamp()`, el radio del arco
y `--ease-editorial`. Ningún componente escribe un hex ni un tamaño a mano; todo sale
de esas variables vía las clases de Tailwind (`bg-verde`, `text-titulo`, `border-linea`).

### Contenido

`src/content/` modela las campañas, la galería y las preguntas frecuentes de la home
como colecciones de fixtures. **Nada de eso afirma un hecho del negocio no validado**:
las respuestas del FAQ dicen "Contenido pendiente de validación". El catálogo real
—categorías y productos— ya no vive acá: se carga en Supabase desde
`supabase/migrations/` y el storefront lo lee en vivo (`docs/CATALOGO_REAL_V1.md`).

El WhatsApp del negocio (`NEGOCIO.whatsapp`) es el número confirmado por la casa, no un
placeholder.

## Movimiento

Los dos picos usan `useScroll` + `useTransform` sobre un track con la escena en `sticky`:

- **La Vitrina Viva** (`src/components/home/VitrinaViva.tsx`) — track de 175svh. El
  titular y los CTA salen entre el 35 % y el 55 % del progreso; el arco escala hasta
  `max(vw/w, vh/h) · 1.06` viajando al centro del viewport y perdiendo radio, borde y
  hairline entre el 30 % y el 78 %.
- **El detalle final** (`src/components/home/ElDetalleFinal.tsx`) — track de 200svh. La
  ventana crece hasta el 94 % del viewport y entran tres frases en 0.42 / 0.55 / 0.68.

El resto es movimiento breve: header compacto al pasar los 40px, categorías con
`flex-grow` 1 → 1.8, crossfade de 240ms al cambiar de protagonista, reveals de
encabezado con `whileInView`, `AnimatePresence` para sheets y drawers, y dos rieles de
galería con deriva de ±0.3 / −0.22 del `deltaY`, que se pausa al interactuar.

`useReducedMotion` corta todo eso: el hero pasa a una sección estática de 100svh, la
ventana del detalle final queda a tamaño medio con las tres frases visibles y los
rieles se mueven sólo por swipe o drag. La información nunca depende de la animación.

## Assets pendientes

Cada hueco de imagen o video es un `<MediaPendiente>` con las dimensiones reservadas y
la leyenda de qué falta, de modo que colocar el asset real no mueva el layout (CLS).
El inventario completo con formatos está en `project/Especificacion.dc.html` § 4:
video del hero (9:16 1080×1920 y 16:10 ≥1920×1200, con poster), video de "El detalle
final", tres fotos de categoría, fotos de producto, ocho o más de galería, una imagen
por campaña y el logo en SVG.

Cuando lleguen, `MediaPendiente` es el único punto a tocar: pasa a envolver
`next/image` o `<video>` conservando el recorte y la caja.

## Verificado

- `npm run build` genera las 29 rutas de forma estática.
- Sin errores de consola y sin scroll horizontal en 360×800, 390×844, 768×1024 y 1440×900.
- Todas las áreas táctiles llegan a 44px de alto.
- Los dos picos de movimiento cubren el viewport y respetan `prefers-reduced-motion`.
- "Armá tu ocasión" se sirve como formulario único de tres pasos apilados: sin
  JavaScript sigue siendo usable, y el stepper aparece al hidratar.
