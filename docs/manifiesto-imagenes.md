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
| `LamesadeChefArturo4.jpg` | 736×736 | 1.00 | cuadrada | 82 KB | la mesa | ✅ en uso, recortada (pizarras ilegibles fuera de cuadro) |
| `LamesadeChefArturo5.jpg` | 720×1280 | 0.56 | vertical | 117 KB | la mesa | ⛔ precios en USD |
| `LamesadeChefArturo6.jpg` | 736×979 | 0.75 | vertical | 121 KB | la mesa | ✅ en uso |
| `LamesadeChefArturo7.jpg` | 736×981 | 0.75 | vertical | 99 KB | la mesa | ✅ en uso, recortada (cartel ajeno fuera de cuadro) |
| `LamesadeChefArturo8.jpg` | 736×981 | 0.75 | vertical | 135 KB | la mesa | ✅ en uso, recortada (precios y persona fuera de cuadro) |

Los 20 archivos abren correctamente y los 20 respetan el contrato de nombres.
**Ninguna imagen del lote es horizontal**: son todas verticales o cuadradas.

## 2 · Los dos únicos arcos

El arco de vitrina quedó racionado como firma visual. Sólo existen dos
contenedores de imagen arqueados en todo el sitio:

| # | Slot | Sección |
| --- | --- | --- |
| 1 | `home-hero` | 01 La Vitrina Viva |
| 2 | `producto-pasteleria-01` (protagonista) | 03 Del mostrador de hoy |

Todo lo demás usa marco rectangular editorial de 0–4 px de radio. Se quitaron
los arcos de categorías, cards de producto, productos secundarios, catálogo,
ficha, vista rápida, campañas, "Armá tu ocasión", "La mesa de Chef Arturo",
carrito, checkout, cierre editorial y estados vacíos.

## 3 · Asignación

`fit` y `object-position` se eligieron mirando el sujeto de cada foto, no por
uniformidad. El ratio del marco se acerca al nativo cuando el producto debe
verse entero.

| Slot | Archivo | Grupo | Sección | Ratio | `object-fit` | `object-position` | Mobile | Desktop | Real / stock |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `home-hero` | `merienda1.jpg` | merienda | 01 · **arco 1** | arco vertical | cover | `50% 55%` | 78vw | 340px | real |
| `home-categoria-pasteleria` | `pasteleria1.jpg` | pastelería | 02 | 4:5 · alto fijo 480px en desktop | cover | `50% 45%` | 76vw | 33vw | real |
| `home-categoria-merienda` | `merienda3.jpg` | merienda | 02 | 4:5 · ídem | cover | `50% 58%` | 76vw | 33vw | real |
| `home-categoria-lunch` | `luncheventos1.jpg` | lunch | 02 | 4:5 · ídem | **contain** | `50% 50%` | 76vw | 33vw | real |
| `producto-pasteleria-01` | `pasteleria5.jpg` | pastelería | 03 · **arco 2** + catálogo, ficha, vista rápida, carrito | arco 4:5 · 3:2 destacado en catálogo | cover | `50% 48%` | 100vw | 460px | real |
| `producto-merienda-01` | `merienda4.jpg` | merienda | catálogo · ficha · vista rápida · carrito · Selección | 4:5 | cover | `50% 55%` | 100vw / 86px | 330px / 250px | real |
| `producto-lunch-01` | `luncheventos3.jpg` | lunch | catálogo · ficha · vista rápida · carrito · Selección | 1:1 | cover | `50% 50%` | 100vw / 86px | 330px | real |
| `home-arma-ocasion` | `luncheventos2.jpg` | lunch | 05 | 4:5 | cover | `50% 35%` | 100vw | 340px | real |
| `mesa-1` | `LamesadeChefArturo3.jpg` | la mesa | 08 | 4:5 | cover | `55% 55%` | 260px | 260px | real |
| `mesa-2` | `LamesadeChefArturo6.jpg` | la mesa | 08 | 3:2 | cover | `40% 58%` | 430px | 430px | real |
| `mesa-3` | `LamesadeChefArturo7.jpg` | la mesa | 08 | 3:2 | cover | `50% 100%` | 390px | 390px | real |
| `mesa-4` | `LamesadeChefArturo8.jpg` | la mesa | 08 | 3:2 | cover | `25% 100%` | 340px | 340px | real |
| `mesa-5` | `LamesadeChefArturo4.jpg` | la mesa | 08 | 2:1 | cover | `50% 100%` | 300px | 300px | real |
| `home-cierre` | `LamesadeChefArturo.jpg` | la mesa | 10 | 4:5 | cover | `50% 50%` | 86vw | 460px | real |

Once fotografías propias, ninguna repetida en la home. Cada categoría usa sólo
imágenes de su grupo. Cada producto tiene una única entrada, así que catálogo,
vista rápida, ficha y carrito muestran siempre la misma foto.

### Decisiones de encuadre que se apartan de la tabla de ratios

- **Categorías en 4:5, no en 4:3.** Las tres fotos son verticales; un 4:3 deja
  sólo una banda central que parte la pila de brownies, corta los croissants y
  decapita la bandeja de pisos.
- **`luncheventos1` con `contain`.** La bandeja de cuatro pisos pierde el
  sentido si se recorta: se muestra entera sobre el fondo crema del sistema.
- **`mesa-3`, `mesa-4` y `mesa-5` en panorámico anclado abajo.** El recorte
  deja fuera el cartel de otro comercio, la pizarra con precios ajenos, la
  persona identificable y las pizarras con texto ilegible. Los originales
  quedan intactos: el recorte es sólo `object-position`.

### Archivos propios descartados

Quedan fuera cinco de los veinte: `pasteleria2`, `pasteleria3`, `pasteleria4`
y `merienda2` llevan marcas de terceros legibles en la propia composición, y
`LamesadeChefArturo2` una marca de agua de la biblioteca que la vendió —
recortarla para esconderla sería esquivar la licencia, no resolverla.
`LamesadeChefArturo5` muestra doce productos con precio en dólares en cada
etiqueta: irrecuperable con recorte.

`LamesadeChefArturo4`, `7` y `8` sí se recuperaron: un encuadre panorámico
anclado abajo deja fuera el cartel ajeno, las pizarras ilegibles, los precios y
la persona identificable. Verificado a 1440 px. Riesgo residual: en `8` quedan
tarjetitas de precio sobre el mostrador, ilegibles al tamaño al que se sirve.

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
