# Mapeo de imágenes · Catálogo completo V1

Fuente de verdad del mapeo archivo → producto para
`scripts/importar-imagenes-catalogo-v1.mjs`. **Los 37 productos del catálogo
tienen fotografía asignada.**

Sustituye a `MEDIA_MAPPING_PASTELERIA_V1.md`, que cubría sólo los 16 productos
de pastelería. Aquella importación nunca llegó a ejecutarse contra el proyecto
real (sin salida de red hacia Supabase desde el entorno de trabajo), y este
manifiesto la incluye entera con los mismos destinos de Storage.

**Origen de las fotografías:** el dueño del negocio subió las fotos al
repositorio y confirmó que están autorizadas para el catálogo. Se registran con
`source='own'` y `credit='Chef Arturo'`, según se pidió explícitamente.

## Resumen

| | |
| --- | --- |
| Productos en el catálogo | 37 |
| Productos con fotografía | **37 (100%)** |
| Archivos en Storage | 34 |
| Imágenes compartidas entre dos productos | 3 |
| Fotos subidas y rechazadas en la revisión | 3 |

Cada archivo se inspeccionó visualmente antes de asignarlo. El criterio de
rechazo es el mismo de siempre: marca de agua o logo de un negocio ajeno,
personas identificables, o contenido que no corresponde al producto.

### Pastelería — 17 productos

| Producto | Slug | Archivo en el repo | Path en Storage | Resolución | Compartida |
| --- | --- | --- | --- | --- | --- |
| Crumble de manzana — individual | `crumble-manzana-individual` | `assets/productos/pasteleria/crumble-manzana-individual.jpg` | `productos/pasteleria/crumble-manzana-individual.jpg` | 1200×1451 | No |
| Crumble de manzana — entero por kg | `crumble-manzana-entero-kg` | `assets/productos/pasteleria/crumble-manzana-entero-kg.jpg` | `productos/pasteleria/crumble-manzana-entero-kg.jpg` | 600×900 | No |
| Cheesecake de naranja — individual | `cheesecake-naranja-individual` | `assets/productos/pasteleria/cheesecake-naranja-individual.jpg` | `productos/pasteleria/cheesecake-naranja-individual.jpg` | 736×1104 | No |
| Cheesecake de naranja — entero por kg | `cheesecake-naranja-entero-kg` | `assets/productos/pasteleria/cheesecake-naranja-entero-kg.jpg` | `productos/pasteleria/cheesecake-naranja-entero-kg.jpg` | 736×1051 | No |
| Lemon pie — individual | `lemon-pie-individual` | `assets/productos/pasteleria/lemon-pie-individual.jpg` | `productos/pasteleria/lemon-pie-individual.jpg` | 736×920 | No |
| Lemon pie — entero por kg | `lemon-pie-entero-kg` | `assets/productos/pasteleria/lemon-pie-entero-kg.jpg` | `productos/pasteleria/lemon-pie-entero-kg.jpg` | 688×688 | No |
| Mango y maracuyá — individual | `mango-maracuya-individual` | `assets/productos/pasteleria/mango-maracuya-individual.jpg` | `productos/pasteleria/mango-maracuya-individual.jpg` | 600×750 | No |
| Mango y maracuyá — entero por kg | `mango-maracuya-entero-kg` | `assets/productos/pasteleria/mango-maracuya-entero-kg.jpg` | `productos/pasteleria/mango-maracuya-entero-kg.jpg` | 1080×1620 | No |
| Mousse de pistacho y chocolate blanco — individual | `mousse-pistacho-chocolate-blanco-individual` | `assets/productos/pasteleria/mousse-pistacho-chocolate-blanco-individual.jpg` | `productos/pasteleria/mousse-pistacho-chocolate-blanco-individual.jpg` | 600×600 | No |
| Mousse de pistacho y chocolate blanco — entero por kg | `mousse-pistacho-chocolate-blanco-entero-kg` | `assets/productos/pasteleria/mousse-pistacho-chocolate-blanco-entero-kg.jpg` | `productos/pasteleria/mousse-pistacho-chocolate-blanco-entero-kg.jpg` | 600×600 | No |
| Mousse de dulce de leche y frutos rojos — individual | `mousse-dulce-de-leche-frutos-rojos-individual` | `assets/productos/pasteleria/mousse-dulce-de-leche-frutos-rojos-individual.jpg` | `productos/pasteleria/mousse-dulce-de-leche-frutos-rojos-individual.jpg` | 832×1248 | No |
| Mousse de dulce de leche y frutos rojos — entero por kg | `mousse-dulce-de-leche-frutos-rojos-entero-kg` | `assets/productos/pasteleria/mousse-dulce-de-leche-frutos-rojos-entero-kg.jpg` | `productos/pasteleria/mousse-dulce-de-leche-frutos-rojos-entero-kg.jpg` | 600×900 | No |
| Cheesecake clásica — individual | `cheesecake-clasica-individual` | `assets/productos/pasteleria/cheesecake-clasica.jpg` | `productos/pasteleria/cheesecake-clasica.jpg` | 735×1106 | **Sí** |
| Cheesecake clásica — entero por kg | `cheesecake-clasica-entero-kg` | `assets/productos/pasteleria/cheesecake-clasica.jpg` | `productos/pasteleria/cheesecake-clasica.jpg` | 735×1106 | **Sí** |
| Cheesecake de maracuyá — individual | `cheesecake-maracuya-individual` | `assets/productos/pasteleria/cheesecake-maracuya.jpg` | `productos/pasteleria/cheesecake-maracuya.jpg` | 1199×1083 | **Sí** |
| Cheesecake de maracuyá — entero por kg | `cheesecake-maracuya-entero-kg` | `assets/productos/pasteleria/cheesecake-maracuya.jpg` | `productos/pasteleria/cheesecake-maracuya.jpg` | 1199×1083 | **Sí** |
| Box Colección Dulce — 9 postres variados | `box-coleccion-dulce-9-postres` | `assets/productos/pasteleria/box-coleccion-dulce-9-postres.jpg` | `productos/pasteleria/box-coleccion-dulce-9-postres.jpg` | 736×981 | No |

### Merienda — 7 productos

| Producto | Slug | Archivo en el repo | Path en Storage | Resolución | Compartida |
| --- | --- | --- | --- | --- | --- |
| Cookie Levain clásica con chips | `cookie-levain-clasica-chips` | `assets/productos/merienda/cookie-levain-clasica-chips.jpg` | `productos/merienda/cookie-levain-clasica-chips.jpg` | 236×285 ⚠️ | **Sí** |
| Box Cookies Levain — 6 unidades | `box-cookies-levain-6-unidades` | `assets/productos/merienda/cookie-levain-clasica-chips.jpg` | `productos/merienda/cookie-levain-clasica-chips.jpg` | 236×285 ⚠️ | **Sí** |
| Cookie Levain de pistacho y chocolate blanco | `cookie-levain-pistacho-chocolate-blanco` | `assets/productos/merienda/cookie-levain-pistacho-chocolate-blanco.jpg` | `productos/merienda/cookie-levain-pistacho-chocolate-blanco.jpg` | 736×1104 | No |
| Cookie Levain red velvet con chocolate blanco | `cookie-levain-red-velvet-chocolate-blanco` | `assets/productos/merienda/cookie-levain-red-velvet-chocolate-blanco.jpg` | `productos/merienda/cookie-levain-red-velvet-chocolate-blanco.jpg` | 1200×1600 | No |
| Cookie Levain cacao al 100% | `cookie-levain-cacao-100` | `assets/productos/merienda/cookie-levain-cacao-100.jpg` | `productos/merienda/cookie-levain-cacao-100.jpg` | 1200×1800 | No |
| Cookie Levain especiada | `cookie-levain-especiada` | `assets/productos/merienda/cookie-levain-especiada.jpg` | `productos/merienda/cookie-levain-especiada.jpg` | 236×354 ⚠️ | No |
| Box Brownies Arturo Selection — 6 unidades | `box-brownies-arturo-selection-6-unidades` | `assets/productos/merienda/box-brownies-arturo-selection-6-unidades.jpg` | `productos/merienda/box-brownies-arturo-selection-6-unidades.jpg` | 750×919 | No |

### Salados — 10 productos

| Producto | Slug | Archivo en el repo | Path en Storage | Resolución | Compartida |
| --- | --- | --- | --- | --- | --- |
| Empanada de carne premium | `empanada-carne-premium` | `assets/productos/salados/empanada-carne-premium.jpg` | `productos/salados/empanada-carne-premium.jpg` | 236×354 ⚠️ | No |
| Empanada de cerdo braseado | `empanada-cerdo-braseado` | `assets/productos/salados/empanada-cerdo-braseado.jpg` | `productos/salados/empanada-cerdo-braseado.jpg` | 1024×1024 | No |
| Empanada de pollo a la crema | `empanada-pollo-crema` | `assets/productos/salados/empanada-pollo-crema.jpg` | `productos/salados/empanada-pollo-crema.jpg` | 736×736 | No |
| Empanada de espinaca y quesos | `empanada-espinaca-quesos` | `assets/productos/salados/empanada-espinaca-quesos.jpg` | `productos/salados/empanada-espinaca-quesos.jpg` | 638×600 | No |
| Tarta de calabaza especiada | `tarta-calabaza-especiada` | `assets/productos/salados/tarta-calabaza-especiada.jpg` | `productos/salados/tarta-calabaza-especiada.jpg` | 236×236 ⚠️ | No |
| Tarta de pollo y verduras | `tarta-pollo-verduras` | `assets/productos/salados/tarta-pollo-verduras.jpg` | `productos/salados/tarta-pollo-verduras.jpg` | 1199×1401 | No |
| Tarta de jamón y quesos | `tarta-jamon-quesos` | `assets/productos/salados/tarta-jamon-quesos.jpg` | `productos/salados/tarta-jamon-quesos.jpg` | 600×750 | No |
| Pizza rellena | `pizza-rellena` | `assets/productos/salados/pizza-rellena.jpg` | `productos/salados/pizza-rellena.jpg` | 620×700 | No |
| Pascualina | `pascualina` | `assets/productos/salados/pascualina.jpg` | `productos/salados/pascualina.jpg` | 1150×1722 | No |
| Pack Matero — 6 empanadas variadas | `pack-matero-6-empanadas` | `assets/productos/salados/pack-matero-6-empanadas.jpg` | `productos/salados/pack-matero-6-empanadas.jpg` | 1200×1200 | No |

### Lunch para eventos — 3 productos

| Producto | Slug | Archivo en el repo | Path en Storage | Resolución | Compartida |
| --- | --- | --- | --- | --- | --- |
| Lunch Petit Especial — 4 personas | `lunch-petit-especial-4-personas` | `fotos/luncheventos1.jpg` | `productos/lunch-para-eventos/lunch-petit-especial-4-personas.jpg` | 736×1104 | No |
| Lunch Celebración — 10 personas | `lunch-celebracion-10-personas` | `fotos/luncheventos2.jpg` | `productos/lunch-para-eventos/lunch-celebracion-10-personas.jpg` | 676×1200 | No |
| Lunch de Amigos — 10 personas | `lunch-de-amigos-10-personas` | `assets/productos/lunch-para-eventos/lunch-de-amigos-10-personas.jpg` | `productos/lunch-para-eventos/lunch-de-amigos-10-personas.jpg` | 736×1265 | No |

⚠️ = resolución por debajo de 500px de ancho. Se ven bien en las tarjetas del
catálogo (~330px), pero quedan blandas en la ficha del producto, que las
muestra a ~600px. Conviene reemplazarlas cuando haya una toma mejor; no
bloquean nada.

## Fotos subidas que no se usaron

Estas tres llegaron con el nombre correcto pero no pasaron la revisión visual.
Se quitaron del repositorio (siguen en el historial, commit `e427357`) y su
producto recibió otra foto:

| Archivo | Motivo del rechazo | Qué se usó en su lugar |
| --- | --- | --- |
| `box-cookies-levain-6-unidades.jpg` | El papel de envolver lleva el branding de otra marca de cookies, repetido por toda la caja | `cookie-levain-clasica-chips.jpg`, compartida con la cookie clásica |
| `lunch-petit-especial-4-personas.jpg` | Collage de cuatro fotos con marca de agua de Xiaohongshu; además el contenido es desayuno asiático, no lunch | `fotos/luncheventos1.jpg` — torre de postres petit, que es justo lo que incluye el pack |
| `lunch-celebracion-10-personas.jpg` | Manos de personas comiendo y servilletas con el logo de un restaurante | `fotos/luncheventos2.jpg` — mesa dulce de celebración, sin personas ni marcas |

## Dos fotos que no se movieron

`fotos/luncheventos1.jpg` y `fotos/luncheventos2.jpg` se quedan donde estaban:
el sitio ya las usa en la home a través de `src/content/imagenes.ts`
(`home-categoria-lunch` y `home-arma-ocasion`), y moverlas rompería esas
secciones. El importador las lee desde ahí y las sube con el nombre del
producto, así que en Storage quedan igual de ordenadas que el resto.

## Verificación

Este entorno no tiene salida de red hacia `*.supabase.co`, así que el
importador **no se ejecutó todavía contra el proyecto real**. Lo verificado
desde acá:

- [x] **Los 37 slugs del manifiesto existen en el catálogo real** — contrastado
      contra la migración `20260821090000_catalogo_real_chef_arturo_v1.sql`:
      ningún producto queda sin foto, ninguna entrada apunta a un slug
      inexistente.
- [x] **Las 34 fotos son JPEG de verdad** y ninguna carpeta de producto tiene
      archivos sin mapear — lo valida el propio importador antes de tocar la red.
- [x] **La lógica de vinculación es correcta** —
      `supabase/tests/04_catalogo_imagenes.sql` reproduce en SQL puro la misma
      secuencia de escrituras (alta, imagen compartida, reemplazo seguro sin
      doble-principal, limpieza de huérfanos, no duplicación al repetir). Forma
      parte de `npm run db:test`.
- [x] **Las 37 fotos se ven en la tienda** — QA de navegador contra un stub
      local que replica PostgREST y Storage con el catálogo real.
- [ ] El objeto existe en Storage para cada una de las 34 rutas — pendiente.
- [ ] `media_assets` tiene una sola fila por `path` — lo garantiza
      `unique(bucket, path)` a nivel de esquema; falta confirmarlo con datos reales.
- [ ] Los 37 productos tienen su imagen principal en la base real — pendiente.

**Comando para completar la importación real:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://lvthdjqciuipfmogniwr.supabase.co \
SUPABASE_SECRET_KEY=<clave de servicio, nunca la publicable> \
node scripts/importar-imagenes-catalogo-v1.mjs
```

Después de correrlo, completar los `media_id` reales con:

```sql
select id, path from media_assets where path like 'productos/%' order by path;
```
