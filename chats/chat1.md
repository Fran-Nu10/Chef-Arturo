# Incomplete request

_Started 2026-08-18 17:14 UTC_

---

## User

Make UI mockups for

## Assistant



## Assistant

_[tool: set_project_title]_

_[tool: ask_user]_

Dejé un formulario breve arriba: la captura de Instagram (no llegó adjunta), el rol del sistema Classical, tratamiento de fotos, scroll en desktop e interactividad. En cuanto respondas (o toques "decidí por mí"), construyo las tres direcciones.

## User

Answered — captura: b99bc6e3-17e8-4a83-b0d8-931cbfef7fb5.png; ds_rol: Las 3 direcciones son independientes; Classical solo como vara de calidad; fotos: Zonas para soltar fotos; desktop_scroll: Página con scroll; interaccion: Estados solo visuales

## Assistant

_[tool: view_image]_

_[tool: copy_starter_component]_

_[tool: update_todos]_

_[tool: dc_write]_

_[tool: show_to_user]_

_[tool: dc_write]_

_[tool: dc_write]_

_[tool: dc_write]_

_[tool: update_todos]_

_[tool: ready_for_verification]_

Listo para revisión. Cuatro archivos:

- **Direcciones** (abierto): análisis de la captura, specs completas de cada dirección (paleta, tipos, escalas, movimiento, riesgos, assets) y recomendación — **A** es la más sólida.
- **A — La Vitrina**: verde del logo como tinta, arcos de vitrina, Instrument Serif + Archivo.
- **B — Mediodía**: manteca/pistacho, Bricolage Grotesque, full-bleed y cinta tipográfica.
- **C — El Obrador**: retícula con reglas, datos en mono, fichas de taller.

Cada dirección trae mobile completo (fold marcado en 844), quick view mobile, desktop 1440 (fold en 900), quick view desktop y tablero de estados. Todas las zonas de imagen aceptan fotos arrastradas.

Pendiente: elegir dirección antes de desarrollar el resto del sitio; el movimiento del hero quedó especificado, no implementado, como pedía el brief.

## User

<system-info comment="Only acknowledge these if relevant">
Project title is now "UI mockups para formulario"
What `list_files` on the project root returns right now (dotfiles, if any, are not shown here):
📁 _ds
📁 uploads
📄 Direccion A - La Vitrina.dc.html
📄 Direccion B - Mediodia.dc.html
📄 Direccion C - El Obrador.dc.html
📄 Direcciones.dc.html
📄 image-slot.js
📄 support.js
User is viewing file: Direcciones.dc.html
</system-info>

<pasted_text name="Pasted text (496 lines)">
Continuá trabajando sobre la dirección visual seleccionada “La Vitrina” de Chef Arturo.

No crees otro proyecto, no vuelvas a explorar direcciones y no reemplaces el sistema visual existente. Esta dirección ya fue elegida.

Conservá:

* el verde profundo como tinta dominante;
* el fondo crema;
* el naranja como acento controlado;
* la tipografía editorial condensada;
* la combinación de serif y sans serif;
* las ventanas arqueadas;
* las líneas finas;
* la numeración editorial;
* la jerarquía tipográfica;
* la sensación de vitrina gastronómica;
* la composición mobile y desktop ya diseñada.

El objetivo ahora es transformar esta dirección en un e-commerce gastronómico completo, contemporáneo y visualmente memorable, preparado para ser exportado y posteriormente implementado en Next.js, TypeScript, Tailwind CSS y Framer Motion por otro agente de programación.

No quiero una colección de secciones independientes. Construí una narrativa visual continua.

PRINCIPIO DE MOVIMIENTO

La página tendrá solamente dos grandes picos visuales:

1. “La Vitrina Viva” en el hero.
2. “El detalle final” aproximadamente a mitad de la home.

El resto utilizará movimiento más breve y comercial:

* transiciones de categorías;
* crossfades;
* máscaras;
* desplazamientos;
* parallax limitado;
* carruseles nativos;
* reveals;
* cambios de escala sutiles;
* continuidad entre fondos y geometrías.

No animes todas las cards.
No conviertas cada sección en un scroll pin.
No bloquees el scroll vertical.
No uses giroscopio.
No uses WebGL o Three.js.
No utilices movimiento meramente decorativo.

HOME — ORDEN COMPLETO

1. HEADER

Conservá el lenguaje del header actual.

Incluí:

* marca centrada o con jerarquía editorial;
* acceso al catálogo;
* categorías principales;
* WhatsApp;
* carrito con cantidad;
* menú mobile accesible;
* estado inicial transparente o crema;
* estado compacto al hacer scroll.

El carrito siempre debe poder recuperarse en mobile.

2. LA VITRINA VIVA — HERO

Transformá el arco actual en una ventana de producto vivo.

Estado inicial:

* titular;
* explicación breve;
* CTA “Ver catálogo”;
* CTA secundario “Pedir por WhatsApp”;
* ventana arqueada con poster o video;
* identificación discreta de Florida, Uruguay.

Comportamiento de scroll propuesto:

* track total aproximado: 160–180svh;
* hero sticky durante el tramo;
* progreso 0–0.25: entrada del titular y la ventana;
* progreso 0.20–0.55: el contenido gastronómico dentro del arco se acerca;
* progreso 0.45–0.78: el arco aumenta de escala y pierde progresivamente su borde;
* progreso 0.70–1: el medio ocupa la pantalla y entrega visualmente la siguiente sección;
* texto y CTA deben salir antes de que el medio los cubra;
* no aplicar rotaciones 3D gratuitas;
* conservar una versión estática completa con reduced motion.

El hero debe seguir comunicando qué vende Chef Arturo. La animación nunca puede ocultar esa información.

Contrato provisional del asset:

Mobile:

* video vertical 9:16;
* 1080 × 1920;
* duración ideal de 7–10 segundos;
* loop visualmente continuo;
* encuadre central;
* safe area superior e inferior del 18%;
* poster obligatorio.

Desktop:

* video 16:10 o 4:3;
* mínimo 1920 × 1200;
* sujeto principal centrado dentro del arco;
* espacio negativo suficiente para la composición;
* poster obligatorio.

El asset real podría mostrar terminación de una torta, apertura de packaging, una mesa de merienda o armado de una bandeja. No elijas definitivamente cuál hasta recibir material real.

Usá un placeholder claramente marcado mientras falte el video.

3. ELEGÍ TU OCASIÓN

Rediseñá la sección actual para que funcione como navegación comercial entre:

* Pastelería;
* Merienda;
* Lunch para eventos.

Desktop:

* tres ventanas editoriales;
* una categoría activa;
* imagen de mayor escala en la categoría activa;
* cambio de copy e imagen al hacer hover o click;
* acceso directo al catálogo filtrado.

Mobile:

* carrusel horizontal;
* scroll-snap;
* una tarjeta dominante;
* parte de la siguiente visible;
* swipe nativo;
* indicadores de posición accesibles.

No inventes productos, precios ni características.

4. SELECCIÓN DE LA CASA

Convertí la sección actual en un módulo editorial de compra.

Desktop:

* producto protagonista sticky a la izquierda;
* lista o composición de productos a la derecha;
* cambio de imagen mediante crossfade;
* acciones de vista rápida;
* etiquetas de modalidad: compra directa, por encargo o consultar;
* evitar una grilla uniforme convencional.

Mobile:

* producto protagonista;
* carrusel secundario;
* imágenes grandes;
* nombre, modalidad, precio pendiente y acción visibles;
* vista rápida en bottom sheet;
* carrito persistente después de agregar.

La interacción debe contemplar:

* reposo;
* hover;
* seleccionado;
* agotado;
* no disponible para la fecha;
* precio pendiente;
* agregando;
* agregado correctamente.

5. EL DETALLE FINAL — EXPERIENCIA DE VIDEO

Creá una segunda experiencia visual fuerte.

La sección comienza como una ventana de video relativamente pequeña integrada en el fondo crema. Al avanzar el scroll, la ventana se expande y modifica la composición.

Secuencia:

* track aproximado: 180–220svh;
* video sticky;
* progreso 0–0.25: ventana pequeña con título;
* progreso 0.20–0.55: expansión hasta ocupar gran parte del viewport;
* progreso 0.45–0.75: aparecen dos o tres frases breves vinculadas al proceso;
* progreso 0.70–1: el video deja paso a la siguiente sección;
* usar opacity, scale, clip-path y transform;
* no sincronizar video frame por frame;
* pausar fuera del viewport;
* autoplay, muted, loop y playsInline;
* poster obligatorio.

No inventes una historia artesanal ni afirmaciones sobre elaboración. Utilizá copy temporal como:

* “El detalle también forma parte del pedido”.
* “Contenido de proceso pendiente de validación”.
* “Video de terminación o armado”.

6. ARMÁ TU OCASIÓN

Diseñá un módulo interactivo que aporte valor real a pedidos para reuniones y eventos.

No debe funcionar todavía como una calculadora exacta ni recomendar cantidades inventadas.

Campos visuales:

* tipo de ocasión;
* cantidad aproximada de personas;
* fecha deseada;
* preferencia general;
* retiro o entrega;
* observaciones.

Resultado:

* resumen legible;
* aclaración de que la disponibilidad será confirmada;
* CTA para continuar por WhatsApp;
* CTA opcional para solicitar propuesta.

Presentación:

* composición editorial, no formulario administrativo;
* pasos cortos;
* selección táctil;
* progreso visible;
* transición con AnimatePresence en la implementación futura;
* estado de regreso sin perder datos;
* versión completa sin JavaScript.

7. FECHAS QUE IMPORTAN

Diseñá una sección administrable para campañas especiales:

* Pascuas;
* Día del Padre;
* celebraciones;
* campañas futuras.

Estos nombres son ejemplos de estructura, no campañas vigentes.

La sección debe admitir:

* imagen o video;
* título;
* descripción;
* rango de fechas;
* CTA;
* estado programado;
* estado activo;
* estado finalizado.

Visualmente utilizá ventanas superpuestas o un archivo editorial de campañas. No uses un slider genérico con puntos debajo.

8. DE LA COCINA A TU MESA

Evolucioná “Tres maneras de pedir” hacia una explicación más completa:

* comprá directamente;
* encargá para una fecha;
* consultá por tu evento;
* elegí retiro o entrega;
* recibí confirmación.

Utilizá una línea que avance y números editoriales. Los pasos pueden entrar progresivamente con scroll, pero todo el contenido debe ser visible sin animaciones.

No afirmes tiempos, costos ni zonas todavía.

9. LA MESA DE CHEF ARTURO

Creá una galería visual para fotografías reales del negocio.

Debe admitir:

* imágenes verticales;
* imágenes horizontales;
* video breve;
* enlace opcional a Instagram;
* texto alternativo;
* orden administrable.

Movimiento:

* dos rieles con velocidades diferentes;
* desplazamiento suave;
* dirección influenciada levemente por el scroll;
* drag en desktop;
* swipe nativo en mobile;
* pausa al interactuar;
* sin movimiento continuo bajo reduced motion.

No incrustes directamente el feed de Instagram. Diseñá una galería administrable para no depender de una integración externa ni perjudicar rendimiento.

10. INFORMACIÓN PARA PEDIR

Diseñá un bloque de información y preguntas frecuentes para:

* anticipación;
* retiro;
* entrega;
* pagos;
* señas;
* cambios;
* pedidos para eventos.

Todo el contenido debe aparecer como pendiente de validación.

Usá acordeones accesibles.
No agregues animaciones complejas.

11. CIERRE EDITORIAL

Terminá la home con una composición visual fuerte pero breve:

* fotografía o video;
* título;
* CTA “Ver catálogo”;
* CTA “Consultar por WhatsApp”;
* información de ubicación pendiente;
* footer compacto.

No repitas literalmente el hero.

PANTALLAS DEL E-COMMERCE

Después de completar la home, diseñá las siguientes vistas manteniendo el mismo sistema:

1. Catálogo general.
2. Catálogo filtrado por categoría.
3. Búsqueda sin resultados.
4. Ficha de producto de compra directa.
5. Ficha de producto por encargo.
6. Producto que requiere fecha.
7. Producto no disponible.
8. Vista rápida mobile y desktop.
9. Carrito vacío.
10. Carrito con productos.
11. Selección de retiro o entrega.
12. Selección de fecha y horario.
13. Datos del comprador.
14. Resumen del pedido.
15. Elección entre Mercado Pago y coordinación por WhatsApp.
16. Pago pendiente.
17. Pedido confirmado.
18. Error de pago recuperable.
19. Solicitud para evento.
20. Confirmación de solicitud.
21. Consulta de estado del pedido mediante código o teléfono.

No diseñes todavía el panel administrativo. Será una fase separada después de validar qué información debe gestionar.

REGLAS DE COMPRA

Representá visualmente tres modalidades:

A. COMPRA DIRECTA

* precio definido;
* cantidad;
* carrito;
* checkout;
* Mercado Pago o WhatsApp.

B. ENCARGO

* fecha;
* posible anticipación;
* posible seña;
* confirmación de disponibilidad.

C. EVENTO O COTIZACIÓN

* ocasión;
* personas;
* fecha;
* observaciones;
* WhatsApp o solicitud de propuesta.

No fuerces las tres modalidades dentro de una única ficha idéntica.

RESPONSIVE

Diseñá y verificá:

* 360 × 800;
* 390 × 844;
* 768 × 1024;
* 1440 × 900.

Mobile es la experiencia principal.
Desktop debe tener composición editorial propia.

Requisitos:

* áreas táctiles mínimas de 44 × 44 px;
* ningún CTA superpuesto;
* carrito recuperable;
* contenido esencial visible;
* sin scroll horizontal accidental;
* bottom sheets dentro del viewport;
* formularios compatibles con teclado mobile;
* safe areas de iPhone;
* estados de foco visibles.

MOVIMIENTO PARA IMPLEMENTACIÓN POSTERIOR

Documentá cada interacción indicando:

* trigger;
* duración o rango de scroll;
* propiedades animadas;
* easing;
* estado inicial;
* estado final;
* comportamiento mobile;
* comportamiento desktop;
* reduced motion;
* asset necesario.

Las animaciones futuras se implementarán principalmente con:

* useScroll;
* useTransform;
* useSpring;
* motion;
* AnimatePresence;
* IntersectionObserver;
* CSS sticky;
* scroll-snap;
* transform;
* opacity.

En este prototipo podés representar el movimiento con CSS y JavaScript ligero. No agregues dependencias pesadas únicamente para simularlo.

RENDIMIENTO

Prepará el diseño para:

* imágenes responsive;
* AVIF o WebP;
* posters de video;
* videos mobile y desktop independientes;
* lazy loading bajo el fold;
* pausa fuera del viewport;
* dimensiones reservadas;
* no descargar todos los videos al iniciar;
* no depender de videos para comprender el contenido;
* LCP mobile objetivo inferior a 2,5 segundos;
* CLS inferior a 0,1.

CONTENIDO

No inventes:

* productos;
* precios;
* ingredientes;
* porciones;
* disponibilidad;
* tiempos;
* métodos específicos de entrega;
* testimonios;
* direcciones;
* descuentos;
* políticas.

Usá placeholders explícitos y separá el contenido del diseño.

ENTREGA

Al finalizar:

1. Presentá la home completa mobile.
2. Presentá la home completa desktop.
3. Mostrá los dos momentos principales de movimiento.
4. Mostrá las pantallas comerciales.
5. Mostrá estados de error y vacío.
6. Incluí un inventario de componentes.
7. Incluí los tokens visuales.
8. Incluí una especificación de movimiento.
9. Incluí un inventario de assets pendientes.
10. Revisá coherencia, contraste, legibilidad y responsive.
11. Prepará el proyecto para exportación como ZIP.

No cambies la dirección “La Vitrina”.
No simplifiques el alcance a una landing.
No diseñes el administrador todavía.
No des por terminado el proyecto únicamente porque existen todas las pantallas.
Revisá que se sienta como una única experiencia de e-commerce y no como una suma de plantillas.

</pasted_text>

<!-- The user explicitly selected the following skills for this project, as attachments to their message. These are not optional context — they define how you work. Use them. -->
<attached-skill name="Classical (design system)">
[Design System] This project uses the **Classical** design system. This is a binding choice for visual style — every visual must follow it. Don't invent colors, type, spacing, or components not grounded here.

Scope: the design system is a visual style reference only. Its guide may describe example products, brands, or people that are unrelated to the user and unrelated to the subject of this conversation. Never treat anything in the design system as a fact about the user, their work, or the topic they asked about.

This project has the **Classical_classi** design system bound at `_ds/classical-e936a063-71a5-424d-8afa-cdebd59d5c1d/`. If anything under that path is missing or fails to load, the folder name may differ — `list_files` `_ds/` and use the folder whose name ends with e936a063-71a5-424d-8afa-cdebd59d5c1d instead, including in the <link>/<script> paths below.

**Loading the bundle is how you use this design system.** Every Design Component you build must load `_ds/classical-e936a063-71a5-424d-8afa-cdebd59d5c1d/_ds_bundle.js` in `<helmet>` (include it in child DCs too — de-duped by URL) and compose with its components — do not recreate those components from scratch or restyle raw HTML to look like them. At the top of the template:

```html
<helmet>
  <link rel="stylesheet" href="_ds/classical-e936a063-71a5-424d-8afa-cdebd59d5c1d/styles.css">
  <script src="_ds/classical-e936a063-71a5-424d-8afa-cdebd59d5c1d/_ds_bundle.js"></script>
</helmet>
```

Then mount any component directly in the template — no logic class needed:

```html
<x-import component-from-global-scope="Classical_classi.Button" hint-size="auto,40px">Label</x-import>
```

Props are template attributes (kebab → camelCase); template children pass through as `props.children`. The linked stylesheet(s) carry the design tokens (colors, type, spacing) — style against those via `var(--*)` and the design system's classes rather than guessing values.

**Start from a template if one matches.** Before building from scratch, check whether a template below matches the user's request. Read the template (list its folder, `read_file` the entry) and decide: if it's close to what's asked, `copy_files` the folder as your starting point; if you'd rather re-author in DC, `dc_write` a new page using the template as your structural reference. When this design system is bound, `copy_files` repoints the copied `ds-base.js` automatically — only edit its base line yourself if the copy result says so, or when copying from an unbound project (change `'../..'` to your `_ds/classical-e936a063-71a5-424d-8afa-cdebd59d5c1d` path). (Older templates have no `ds-base.js` and carry `../../…` bundle/stylesheet refs in their pages instead — repoint those by hand.)

- `Deck` (`/projects/e936a063-71a5-424d-8afa-cdebd59d5c1d/templates/deck/`) — A twenty-one-slide presentation starter: cover, contents, dividers, columns, quadrants, a data table, SVG charts and timeline, bleed imagery, a quote and a close, on the theme's tokens
- `Landing` (`/projects/e936a063-71a5-424d-8afa-cdebd59d5c1d/templates/landing/`) — A one-page product landing in the system's own voice — an invented product (Quarto & Sons: an antiquarian bookbindery), a serif hero, hairline-parted columns, a plate photograph and a sign-up close
- `Rambla — Hero (3 variantes)` (`/projects/e936a063-71a5-424d-8afa-cdebd59d5c1d/templates/rambla-hero-variantes/`) — Exploración de composición del hero desktop para la landing de café de especialidad

The full design-system source tree lives at `/projects/e936a063-71a5-424d-8afa-cdebd59d5c1d/` — use `list_files` / `read_file` from there for anything not under `_ds/` (layout varies by brand; don't assume folder names). Its guide is reproduced below so you don't need to fetch it:

<design-system-guide>
# Classical design system

Classical is an editorial, book-like system on a soft near-white ground: Cormorant Garamond headings over Lora body, justified columns, hairline rules, and color applied as stroke rather than fill. Surfaces stay quiet — cards are bordered, buttons are outlined — and photographs sit matted on the page like tipped-in plates.

## How to use this

- Link the one stylesheet from every page — `&lt;link rel="stylesheet" href="styles.css"&gt;` (adjust the relative path) — and take every color, font, spacing, radius and shadow from its variables (`var(--color-*)`, `var(--font-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--shadow-*)`). Never hard-code a hex, a font name or a px value the tokens already carry.
- Build with the classes below rather than inventing parallel ones; the component pages are plain HTML, so view source and copy the markup.
- `templates/` holds starting points a consuming project can copy whole.
- The whole system was derived from `theme.json`. To change the look, edit the tokens at the top of `styles.css` — every page, the thumbnail and this guide read from them — and keep `theme.json` and the written guidance in step so they don't drift from what the CSS actually does.

## Direction

Editorial, justified body copy in columns. Tight leading; headlines flush-left over justified text blocks. Use hairline dividers (`var(--color-divider)`) between major sections. Apply color as borders, rules and underlines — not as filled blocks. Buttons are outlined (1px accent border on transparent), not solid-filled. Wrap hero and inline images in the `.plate` class — a warm archival grade inside a thin surface-colored mat, like a tipped-in book plate. In decks, section dividers sit on a deep warm near-black (a shade below `--color-neutral-900`) as a colophon page — paper type with a gold ghost numeral; gold stays stroke and small marks on content slides.

## Color

A light ground (`--color-bg` #f3f2f2) with `--color-text` #201f1d and a single accent #b68235 (this is a mono scheme: no second accent was chosen — the `--color-accent-2-*` variables carry a machine-derived stand-in kept only so both sets resolve; treat them as one role). Each role carries a 100–900 tonal ramp (`--color-neutral-100` … `--color-accent-2-900`) generated in OKLCH on a shared perceptual lightness scale, so the same step of any ramp has the same visual weight. Use the light steps (100–300) for tinted fills, hovers and subtle borders, 500 as the role's base, and the dark steps (700–900) for text on tinted fills and for pressed states; prefer ramp steps over ad-hoc `color-mix()`. For elevation use `--shadow-sm/md/lg` (already tuned to the ground) rather than ad-hoc box-shadows.

## Type

Cormorant Garamond for headings over Lora for body text, loaded as `--font-heading` / `--font-body`. Bold is avoided: interface headings cap at semibold (the `--font-heading-weight` token), and the bigger the text the lighter it sets — display sizes take the normal cut (the deck shows this). Numbers set tabular wherever they stand as figures or columns — kickers, contents numbers, tables, charts, the display numerals (`"tnum"`; both faces keep their own figure style and gain equal widths) — while running prose keeps its text figures (Lora's tabular feature also widens its word-spaces and punctuation, which would loosen the prose). Density 1.15× and radius 4px are already baked into the `--space-*` / `--radius-*` scales — use the variables, not raw numbers.

## Icons

Use Lucide icons (https://lucide.dev) throughout.

## Interaction states

Interactive states are themed, never browser defaults: give every interactive element a `:hover` tint and a pressed state from the accent ramp (one step past the base — `--color-accent-600` on a light ground, `--color-accent-400` on a dark one, or a `color-mix()` tint for outlined/ghost variants), and style keyboard focus with `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }` — never leave the default blue focus ring.

## Components

| Class | What it is | Shown in |
| --- | --- | --- |
| `.btn` with `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-icon`, `.btn-block` | Actions — the primary is an accent outline, never a fill | components/buttons.html |
| `.tag` with `.tag-accent`, `.tag-accent-2`, `.tag-neutral`, `.tag-outline` | Small labels tinted from the ramps (mono palette: accent-2 reads the same as accent) | components/buttons.html |
| `.field` + `label`, `.input`, `.radio` + `.dot`, `.seg` + `.seg-opt` | Form fields and choices on native elements — no script | components/forms.html |
| `.card` with `.card-kicker`, `.card-title`, `.card-body`, `.card-meta`; `.elev-sm/md/lg` | Bordered, unfilled content surfaces; elevation utilities | components/cards.html |
| `.nav` + `.nav-brand` | The header bar | components/navigation.html |
| `.table` | Data tables with themed header and row rules | components/table.html |
| `.dialog-backdrop` + `.dialog` (+ `.dialog-title/-body/-actions`) | A modal at the top elevation | components/dialog.html |
| `.hr` | A hairline horizontal rule | foundations/layout.html |
| `.plate` | The image wrapper — every content photograph goes through it | foundations/image.html |

States are built in: hovers and pressed states come from the accent ramp, keyboard focus is the 2px accent `:focus-visible` ring, `::selection` is an accent tint, and disabled controls drop to 45% opacity. Don't restyle them per page. The accent-to-ground pair is tuned to at least 3:1 — enough for icons, large text and interface chrome, not for body copy — so for paragraph-size text in the accent use a deep ramp step (`--color-accent-700` on this ground) rather than the accent itself.

## Do

- Justify body copy at a comfortable measure and let the hairlines carry the structure.
- Draw with borders, rules and underlines; keep large fills off the page.
- Give text room — the spacing scale is airy (density 1.15×) by design.
- Mat photographs with the `.plate` wrapper so they read as plates, not banners.

## Don't

- Do not fill cards or buttons with solid accent color.
- Do not use heavy drop shadows — elevation here is a whisper.
- Do not tighten the leading or crowd the margins.
- Do not swap in a sans-serif for emphasis; weight and italics do that job.

## Files

- `styles.css` — the only stylesheet: the token sheet (`:root` variables, ramps, base type) plus the component layer. Link it from every page.
- `readme.md` — this guide.
- `theme.json` — the parameters these files were derived from (a machine-readable record of the theme).
- `thumbnail.html` — the project cover (brand mark + swatches).
- `foundations/type.html` — the type scale and the heading/body pairing at real sizes.
- `foundations/color.html` — color roles and the 100-900 tonal ramps, with usage notes.
- `foundations/layout.html` — the spacing scale, the grid and how edges are drawn.
- `foundations/icons.html` — the icon set at interface sizes, inline and in buttons.
- `foundations/image.html` — how photographs and figures are treated.
- `components/buttons.html` — buttons, icon buttons and tags in every variant and state.
- `components/forms.html` — text fields, radios and the segmented control on native elements.
- `components/cards.html` — content cards and the elevation steps.
- `components/navigation.html` — the header bar pattern.
- `components/table.html` — a data table with the themed header and row rules.
- `components/dialog.html` — a modal over its backdrop at the top elevation.
- `theme.html` — the theme's parameters rendered as a reference sheet.
- `templates/landing/` — a starter page consuming the system the intended way (`index.html`, its `ds-base.js` loader, and the vendored `image-slot.js` its photograph mounts).
- `assets/photo.jpg` — the reference photograph the imagery page treats.

</design-system-guide>
</attached-skill>

## Assistant

_[tool: snip]_

_[tool: update_todos]_

Ahora construyo la home completa de La Vitrina.

_[tool: dc_write]_

_[tool: dc_write]_

_[tool: dc_write]_

## Assistant

_[tool: update_todos]_

_[tool: dc_write]_

_[tool: dc_write]_

_[tool: update_todos]_

_[tool: present_fs_item_for_download]_

_[tool: ready_for_verification]_

Entrega lista para revisión, sobre La Vitrina sin cambiar la dirección:

- **Home.dc.html** (abierta): las 11 secciones en una narrativa continua, responsive real 360–1440, con los dos picos implementados por scroll (Vitrina Viva: el arco escala y pierde el borde hasta cubrir el viewport; Detalle Final: ventana que se expande con frases de proceso), categorías con hover/carrusel snap, selección con protagonista sticky y estados de agregado, stepper "Armá tu ocasión", campañas con 3 estados, rieles de galería, FAQ con acordeones nativos y carrito recuperable en mobile. Reduced motion respetado.
- **Pantallas 1–3**: las 21 vistas comerciales (catálogo, fichas y sus 4 estados, vista rápida m+d, carritos, checkout completo, pago pendiente/confirmado/error, evento y estado de pedido).
- **Especificacion.dc.html**: tokens, inventario de componentes, spec de movimiento (trigger/rango/props/easing/reduced motion/asset por interacción) y assets pendientes para Next.js + Tailwind + Framer Motion.
- ZIP del proyecto en la tarjeta de descarga de arriba.

Pendiente de tu lado: videos y posters reales (los contratos de asset están en la especificación) y el contenido a validar (precios, anticipación, seña, zonas). Las zonas de imagen siguen aceptando fotos arrastradas.

