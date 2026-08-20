# Mapeo de imágenes · Pastelería V1

Fuente de verdad del mapeo archivo → producto para
`scripts/importar-imagenes-pasteleria-v1.mjs`. Las 14 fotografías llegaron al
repositorio subidas por GitHub web (commit `749314b`, `public/fotos/`, con
errores ortográficos en el nombre de archivo) y se normalizaron a
`public/assets/productos/pasteleria/` en este trabajo.

**Origen de las fotografías:** el dueño del negocio confirmó que son
fotografía autorizada para uso del catálogo. Se registran con `source='own'`
y `credit='Chef Arturo'` según se pidió explícitamente.

## Tabla completa

| Archivo original | Archivo normalizado | Producto | Slug | Path en Storage | `media_id` | Compartida | Alt | Verificación |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Crumbledmanzana.jpg` | `crumble-manzana-individual.jpg` | Crumble de manzana — individual | `crumble-manzana-individual` | `media/productos/pasteleria/crumble-manzana-individual.jpg` | *(asignado en la corrida real)* | No | Crumble de manzana — individual | Ver abajo |
| `Crumbledemanzanaporkilo2.jpg` | `crumble-manzana-entero-kg.jpg` | Crumble de manzana — entero por kg | `crumble-manzana-entero-kg` | `media/productos/pasteleria/crumble-manzana-entero-kg.jpg` | *(asignado en la corrida real)* | No | Crumble de manzana — entero por kg | Ver abajo |
| `Cheesecakedenaranja.jpg` | `cheesecake-naranja-individual.jpg` | Cheesecake de naranja — individual | `cheesecake-naranja-individual` | `media/productos/pasteleria/cheesecake-naranja-individual.jpg` | *(asignado en la corrida real)* | No | Cheesecake de naranja — individual | Ver abajo |
| `Cheesecakdenaranjaporkilo.jpg` | `cheesecake-naranja-entero-kg.jpg` | Cheesecake de naranja — entero por kg | `cheesecake-naranja-entero-kg` | `media/productos/pasteleria/cheesecake-naranja-entero-kg.jpg` | *(asignado en la corrida real)* | No | Cheesecake de naranja — entero por kg | Ver abajo |
| `Lemonpie.jpg` | `lemon-pie-individual.jpg` | Lemon pie — individual | `lemon-pie-individual` | `media/productos/pasteleria/lemon-pie-individual.jpg` | *(asignado en la corrida real)* | No | Lemon pie — individual | Ver abajo |
| `Lemonpieporkilo.jpg` | `lemon-pie-entero-kg.jpg` | Lemon pie — entero por kg | `lemon-pie-entero-kg` | `media/productos/pasteleria/lemon-pie-entero-kg.jpg` | *(asignado en la corrida real)* | No | Lemon pie — entero por kg | Ver abajo |
| `Mang ymaracuyá.jpg` | `mango-maracuya-individual.jpg` | Mango y maracuyá — individual | `mango-maracuya-individual` | `media/productos/pasteleria/mango-maracuya-individual.jpg` | *(asignado en la corrida real)* | No | Mango y maracuyá — individual | Ver abajo |
| `Mangoymaracuyáporkilo.jpg` | `mango-maracuya-entero-kg.jpg` | Mango y maracuyá — entero por kg | `mango-maracuya-entero-kg` | `media/productos/pasteleria/mango-maracuya-entero-kg.jpg` | *(asignado en la corrida real)* | No | Mango y maracuyá — entero por kg | Ver abajo |
| `Moussedepistachychocolateblanco.jpg` | `mousse-pistacho-chocolate-blanco-individual.jpg` | Mousse de pistacho y chocolate blanco — individual | `mousse-pistacho-chocolate-blanco-individual` | `media/productos/pasteleria/mousse-pistacho-chocolate-blanco-individual.jpg` | *(asignado en la corrida real)* | No | Mousse de pistacho y chocolate blanco — individual | Ver abajo |
| `Moussedpistachochocolateblancoxkilo.jpg` | `mousse-pistacho-chocolate-blanco-entero-kg.jpg` | Mousse de pistacho y chocolate blanco — entero por kg | `mousse-pistacho-chocolate-blanco-entero-kg` | `media/productos/pasteleria/mousse-pistacho-chocolate-blanco-entero-kg.jpg` | *(asignado en la corrida real)* | No | Mousse de pistacho y chocolate blanco — entero por kg | Ver abajo |
| `mousedeuclelecheyfruosrojos.jpg` | `mousse-dulce-de-leche-frutos-rojos-individual.jpg` | Mousse de dulce de leche y frutos rojos — individual | `mousse-dulce-de-leche-frutos-rojos-individual` | `media/productos/pasteleria/mousse-dulce-de-leche-frutos-rojos-individual.jpg` | *(asignado en la corrida real)* | No | Mousse de dulce de leche y frutos rojos — individual | Ver abajo |
| `musedulcelecheporkilo.jpg` | `mousse-dulce-de-leche-frutos-rojos-entero-kg.jpg` | Mousse de dulce de leche y frutos rojos — entero por kg | `mousse-dulce-de-leche-frutos-rojos-entero-kg` | `media/productos/pasteleria/mousse-dulce-de-leche-frutos-rojos-entero-kg.jpg` | *(asignado en la corrida real)* | No | Mousse de dulce de leche y frutos rojos — entero por kg | Ver abajo |
| `Cheesecake clásica.jpg` | `cheesecake-clasica.jpg` | Cheesecake clásica — individual **y** — entero por kg | `cheesecake-clasica-individual`, `cheesecake-clasica-entero-kg` | `media/productos/pasteleria/cheesecake-clasica.jpg` | *(asignado en la corrida real; el mismo id para ambos productos)* | **Sí** | Medio: «Cheesecake clásica de Chef Arturo» · relación: nombre de cada presentación | Ver abajo |
| `Cheesecake de maracuyá.jpg` | `cheesecake-maracuya.jpg` | Cheesecake de maracuyá — individual **y** — entero por kg | `cheesecake-maracuya-individual`, `cheesecake-maracuya-entero-kg` | `media/productos/pasteleria/cheesecake-maracuya.jpg` | *(asignado en la corrida real; el mismo id para ambos productos)* | **Sí** | Medio: «Cheesecake de maracuyá de Chef Arturo» · relación: nombre de cada presentación | Ver abajo |

No se tocó `Box Colección Dulce.jpg`: corresponde a
`box-coleccion-dulce-9-postres`, explícitamente excluido del alcance de esta
tarea. Sigue en `public/fotos/` sin mover, sin normalizar y sin subir.

## Cómo se resolvió cada ambigüedad del nombre de archivo

Normalizando (minúsculas, sin espacios/tildes/guiones) y tolerando errores
menores:

- **Crumble de manzana**: `Crumbledemanzanaporkilo2` → contiene `porkilo` →
  presentación entera. `Crumbledmanzana` (sin "porkilo") → individual.
- **Cheesecake de naranja**: mismo criterio, `Cheesecakdenaranjaporkilo`
  (con el typo "Cheesecakde") → entera; `Cheesecakedenaranja` → individual.
  El error "Cheesecakde" vive sólo en el nombre de archivo — el nombre
  comercial del producto en la base sigue siendo "Cheesecake".
- **Mango y maracuyá**: `Mangoymaracuyáporkilo` → entera;
  `Mang ymaracuyá` (con espacio de más, "Mang y maracuyá") → individual.
- **Mousse de pistacho y chocolate blanco**: `Moussedpistachochocolateblancoxkilo`
  (con "xkilo" en vez de "porkilo", y "pistacho" sin la "e" final) → entera;
  `Moussedepistachychocolateblanco` (con "pistachy" en vez de "pistacho") →
  individual.
- **Lemon pie**: `Lemonpieporkilo` → entero; `Lemonpie` → individual. No se
  confundieron entre sí: son los dos únicos archivos con ese nombre base y la
  diferencia es exactamente el sufijo `porkilo`.
- **Mousse de dulce de leche y frutos rojos**: `musedulcelecheporkilo`
  (sin mención a frutos rojos, pero con "porkilo") → entera;
  `mousedeuclelecheyfruosrojos` (con "deucle" por "dulce" y "fruos" por
  "frutos", pero con el sufijo `yfrutosrojos`) → individual.
- **Cheesecake clásica** y **Cheesecake de maracuyá**: un solo archivo cada
  una, sin sufijo `porkilo` ni indicación de presentación — según el prompt,
  se suben una sola vez y se vinculan a las dos presentaciones del producto
  con el mismo `media_id`. No hay imagen individual/entera diferenciada para
  estos dos sabores todavía.

## Verificación

`media_id` real y el resultado de la verificación contra el proyecto
(`lvthdjqciuipfmogniwr`) se completan en este documento después de correr el
importador sin `--dry-run`. Ese estado se explica en el informe del PR: este
entorno de trabajo no tiene salida de red hacia `*.supabase.co`, así que la
importación real queda pendiente de ejecutarse desde un entorno con acceso —
el comando exacto está en `docs/CATALOGO_REAL_V1.md`-style más abajo.

**Comando para completar la importación real:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://lvthdjqciuipfmogniwr.supabase.co \
SUPABASE_SECRET_KEY=<clave de servicio, nunca la publicable> \
node scripts/importar-imagenes-pasteleria-v1.mjs
```

Después de correrlo, hay que:

1. Completar la columna `media_id` de la tabla de arriba con los ids reales
   (`select id, path from media_assets where path like 'productos/pasteleria/%'`).
2. Marcar la columna «Verificación» de cada fila con lo que confirmó el
   checklist de la sección siguiente.

### Checklist de verificación real (contra Supabase)

Sin salida de red hacia `*.supabase.co` desde este entorno, esta lista queda
pendiente de correrla contra el proyecto real. Lo que sí se verificó desde
acá, y con qué:

- [x] **Los 16 slugs del manifiesto existen en el catálogo real** —
      confirmado con una consulta directa contra una base recién migrada
      (sólo `00_shim.sql` + las 9 migraciones, sin los fixtures sintéticos de
      `01_rls.sql`): `select count(*) from products where slug in (...)` → 16.
- [x] **La lógica de vinculación es correcta** —
      `supabase/tests/04_pasteleria_imagenes.sql` reproduce en SQL puro la
      misma secuencia de escrituras que hace el importador (alta simple,
      imagen compartida, reemplazo seguro sin doble-principal, limpieza de
      huérfanos, no duplicación al repetir) y las 10 aserciones pasan. Forma
      parte de `npm run db:test` de ahora en más.
- [ ] El objeto existe en Storage para cada una de las 14 rutas — pendiente,
      requiere la corrida real.
- [ ] `media_assets` tiene una sola fila por `path` — la restricción
      `unique(bucket, path)` lo garantiza a nivel de esquema; falta
      confirmarlo con datos reales.
- [ ] Los 16 productos esperados tienen una imagen principal
      (`is_primary = true`, `position = 0`) — pendiente.
- [ ] `cheesecake-clasica-individual` y `cheesecake-clasica-entero-kg`
      comparten el mismo `media_id` — pendiente contra datos reales (la
      lógica ya se probó en SQL).
- [ ] `cheesecake-maracuya-individual` y `cheesecake-maracuya-entero-kg`
      comparten el mismo `media_id` — pendiente contra datos reales.
- [x] Ningún producto puede quedar con dos imágenes principales — lo
      garantiza el índice único `product_images_one_primary` de la migración
      0002, no algo que dependa de esta importación.
- [ ] No hay paths rotos (ninguna fila de `media_assets` sin objeto en
      Storage) — pendiente.
- [ ] No se modificó ningún producto fuera de esta lista de 16 (nombres,
      precios, descripciones, categorías, modalidades, estados, posiciones
      intactos) — el importador nunca escribe esas columnas (sólo
      `product_images` y, indirectamente, `media_assets`), así que no hay
      forma de que las toque; falta la confirmación con `git diff` sobre los
      datos reales después de correrlo.

## Productos de pastelería sin imagen tras esta importación

Ninguno: las 16 presentaciones de pastelería que sí tienen fotografía
diferenciada o compartida quedan cubiertas. La única excepción es
`box-coleccion-dulce-9-postres`, fuera de alcance por instrucción explícita
— sigue con la imagen genérica que ya tenía (o sin imagen, según el estado
real del proyecto), y una futura tarea deberá encargarse de ella con su
propia fotografía.
