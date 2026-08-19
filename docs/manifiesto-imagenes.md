# Manifiesto de imágenes — Chef Arturo · La Vitrina

Estado a la fecha del alta de fotografías. La fuente de verdad ejecutable es
`src/content/imagenes.ts`; este documento es su lectura para el handoff.

Los originales están en `public/fotos/` y no se modificaron: no se generaron
copias comprimidas ni recortes destructivos. Todo el encuadre se resuelve con
`object-fit` y `object-position`.

## 1 · Inventario de los 20 archivos entregados

Dimensiones y peso medidos con `node scripts/auditar-imagenes.mjs`.
El grupo se deduce **sólo del nombre**, según el contrato.

| Archivo | Dimensiones | Ratio | Orientación | Peso | Grupo | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| `pasteleria1.jpg` | 1200×1800 | 0.67 | vertical | 228 KB | pastelería | ✅ en uso |
| `pasteleria2.jpg` | 600×600 | 1.00 | cuadrada | 36 KB | pastelería | ⛔ marca ajena |
| `pasteleria3.jpg` | 736×736 | 1.00 | cuadrada | 52 KB | pastelería | ⛔ marca ajena |
| `pasteleria4.jpg` | 736×946 | 0.78 | vertical | 79 KB | pastelería | ⛔ marca ajena |
| `pasteleria5.jpg` | 600×900 | 0.67 | vertical | 76 KB | pastelería | ✅ en uso |
| `merienda1.jpg` | 1200×1600 | 0.75 | vertical | 223 KB | merienda | ✅ en uso |
| `merienda2.jpg` | 1200×1500 | 0.80 | vertical | 173 KB | merienda | ⛔ marca ajena |
| `merienda3.jpg` | 1200×1607 | 0.75 | vertical | 210 KB | merienda | ✅ en uso |
| `merienda4.jpg` | 1200×1607 | 0.75 | vertical | 203 KB | merienda | ✅ en uso |
| `luncheventos1.jpg` | 736×1104 | 0.67 | vertical | 80 KB | lunch | ✅ en uso |
| `luncheventos2.jpg` | 676×1200 | 0.56 | vertical | 133 KB | lunch | ✅ en uso |
| `luncheventos3.jpg` | 736×981 | 0.75 | vertical | 194 KB | lunch | ✅ en uso |
| `LamesadeChefArturo.jpg` | 736×920 | 0.80 | vertical | 155 KB | la mesa | ✅ en uso |
| `LamesadeChefArturo2.jpg` | 736×1104 | 0.67 | vertical | 123 KB | la mesa | ⛔ marca de agua + precios |
| `LamesadeChefArturo3.jpg` | 736×1103 | 0.67 | vertical | 117 KB | la mesa | ✅ en uso |
| `LamesadeChefArturo4.jpg` | 736×736 | 1.00 | cuadrada | 82 KB | la mesa | ⛔ texto ilegible |
| `LamesadeChefArturo5.jpg` | 720×1280 | 0.56 | vertical | 117 KB | la mesa | ⛔ precios en USD |
| `LamesadeChefArturo6.jpg` | 736×979 | 0.75 | vertical | 121 KB | la mesa | ✅ en uso |
| `LamesadeChefArturo7.jpg` | 736×981 | 0.75 | vertical | 99 KB | la mesa | ⛔ marca ajena |
| `LamesadeChefArturo8.jpg` | 736×981 | 0.75 | vertical | 135 KB | la mesa | ⛔ precios + persona |

Los 20 archivos abren correctamente y los 20 respetan el contrato de nombres.
**Ninguna imagen del lote es horizontal**: son todas verticales o cuadradas.

## 2 · Asignación

| Slot | Archivo | Grupo | Sección | Posición | `object-fit` | `object-position` | Ratio caja | Mobile | Desktop | Alt | Reutilizable |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `home-hero` | `merienda1.jpg` | merienda | 01 La Vitrina Viva | ventana arqueada | cover | `50% 55%` | 0.79 | 78vw | 340px | Una mano sostiene tres piezas dulces partidas al medio, sobre fondo claro | no — es la imagen del hero |
| `home-categoria-pasteleria` | `pasteleria1.jpg` | pastelería | 02 Elegí tu ocasión | tarjeta 01 | cover | `50% 50%` | var. | 76vw | 33vw | Piezas de pastelería apiladas en un plato, con cobertura de chocolate | sí, en cabecera de categoría |
| `home-categoria-merienda` | `merienda3.jpg` | merienda | 02 Elegí tu ocasión | tarjeta 02 | cover | `50% 60%` | var. | 76vw | 33vw | Facturas hojaldradas apiladas, con relleno de chocolate a la vista | sí, en cabecera de categoría |
| `home-categoria-lunch` | `luncheventos1.jpg` | lunch | 02 Elegí tu ocasión | tarjeta 03 | cover | `50% 50%` | var. | 76vw | 33vw | Bandeja de varios pisos con porciones individuales de repostería | sí, en cabecera de categoría |
| `home-arma-ocasion` | `luncheventos2.jpg` | lunch | 05 Armá tu ocasión | columna izquierda, junto al copy | cover | `50% 40%` | 1.27 | 100vw | 380px | Mesa servida para un evento, con torta, bocados dulces y velas | sí, en solicitud de evento |
| `mesa-1` | `LamesadeChefArturo.jpg` | la mesa | 08 La mesa | riel 1, pieza 1 (240×320) | cover | `50% 50%` | 0.75 | 240px | 240px | Salón con mostrador de vitrina, plantas y ventanal arqueado | no |
| `mesa-2` | `LamesadeChefArturo6.jpg` | la mesa | 08 La mesa | riel 1, pieza 2 (380×280) | cover | `40% 55%` | 1.36 | 380px | 380px | Vitrina curva de un mostrador con bandejas de piezas horneadas | no |
| `mesa-3` | `LamesadeChefArturo3.jpg` | la mesa | 08 La mesa | riel 2, pieza 1 (210×270) | cover | `55% 55%` | 0.78 | 210px | 210px | Interior de un salón con mostrador y mesas de madera | no |
| `producto-pasteleria-01` | `pasteleria5.jpg` | pastelería | producto | catálogo · ficha · vista rápida · carrito · protagonista de Selección | cover | `50% 45%` | var. | 100vw / 86px | 430px / 250px | Torta fría con frutos rojos por encima, sobre una base oscura | sí, en todas sus pantallas |
| `producto-merienda-01` | `merienda4.jpg` | merienda | producto | catálogo · ficha · vista rápida · carrito · Selección | cover | `50% 55%` | var. | 100vw / 86px | 430px / 250px | Facturas hojaldradas apiladas, con relleno rojo de frutas | sí, en todas sus pantallas |
| `producto-lunch-01` | `luncheventos3.jpg` | lunch | producto | catálogo · ficha · vista rápida · carrito · Selección | cover | `50% 50%` | var. | 100vw / 86px | 430px / 250px | Bandeja completa con muchos bocados dulces ordenados en filas | sí, en todas sus pantallas |

Cada producto tiene **una sola** entrada, así que catálogo, vista rápida, ficha
y carrito muestran siempre la misma fotografía. Ninguna imagen se repite dentro
de la home. Cada categoría usa únicamente imágenes de su propio grupo.

## 3 · Slots que siguen con placeholder

| Slot | Sección | Por qué |
| --- | --- | --- |
| `home-detalle-video` | 04 El detalle final | La sección es de video; no se sustituye por una foto. Falta el video de terminación o armado. |
| `home-camp-activa` · `home-camp-prog` · `home-camp-fin` | 06 Fechas que importan | Ningún archivo del lote declara ser de campaña. No se usan fotos de pastelería como si lo fueran. |
| `home-cierre` | 10 Cierre editorial | No queda una imagen sin repetir. Falta una foto del local en Florida. |
| `mesa-4` · `mesa-6` | 08 La mesa | De las ocho `LamesadeChefArturo*`, cinco quedaron descartadas. |
| `producto-pasteleria-02/03/04`, `producto-merienda-02/03` | catálogo y fichas | Sólo hay dos fotos de pastelería usables y tres de merienda, ya asignadas. |

## 4 · Rendimiento

- `next/image` con `fill` sobre una caja de dimensiones reservadas: colocar una
  foto no mueve el layout (CLS).
- `sizes` declarado por slot (columna Mobile/Desktop de la tabla).
- `priority` **sólo** en `home-hero`; todo lo demás es `loading="lazy"`.
- `next.config.ts` sirve AVIF y WebP; los JPG originales quedan intactos.
- Sin base64: todas las rutas son relativas y reutilizables (`/fotos/…`).

## 5 · Verificación

```bash
node scripts/auditar-imagenes.mjs     # inventario y archivos ilegibles
npm run build                          # 29 rutas estáticas
```

Comprobado en 360×800, 390×844, 768×1024 y 1440×900: sin scroll horizontal,
sin errores de consola, sin deformaciones (todas las cajas usan `cover`) y con
el sujeto principal dentro del encuadre en cada recorte.
