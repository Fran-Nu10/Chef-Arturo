# Mapeo de imágenes · Catálogo real V1

Inspección visual de las 20 fotografías que ya estaban en `public/fotos/` antes
de esta carga, con la decisión de uso de cada una. Nada de esto es
automático: cada fila es una mirada real a la imagen, no una asignación por
número de archivo.

**Regla que gobierna todo el mapeo:** el contenido visual manda sobre el
nombre del archivo. Varias imágenes están mal ubicadas por carpeta —una
"pastelería" resultó ser una foto de brownies que encaja mejor con un box de
merienda— y dos series completas resultaron **no ser material propio de Chef
Arturo**, pese a estar en el repositorio. Documentarlo con esa honestidad es
más importante que completar una tabla prolija.

## Resumen

| | |
| --- | --- |
| Imágenes inspeccionadas | 20 |
| Usadas en esta carga | 6 |
| Con marca de un tercero visible (excluidas) | 4 |
| Fotografías reales de otro negocio (excluidas) | 2 |
| Con precios o nombres que contradicen el catálogo (excluida) | 1 |
| Con marca de agua de terceros (excluida) | 1 |
| Reservadas para la sección editorial "La mesa de Chef Arturo", no para productos | 6 (subconjunto de las anteriores) |
| Sin marca pero sin producto que represente (sin usar) | 2 |

## `pasteleria*`

| Archivo | Contenido visible | Decisión |
| --- | --- | --- |
| `pasteleria1.jpg` | Torre de brownies de chocolate con hilos de dulce de leche, sin marca visible. | **Usada** — asignada a `box-brownies-arturo-selection-6-unidades` (categoría Merienda), no a Pastelería: el contenido corresponde a un box de brownies, no a la carpeta donde estaba. Confianza: media (no es la foto real del box, es ilustrativa). |
| `pasteleria2.jpg` | Caja de cookies con el logo impreso **"no way! COOKIES"**. | **Excluida.** Marca de un negocio de cookies que no es Chef Arturo. Usarla implicaría mostrar el producto de otra marca como si fuera el "Box Cookies Levain". |
| `pasteleria3.jpg` | Caja de donuts con el logo **"Donut Daze"** y servilletas de papel con el mismo logo repetido. | **Excluida.** Marca de terceros; además Chef Arturo no vende donuts — ningún producto del catálogo la necesitaba. |
| `pasteleria4.jpg` | Croissant con chocolate en una caja con el logo **"BONPANE · MX.19975"**. | **Excluida.** Marca de una panadería mexicana ("MX"), no Chef Arturo. |
| `pasteleria5.jpg` | Cheesecake entera con frutos rojos (frambuesa, arándano, mora) sobre una pizarra, sin marca visible. | **Usada** — asignada a `cheesecake-clasica-entero-kg`. Es una cheesecake entera con frutos rojos, coincide razonablemente con la descripción ("tarta de queso y frutos rojos"). Confianza: media-alta para el concepto general, no es la torta real de la casa. |

## `merienda*`

| Archivo | Contenido visible | Decisión |
| --- | --- | --- |
| `merienda1.jpg` | Mano sosteniendo dos cookies partidas con relleno de chocolate derretido, sin marca visible. | **Usada** — asignada a la categoría Merienda y a `box-cookies-levain-6-unidades`. Coincide con el concepto "cookie con centro de chocolate". Confianza: media. |
| `merienda2.jpg` | Cookies partidas con relleno de chocolate, packaging de fondo con el logo **"BRUCK"** parcialmente visible. | **Excluida.** Marca de terceros visible en el fondo. |
| `merienda3.jpg` | Croissants rellenos de chocolate, sin marca visible. | **Sin usar.** No hay ningún producto de croissants en el catálogo; forzar su uso en "Cookie Levain" o en salados sería incorrecto. Queda disponible en el repositorio, no se sube a Storage. |
| `merienda4.jpg` | Croissants rellenos de frambuesa, sin marca visible. | **Sin usar**, mismo motivo que `merienda3.jpg`. |

## `luncheventos*`

| Archivo | Contenido visible | Decisión |
| --- | --- | --- |
| `luncheventos1.jpg` | Torre de mini cheesecakes variadas (frutos rojos, maracuyá, mango, chocolate) en una exhibidora de varios niveles, sin marca visible. | **Usada** — asignada a la categoría Pastelería. Representa bien la idea de "postres variados", aunque no es una foto de un producto puntual. |
| `luncheventos2.jpg` | Mesa de postres de evento: torta de dos pisos con ganache, frutillas cubiertas de chocolate, pirámide de brownies, cupcakes, decoración floral. Sin marca visible. | **Usada** — asignada a la categoría Lunch para eventos, como imagen de ambiente. **No representa el contenido real de los packs** (que son de sándwiches y salados, no de postres de boda): el alt lo aclara explícitamente. |
| `luncheventos3.jpg` | Filas de bocaditos tipo trufa/brigadeiro cubiertos con maní y chocolate, y una bandeja de brownies. Sin marca visible. | **Usada** — asignada a `box-coleccion-dulce-9-postres`, como imagen ilustrativa de "postres variados pequeños". No son los sabores reales del box (lemon pie, mousse de Oreo, etc.), el alt lo aclara. |

## `LamesadeChefArturo*` — reservadas para la sección editorial

El enunciado es explícito: estas imágenes son **prioritariamente para la
sección editorial "La mesa de Chef Arturo"**, no para representar sabores
concretos. Ninguna se usó en esta carga. Se inspeccionaron igual, las ocho,
porque documentar mal una imagen que después alguien reutilice sería peor que
no usarla:

| Archivo | Contenido visible | Nota de uso futuro |
| --- | --- | --- |
| `LamesadeChefArturo.jpg` | Interior de cafetería con vitrina, estanterías y ventanal en arco — render, no fotografía real. Sin marca de agua visible. | Utilizable en la sección editorial, con la salvedad de que es un render genérico, no el local real. |
| `LamesadeChefArturo2.jpg` | Interior de cafetería con pizarra de menú ("COFFEE / DRINKS", precios en formato decimal genérico) — render. | Lleva la marca de agua **"Arquitecturas3D.com"** visible en la esquina inferior. **No usar en ningún contexto**: recortar la marca de agua no resuelve la procedencia, sólo la oculta. |
| `LamesadeChefArturo3.jpg` | Interior de cafetería con pizarra "MENU" (bebidas genéricas) — render, sin marca de agua visible. | Utilizable en la sección editorial con la misma salvedad que la 1. |
| `LamesadeChefArturo4.jpg` | Interior con pizarra de menú **ilegible** (texto generado, no un menú real) y una vitrina con un logo indescifrable. | Calidad insuficiente para cualquier uso: el texto no es legible ni real. |
| `LamesadeChefArturo5.jpg` | Vitrina de tortas con carteles de precio **legibles en dólares** ("Double Chocolate Fudge $6.75", "Burnt Cheesecake $6.25", etc.), nombres de producto en inglés que no existen en el catálogo. | **No usar en ningún contexto**, ni editorial. Los precios visibles contradicen directamente los precios reales en pesos uruguayos; usarla arriesga que alguien la lea como una lista de precios real. |
| `LamesadeChefArturo6.jpg` | Mostrador de panadería con vitrina curva, caja registradora, botellas de vino en estantería y un retrato enmarcado de una persona no identificada como decoración. | Utilizable en la sección editorial. El retrato es decorativo (parte del render), no una foto de un empleado real. |
| `LamesadeChefArturo7.jpg` | **Fotografía real** (no render) de un local de empanadas con el logo **"Malvón · Empanadadas confeccionadas a mano"** rotulado en la pared, vitrina con empanadas, calle visible del otro lado del vidrio. | **No usar en ningún contexto.** Es la fotografía real de un negocio real distinto de Chef Arturo ("Malvón"), identificable por nombre y por la calle visible. Usarla sería presentar el local de otra empresa como si fuera el de Chef Arturo. |
| `LamesadeChefArturo8.jpg` | **Fotografía real** de una panadería con menú en inglés (australiano/neozelandés por el vocabulario: "Sausage Rolls", "Pikelets"), y una empleada real, identificable, atendiendo el mostrador. | **No usar en ningún contexto.** Fotografía real de otro negocio real, con una persona identificable trabajando. Usarla es tanto un problema de procedencia como de privacidad de esa persona. |

## Qué se subió a Storage

Sólo las 6 imágenes de la tabla de arriba marcadas **Usada**. No se subió
ninguna de las `LamesadeChefArturo*` (reservadas, once razones documentadas
arriba para no usarlas de todos modos ni siquiera en editorial en tres casos),
ni `merienda3.jpg`/`merienda4.jpg` (sin producto que representar), ni las
cuatro con marca de un tercero. Subir un archivo sin un uso real generaría un
`media_asset` huérfano — mejor no crearlo hasta que haga falta.

Rutas en el bucket `media`, todas bajo el prefijo determinístico
`catalogo/chef-arturo-v1/`:

| Archivo | Ruta en Storage | Dimensiones | Peso |
| --- | --- | --- | --- |
| `pasteleria1.jpg` | `catalogo/chef-arturo-v1/pasteleria1.jpg` | 1200×1800 | 233 061 bytes |
| `pasteleria5.jpg` | `catalogo/chef-arturo-v1/pasteleria5.jpg` | 600×900 | 78 182 bytes |
| `merienda1.jpg` | `catalogo/chef-arturo-v1/merienda1.jpg` | 1200×1600 | 228 582 bytes |
| `luncheventos1.jpg` | `catalogo/chef-arturo-v1/luncheventos1.jpg` | 736×1104 | 81 551 bytes |
| `luncheventos2.jpg` | `catalogo/chef-arturo-v1/luncheventos2.jpg` | 676×1200 | 135 834 bytes |
| `luncheventos3.jpg` | `catalogo/chef-arturo-v1/luncheventos3.jpg` | 736×981 | 198 932 bytes |

Todos los `media_assets` de esta carga se guardan con `is_temporary = true`,
`source = 'own'`, `source_url = null`, `credit = 'Chef Arturo'`: son
ilustrativas, no la fotografía real de cada sabor, y así queda dicho en la
base — no sólo en este documento.

## Productos sin ninguna imagen

De los 37 productos cargados, **33 quedan sin imagen** después de esta carga
(sólo 4 productos y 3 categorías tienen una asignada). Es la consecuencia
honesta de no tener fotografía propia por sabor: el storefront ya sabe mostrar
ese hueco con el componente `MediaPendiente` — un placeholder con la leyenda
de qué falta, sin romper el layout ni mostrar una tarjeta rota.

Categoría `salados` completa (10 productos) no tiene ninguna imagen: ninguna
de las 20 fotografías inspeccionadas muestra empanadas, tartas ni ningún
producto salado. No se forzó ninguna asignación ahí.
