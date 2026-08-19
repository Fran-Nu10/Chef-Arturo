# STOCK_ASSETS — material temporal de demostración

Registro de las imágenes y videos de stock que completan los huecos de la demo.
**Ninguna fotografía de esta tabla es trabajo real de Chef Arturo**: son
material temporal, reemplazable desde el futuro panel administrativo.

## Estado: la tabla está vacía

No pude incorporar ni un solo asset de stock. La política de egreso de red de
este entorno bloquea a los proveedores permitidos:

```
$ curl -I https://images.pexels.com
Host not in allowlist: images.pexels.com.
Add this host to your network egress settings to allow access.
```

Mismo resultado para `api.pexels.com`, `videos.pexels.com`, `unsplash.com` e
`images.unsplash.com`. No es un fallo de búsqueda: el proxy rechaza la conexión
antes de salir.

No completé la tabla de memoria. Una fila con un fotógrafo y una URL que no
pude verificar sería exactamente lo que el encargo prohíbe —material sin
procedencia comprobable— y además irreproducible para quien tenga que
descargarlo después.

**Para desbloquearlo:** agregar `images.pexels.com`, `api.pexels.com`,
`videos.pexels.com`, `images.unsplash.com` y `unsplash.com` al allowlist de
egreso del entorno (Settings → Network en la configuración del entorno de
Claude Code on the web). Con eso, esta tabla se completa en una sola pasada.

## Esquema de la tabla

Cada asset de stock que se incorpore debe registrar:

| Campo | Descripción |
| --- | --- |
| `id` | Identificador estable, p. ej. `stock-camp-01` |
| `seccion` | Sección y slot donde se usa |
| `archivo` | Ruta local dentro de `public/fotos/stock/` |
| `url_fuente` | Página del proveedor, **no** una URL de resultados de búsqueda |
| `fotografo` | Autor acreditado |
| `proveedor` | Pexels · Unsplash |
| `licencia` | Licencia concreta y su alcance comercial |
| `estado` | Siempre `temporal` |
| `reemplazo` | Qué foto propia debería sustituirlo |

En el código, un asset de stock se declara en `src/content/imagenes.ts` con el
mismo objeto `Fotografia` más `temporal: true`, para que el panel pueda
listarlos y reemplazarlos sin tocar el diseño.

## Huecos que esperan stock

Ordenados por impacto visual. Los términos de búsqueda salen del brief.

| Slot | Sección | Búsqueda sugerida | Ratio | Notas de encuadre |
| --- | --- | --- | --- | --- |
| `home-detalle-video` | 04 El detalle final | `cake glazing`, `pastry chef decorating cake`, `pastry macro video` (Pexels Videos) | 16:9 desktop · 4:5 mobile | Loop 6–12 s, `muted` `autoplay` `playsInline`, poster obligatorio, sin logos ni texto, movimiento lento |
| `home-camp-activa` | 06 Fechas que importan | `celebration dessert table` | 3:2 | Marcar como demostración, nunca como campaña vigente |
| `home-camp-prog` | 06 Fechas que importan | `elegant cake` | 3:2 | Ídem |
| `home-camp-fin` | 06 Fechas que importan | `brunch table` | 3:2 | Ídem |
| `producto-pasteleria-02` | catálogo · ficha · vista rápida · carrito | `artisan pastry`, `elegant tiramisu` | 4:5 | Modalidad por encargo |
| `producto-pasteleria-03` | catálogo | `premium bakery`, `dessert close-up` | 4:5 | |
| `producto-pasteleria-04` | catálogo | `fresh cinnamon rolls` | 4:5 | |
| `producto-merienda-02` | catálogo · Selección de la casa | `afternoon tea pastries` | 4:5 | Estado agotado: se muestra con saturación reducida |
| `producto-merienda-03` | ficha de producto no disponible | `pastry display` | 4:5 | Se muestra apagada, con sello NO DISPONIBLE |

## Coherencia exigida a lo que se elija

Luz cálida y natural, contraste medio, crema · chocolate · masa · verde apagado
· madera, fondo limpio, producto protagonista, textura visible, estilo artesanal
contemporáneo. Sin personas posando a cámara, sin texto integrado, sin logos,
sin marcas de agua, sin saturación excesiva, sin estética de supermercado.

Tiene que convivir con las once fotografías propias ya colocadas: mirar
`docs/manifiesto-imagenes.md` antes de elegir.
