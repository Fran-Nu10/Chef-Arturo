# Catálogo real de Chef Arturo · V1

**Fecha de carga:** 2026-08-21
**Migración:** `supabase/migrations/20260821090000_catalogo_real_chef_arturo_v1.sql`
**Importador de imágenes:** `scripts/importar-medios-catalogo.mjs`
**Rama:** `feat/catalogo-real-chef-arturo-v1`

Este documento es la trazabilidad completa de la primera carga real del
catálogo: de dónde sale cada dato, qué se cargó tal cual, qué se decidió por
modelado (y por qué), y qué queda pendiente de confirmar con la casa.

## Fuente

Material oficial de difusión de Chef Arturo (Julia), transmitido como texto en
la instrucción de carga: descripciones de producto, precios en pesos
uruguayos, contenidos de boxes y packs de lunch, y datos generales del negocio
(WhatsApp, horario, ubicación). No hubo acceso directo a las imágenes o
capturas originales del material — sólo a su transcripción textual, que es la
que se reproduce en las tablas de este documento.

## Categorías creadas

| Slug | Nombre | Descripción | Posición |
| --- | --- | --- | --- |
| `pasteleria` | Pastelería | *(sin descripción confirmada por la fuente)* | 10 |
| `merienda` | Merienda | Cookies, brownies y boxes dulces. | 20 |
| `salados` | Salados | Empanadas, tartas y preparaciones de hojaldre. | 30 |
| `lunch-para-eventos` | Lunch para eventos | Propuestas para reuniones, celebraciones y eventos. | 40 |

Cargadas por `upsert` sobre `slug`: si ya existían, esta migración actualiza
nombre, descripción, posición y las reactiva (`is_active = true`) sin crear un
duplicado ni cambiar su `id`.

## Los 37 productos

Cada precio se transcribió tal cual lo dio la fuente y se convirtió a
centésimos multiplicando por 100 — nunca al revés, para no arrastrar un error
de redondeo. La tabla de conversión completa, verificada una por una:

| Original | Centésimos |
| --- | --- |
| $120 | 12000 |
| $240 | 24000 |
| $590 | 59000 |
| $650 | 65000 |
| $990 | 99000 |
| $1.190 | 119000 |
| $1.950 | 195000 |
| $4.900 | 490000 |
| $6.900 | 690000 |

### Pastelería (17 productos)

| Producto | Slug | Precio | Centésimos | Modalidad |
| --- | --- | --- | --- | --- |
| Cheesecake clásica — individual | `cheesecake-clasica-individual` | $240 | 24000 | Compra directa |
| Cheesecake clásica — entero por kg | `cheesecake-clasica-entero-kg` | $990 | 99000 | Por encargo |
| Mousse de dulce de leche y frutos rojos — individual | `mousse-dulce-de-leche-frutos-rojos-individual` | $240 | 24000 | Compra directa |
| Mousse de dulce de leche y frutos rojos — entero por kg | `mousse-dulce-de-leche-frutos-rojos-entero-kg` | $990 | 99000 | Por encargo |
| Cheesecake de maracuyá — individual | `cheesecake-maracuya-individual` | $240 | 24000 | Compra directa |
| Cheesecake de maracuyá — entero por kg | `cheesecake-maracuya-entero-kg` | $990 | 99000 | Por encargo |
| Lemon pie — individual | `lemon-pie-individual` | $240 | 24000 | Compra directa |
| Lemon pie — entero por kg | `lemon-pie-entero-kg` | $990 | 99000 | Por encargo |
| Mousse de pistacho y chocolate blanco — individual | `mousse-pistacho-chocolate-blanco-individual` | $240 | 24000 | Compra directa |
| Mousse de pistacho y chocolate blanco — entero por kg | `mousse-pistacho-chocolate-blanco-entero-kg` | $990 | 99000 | Por encargo |
| Mango y maracuyá — individual | `mango-maracuya-individual` | $240 | 24000 | Compra directa |
| Mango y maracuyá — entero por kg | `mango-maracuya-entero-kg` | $990 | 99000 | Por encargo |
| Cheesecake de naranja — individual | `cheesecake-naranja-individual` | $240 | 24000 | Compra directa |
| Cheesecake de naranja — entero por kg | `cheesecake-naranja-entero-kg` | $990 | 99000 | Por encargo |
| Crumble de manzana — individual | `crumble-manzana-individual` | $240 | 24000 | Compra directa |
| Crumble de manzana — entero por kg | `crumble-manzana-entero-kg` | $990 | 99000 | Por encargo |
| Box Colección Dulce — 9 postres variados | `box-coleccion-dulce-9-postres` | $1.190 | 119000 | Por encargo |

No se creó un producto individual por cada uno de los cuatro sabores del Box
Colección Dulce (lemon pie, mousse de Oreo, cheesecake de frutos rojos,
clásica de chocolate): la fuente no da un precio individual para ellos fuera
del box, y no se inventó uno.

### Merienda (7 productos)

| Producto | Slug | Precio | Centésimos | Modalidad |
| --- | --- | --- | --- | --- |
| Cookie Levain clásica con chips | `cookie-levain-clasica-chips` | $120 | 12000 | Compra directa |
| Cookie Levain de pistacho y chocolate blanco | `cookie-levain-pistacho-chocolate-blanco` | $120 | 12000 | Compra directa |
| Cookie Levain red velvet con chocolate blanco | `cookie-levain-red-velvet-chocolate-blanco` | $120 | 12000 | Compra directa |
| Cookie Levain cacao al 100% | `cookie-levain-cacao-100` | $120 | 12000 | Compra directa |
| Cookie Levain especiada | `cookie-levain-especiada` | $120 | 12000 | Compra directa |
| Box Cookies Levain — 6 unidades | `box-cookies-levain-6-unidades` | $590 | 59000 | Compra directa |
| Box Brownies Arturo Selection — 6 unidades | `box-brownies-arturo-selection-6-unidades` | $650 | 65000 | Compra directa |

No se crearon brownies individuales: no hay precio unitario confirmado, sólo
el del box de 6.

### Salados (10 productos)

| Producto | Slug | Precio | Centésimos | Modalidad |
| --- | --- | --- | --- | --- |
| Empanada de carne premium | `empanada-carne-premium` | — | `null` | A consultar |
| Empanada de cerdo braseado | `empanada-cerdo-braseado` | — | `null` | A consultar |
| Empanada de pollo a la crema | `empanada-pollo-crema` | — | `null` | A consultar |
| Empanada de espinaca y quesos | `empanada-espinaca-quesos` | — | `null` | A consultar |
| Tarta de calabaza especiada | `tarta-calabaza-especiada` | — | `null` | A consultar |
| Tarta de pollo y verduras | `tarta-pollo-verduras` | — | `null` | A consultar |
| Tarta de jamón y quesos | `tarta-jamon-quesos` | — | `null` | A consultar |
| Pizza rellena | `pizza-rellena` | — | `null` | A consultar |
| Pascualina | `pascualina` | — | `null` | A consultar |
| Pack Matero — 6 empanadas variadas | `pack-matero-6-empanadas` | $590 | 59000 | Compra directa |

### Lunch para eventos (3 productos)

| Producto | Slug | Precio | Centésimos | Modalidad |
| --- | --- | --- | --- | --- |
| Lunch Petit Especial — 4 personas | `lunch-petit-especial-4-personas` | $1.950 | 195000 | Por encargo |
| Lunch Celebración — 10 personas | `lunch-celebracion-10-personas` | $6.900 | 690000 | Por encargo |
| Lunch de Amigos — 10 personas | `lunch-de-amigos-10-personas` | $4.900 | 490000 | Por encargo |

**Total: 17 + 7 + 10 + 3 = 37 productos.** Coincide con lo esperado y con el
conteo real verificado en la base (ver «Verificación» más abajo).

## Reglas de modelado que no vienen literalmente de la fuente

Documentadas explícitamente, como pide el enunciado:

- **`track_stock = false` en los 37 productos.** No hay cantidades reales que
  controlar; usar `true` con cualquier número habría sido inventar stock.
- **`min_quantity` y `low_stock_threshold` en su valor por defecto** (1 y 0):
  la fuente no informa mínimos de compra ni umbrales de stock bajo.
- **`fulfillment = 'both'` en todos:** la fuente confirma retiro y entrega a
  domicilio como forma general del negocio, y ningún producto dice lo
  contrario.
- **`is_featured = false` en todos:** ningún producto está marcado como
  destacado por la fuente; no se inventó una selección.
- **Torta entera "por kg", no "de un kilo":** la descripción de cada sabor
  entero aclara explícitamente que el precio de $990 corresponde a un
  kilogramo y que el peso final puede variar — nunca se afirma que la torta
  pesa exactamente 1 kg.
- **Crumble de manzana:** la frase "ideal para acompañar con helado" se
  transcribió tal cual porque es una sugerencia de maridaje, no una promesa de
  que el helado viene incluido — no se agregó ni se sacó nada de esa idea.
- **Cookies Levain:** los cinco sabores individuales llevan exactamente los
  ingredientes que dio la fuente. No se agregó ninguna especia ni ingrediente
  a la "especiada" más allá de la palabra misma.
- **Box Cookies Levain:** la recomendación de calentar 30 segundos se agregó
  como sugerencia opcional ("según preferencia"), no como instrucción
  obligatoria.
- **Pack Matero:** la descripción dice explícitamente que la selección de
  sabores se coordina según disponibilidad — no se prometió una combinación
  fija de empanadas.
- **Lunch de Amigos (vino tinto):** se menciona que el vino se coordina
  previamente; no se afirma marca, variedad, volumen ni graduación
  alcohólica, porque la fuente no la da.

## Datos confirmados

- WhatsApp principal: `099 786 781` → `+598 99 786 781` → usado como
  `NEGOCIO.whatsapp` (`https://wa.me/59899786781`) en `src/content/datos.ts`,
  reemplazando el placeholder `#whatsapp-pendiente` que tenía antes. Es el
  único CTA de WhatsApp que existe en la interfaz hoy.
- Teléfono secundario: `099 079 177` → `+598 99 079 177`. **No tiene CTA en la
  interfaz**: el diseño aprobado sólo contempla un botón de WhatsApp, y no se
  agregó un segundo botón que el diseño no tiene.
- Ubicación: Florida, Uruguay.
- Atención: lunes a sábado.
- Horario de salados: 9:00 a 19:00.
- Retiro y entrega a domicilio.
- Postres enteros: encargo con 24 horas de anticipación (`lead_time_days = 1`
  en las 8 presentaciones "entero por kg" y en el Box Colección Dulce).
- Existen opciones sin azúcar, sin especificar cuáles.

## Inferencias realizadas

- Los slugs de producto y de categoría se derivaron del nombre siguiendo el
  formato que ya exige la base (`^[a-z0-9]+(-[a-z0-9]+)*$`): minúsculas, sin
  tildes, separadas por guiones.
- `position` dentro de cada categoría sigue el orden en que la fuente
  presenta los productos, en incrementos de 10 — mismo estilo que usan las
  categorías.
- Las descripciones completas (`full_description`) amplían la descripción
  corta con el detalle operativo (contenido del box, nota del kilogramo,
  coordinación previa) que la fuente da en prosa continua, sin agregar nada
  que no esté ahí.

## Datos pendientes de confirmar

Ninguno de estos puntos se resolvió por intuición. Quedan tal cual la fuente
los presenta, con la contradicción o la duda documentada:

1. **"Salado todos los días" contra "lunes a sábado".** El aviso original dice
   las dos cosas, que se contradicen entre sí. Se publicó **lunes a sábado**
   por ser el dato más específico y consistente con "Atención informada:
   lunes a sábado" del resto del negocio. La otra frase queda documentada acá
   como pendiente de validar con la casa, no se descartó en silencio.
2. **"Chanchada".** Es uno de los sabores de postre petit del Lunch
   Celebración. Se conservó exactamente como aparece en la fuente — no se
   "corrigió" a ningún otro nombre por intuición, aunque no es un nombre de
   postre reconocible fuera del contexto de esa fuente.
3. **Lunch Petit Especial, "4 personas".** El material fuente estaba
   parcialmente recortado en ese dato. Se publicó igual porque es la única
   cifra disponible, pero queda marcada acá con **confianza media**: conviene
   que la casa lo confirme antes de tomarlo como definitivo en un material de
   venta.
4. **Opciones sin azúcar.** La fuente confirma que existen, sin decir en qué
   productos. No se marcó ningún producto puntual como "sin azúcar" — hacerlo
   habría sido inventar un dato que la fuente no da. Queda como nota general
   pendiente de aplicar producto por producto cuando la casa lo confirme.

## Mapeo de imágenes

El detalle completo, imagen por imagen, está en
[`docs/MEDIA_MAPPING_CATALOGO_V1.md`](./MEDIA_MAPPING_CATALOGO_V1.md).
Resumen: de 20 fotografías existentes, 6 se usaron (sin marca de terceros, sin
contradecir el catálogo), 4 se descartaron por llevar la marca de otro
negocio, 2 son fotografías reales de otro comercio, 1 muestra precios en
dólares que contradicen el catálogo, y las 8 `LamesadeChefArturo*` quedan
reservadas para la sección editorial (una de ellas, además, inutilizable ahí
por marca de agua). 33 de los 37 productos quedan sin imagen.

## Verificación

```
✓ npm run lint
✓ npm run typecheck
✓ npm run test        115 pruebas de dominio
✓ npm run build
✓ npm run db:test      migraciones + RLS + reglas de negocio, sin regresión
```

Contra una base local recreada desde cero con las 9 migraciones:

- 4 categorías, 37 productos — conteo exacto.
- 17 / 7 / 10 / 3 productos por categoría — exacto.
- 0 slugs duplicados.
- Todo producto `direct` tiene `price_cents`.
- Todo producto sin precio es `quote` (9, exactamente los de "a consultar").
- Los 9 precios distintos, convertidos a centésimos, coinciden uno a uno con
  la tabla de conversión de arriba.
- `track_stock = false` en los 37.
- Migración corrida dos veces seguidas: mismo conteo, mismos `id` (verificado
  con un hash de los UUID antes y después) — no duplica nada.

Contra el proyecto Supabase real (`lvthdjqciuipfmogniwr`), vía consulta SQL
directa después de aplicar la migración: mismos conteos, sin residuo de
pruebas.

## Qué no se pudo verificar desde este entorno

La subida de imágenes a Storage **no se ejecutó contra el proyecto real**:
este entorno no tiene salida de red hacia `*.supabase.co` (política de egreso
de la organización, confirmada explícitamente por el proxy — no es un error
transitorio ni algo para reintentar). El importador está escrito, probado en
`--dry-run` (que no necesita red) y listo para correr donde sí haya acceso.

No se insertó ningún `media_asset` ni `product_images` en el proyecto real por
este motivo: hacerlo sin subir el archivo real habría dejado una referencia
rota — exactamente lo que el enunciado prohíbe. La migración de categorías y
productos sí se aplicó al proyecto real (no depende de Storage), así que
`categories.image_id` queda en `null` y no hay filas en `product_images`
hasta que se corra el importador con acceso de red real.

## Rollback

No destructivo. Nunca borra un producto que ya esté en un pedido.

```sql
-- 1. Archivar (no borrar) los 37 productos de esta carga, por slug.
update public.products
set status = 'archived', archived_at = now()
where slug in (
  'cheesecake-clasica-individual', 'cheesecake-clasica-entero-kg',
  'mousse-dulce-de-leche-frutos-rojos-individual', 'mousse-dulce-de-leche-frutos-rojos-entero-kg',
  'cheesecake-maracuya-individual', 'cheesecake-maracuya-entero-kg',
  'lemon-pie-individual', 'lemon-pie-entero-kg',
  'mousse-pistacho-chocolate-blanco-individual', 'mousse-pistacho-chocolate-blanco-entero-kg',
  'mango-maracuya-individual', 'mango-maracuya-entero-kg',
  'cheesecake-naranja-individual', 'cheesecake-naranja-entero-kg',
  'crumble-manzana-individual', 'crumble-manzana-entero-kg',
  'box-coleccion-dulce-9-postres',
  'cookie-levain-clasica-chips', 'cookie-levain-pistacho-chocolate-blanco',
  'cookie-levain-red-velvet-chocolate-blanco', 'cookie-levain-cacao-100',
  'cookie-levain-especiada', 'box-cookies-levain-6-unidades',
  'box-brownies-arturo-selection-6-unidades',
  'empanada-carne-premium', 'empanada-cerdo-braseado', 'empanada-pollo-crema',
  'empanada-espinaca-quesos', 'tarta-calabaza-especiada', 'tarta-pollo-verduras',
  'tarta-jamon-quesos', 'pizza-rellena', 'pascualina', 'pack-matero-6-empanadas',
  'lunch-petit-especial-4-personas', 'lunch-celebracion-10-personas',
  'lunch-de-amigos-10-personas'
);

-- 2. Desactivar sólo las categorías de esta carga, y sólo si quedaron sin
--    ningún producto activo (por si alguien agregó productos propios a una
--    de estas categorías después: en ese caso no se toca).
update public.categories
set is_active = false
where slug in ('pasteleria', 'merienda', 'salados', 'lunch-para-eventos')
  and not exists (
    select 1 from public.products p
    where p.category_id = categories.id and p.status = 'active'
  );

-- 3. Los pedidos, order_items, clientes y pagos NO se tocan: el trigger de
--    la base ya impide borrar un producto que figure en un pedido, y este
--    rollback ni siquiera lo intenta — archiva, no borra.

-- 4. Los `media_assets` de esta carga (bucket = 'media', path que empieza
--    con 'catalogo/chef-arturo-v1/') se conservan mientras sigan
--    referenciados desde `product_images` o `categories.image_id`. Antes de
--    borrar uno a mano, consultar `media_asset_usage(id)` — es exactamente
--    la función que ya usa el panel antes de ofrecer el borrado.
```

## Volver a ejecutar la carga

Idempotente los dos pasos, se puede correr cuantas veces haga falta:

```bash
# 1. Categorías y productos (SQL, no necesita las imágenes)
#    — vía Supabase CLI:
supabase db push
#    — o aplicando el archivo directamente:
psql "$DATABASE_URL" -f supabase/migrations/20260821090000_catalogo_real_chef_arturo_v1.sql

# 2. Imágenes (necesita red hacia el proyecto Supabase real)
export NEXT_PUBLIC_SUPABASE_URL=https://lvthdjqciuipfmogniwr.supabase.co
export SUPABASE_SECRET_KEY=...   # Project Settings → API Keys → service_role
node scripts/importar-medios-catalogo.mjs --dry-run   # para revisar el plan
node scripts/importar-medios-catalogo.mjs              # para aplicarlo
```
