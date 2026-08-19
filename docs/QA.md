# QA · qué se probó y cómo

Este documento dice exactamente qué se verificó, contra qué, y qué **no** se
pudo verificar. Nada de lo que figura acá se dio por bueno porque compilara.

## Cómo reproducir

```bash
npm install
npm run lint
npm run typecheck
npm run test          # 84 pruebas de dominio
npm run build
git diff --check

# PostgreSQL real (no un doble): recrea la base, aplica las 7 migraciones
# desde cero y corre 81 aserciones.
PGHOST=/tmp PGPORT=54322 PGUSER=postgres npm run db:test

# Capturas y chequeo responsive (necesita `npm run dev` en otra terminal)
node scripts/qa-capturas.mjs
```

## Pruebas automatizadas

| Suite | Cantidad | Contra qué corre |
| --- | --- | --- |
| Dominio (`vitest`) | 84 | Funciones puras: dinero, validación, reportes, zona horaria, firma de Mercado Pago, confirmación de escrituras |
| SQL y RLS (`psql`) | 81 | PostgreSQL 16 con las migraciones reales aplicadas desde cero |

Las pruebas SQL no usan mocks. Levantan una base, aplican `supabase/migrations/`
en orden y ejercitan las políticas con `set role`.

### El shim no es una migración

`supabase/tests/00_shim.sql` emula lo que Supabase provee y PostgreSQL a secas
no tiene: el esquema `auth`, `auth.uid()`, los roles `anon` / `authenticated` /
`service_role`, y `storage.buckets` / `storage.objects`. Vive en
`supabase/tests/`, **no** en `supabase/migrations/`, y `run.sh` lo aplica
aparte. Contra un Supabase real sobra: ese esquema ya existe.

Las migraciones productivas no crean ni alteran los esquemas `auth` ni
`storage`. Lo único que tocan de `storage` es declarar dos buckets y cinco
políticas sobre `storage.objects`, que es la vía documentada por Supabase, y
está envuelto para que un permiso faltante avise en vez de romper la migración.

## Perfiles de RLS verificados

Los cinco, con `set role` y `request.jwt.claims` reales:

| Perfil | Qué se comprobó |
| --- | --- |
| Anónimo | Lee sólo catálogo activo y secciones publicadas. No ve pedidos, clientes, pagos, líneas, eventos ni historial. No escribe en ninguna tabla. |
| Autenticado sin fila en `admin_users` | Igual que anónimo para escritura. No entra al panel. |
| Administrador desactivado | `is_active_admin()` da falso: pierde todo acceso sin borrar la fila. |
| `staff` | Opera catálogo, contenido y pedidos. **No** escribe `site_settings` ni crea administradores. |
| `owner` | Acceso completo, incluida la configuración y el alta de administradores. |

Y en los cinco: **nadie puede aprobar un pago ni cambiar el total de un pedido.**
`payments` no tiene política de escritura para ningún rol; sólo la toca el
webhook con la clave de servicio.

### Cero filas, no error

Con RLS activo, un `UPDATE` o un `DELETE` que ninguna política autoriza **no
falla**: afecta cero filas y termina bien. Es la trampa que hizo que el panel
dijera "Cambios guardados" sin guardar nada.

Las pruebas usan `debe_no_afectar()`, que exige `row_count = 0` en lugar de una
excepción. La aplicación usa `confirmarEscritura()`, que convierte esas cero
filas en un error visible.

`debe_fallar()` acepta el motivo esperado y falla si el error es otro. Se
agregó porque cinco pruebas pasaban por la razón equivocada: el nombre del
comprador era `'X'`, la función lo rechazaba por longitud, y nunca llegaban a
la regla que decían probar.

## Flujos verificados de punta a punta

### Pedido público

Contra PostgreSQL real, como `anon`:

- El precio que viaje en el JSON se ignora. Se mandó una línea con
  `unit_price_cents: 1` y el total salió 90000, releído de `products`.
- Producto en borrador o archivado: rechazado.
- Cantidad cero, negativa o por debajo del mínimo: rechazada.
- Pedido vacío, entrega a domicilio sin dirección: rechazados.
- Método de pago fuera de `mercado_pago` / `whatsapp`: rechazado. Nadie crea un
  pedido declarando que ya pagó.
- El pedido nace `pending` en estado y en pago.

### Stock

**Cuándo se descuenta:** al crear el pedido, dentro de `create_public_order`,
con la fila del producto bloqueada por `for update`.

**Cuándo se repone:** cuando el pedido pasa a `cancelled`, por el trigger
`orders_restore_stock`. Está en la base y no en la acción del panel para que
valga por cualquier camino. `orders.stock_restored_at` impide reponer dos veces
si un operador saca el pedido de cancelado y vuelve a cancelarlo.

**No se repone** en `rejected` ni `refunded`: el pedido sigue vivo y la
mercadería sigue comprometida. Cancelar es la decisión explícita que libera.

Condición de carrera comprobada de verdad: con stock 1, dos procesos `psql`
simultáneos pidiendo una unidad cada uno. Uno creó el pedido, el otro recibió
"Sin stock suficiente", y el stock quedó en 0. Nunca negativo.

También se comprobó que el mismo producto repetido en dos líneas no evade el
control: la segunda línea relee la fila ya descontada.

### Pagos

- El upsert que hace el webhook infiere el índice único y una notificación
  repetida actualiza en lugar de duplicar.
- Varias filas sin `provider_payment_id` conviven sin chocar.
- Un evento repetido del proveedor se rechaza por `(provider, event_key)`.
- Firma inválida o ausente: **401**, y el evento no se registra —así un
  atacante no puede llenar la tabla—.

## Verificaciones sobre la aplicación corriendo

Con `NEXT_PUBLIC_SUPABASE_URL` configurada y **sin sesión**, las nueve rutas
del panel devuelven 307 a `/admin/login` y el cuerpo no contiene ninguno de los
textos protegidos: el HTML no llega a generarse.

Intentos de bypass por cabecera, todos rechazados con 307:

| Cabecera | Resultado |
| --- | --- |
| `x-pathname: /admin/login` | 307 · el middleware la sobrescribe |
| `x-invoke-path: /admin/login` | 307 · ya no se lee |
| `x-middleware-subrequest: 1` | 307 · y cada página exige sesión por su cuenta |

### Secretos

Se compiló con valores canario en las tres variables privadas y se buscó cada
uno en la salida:

| Valor | `.next/static/` | Resto del build |
| --- | --- | --- |
| `SUPABASE_SECRET_KEY` | 0 | 0 |
| `MERCADO_PAGO_ACCESS_TOKEN` | 0 | 0 |
| `MERCADO_PAGO_WEBHOOK_SECRET` | 0 | 0 |
| Clave publicable (control) | 0 | sólo `.next/server/` |

Los tres secretos se leen de `process.env` en tiempo de ejecución y no quedan
incrustados en ningún artefacto. La clave publicable aparece únicamente en
chunks de servidor. Ningún componente `'use client'` importa un módulo con
`server-only`.

## Responsive y accesibilidad

`scripts/qa-capturas.mjs` recorre seis pantallas en cuatro anchos y deja 24
capturas en `docs/qa/`.

| Ancho | Scroll horizontal | Áreas táctiles < 44px | Errores de consola |
| --- | --- | --- | --- |
| 390 × 844 | ninguno | ninguna | ninguno |
| 768 × 1024 | ninguno | ninguna | ninguno |
| 1440 × 900 | ninguno | — | ninguno |
| 1920 × 1080 | ninguno | — | ninguno |

La regla de 44px se exige sólo hasta 768px: más ancho son objetivos de mouse.
El script mide el `<label>` cuando el control está dentro de uno, porque el
patrón accesible deja el radio en 1×1 y agranda la etiqueta; medir el input
daba nueve falsos positivos por página.

## Modo demo

Sin variables de Supabase:

- El storefront sirve los fixtures de `src/content/` con su diseño e imágenes
  intactos.
- El panel dice `Falta configurar NEXT_PUBLIC_SUPABASE_URL` en todas sus rutas.
  No muestra un panel operativo vacío ni finge un guardado.
- El checkout ofrece WhatsApp y no ofrece pago online.

## Lo que NO se pudo verificar

Ninguna de estas cosas está simulada. Están pendientes y hay que hacerlas.

| Qué | Por qué | Cómo validarlo |
| --- | --- | --- |
| Panel autenticado | Supabase Auth es un servicio aparte; sin proyecto real no hay sesión posible y `exigirAdmin()` redirige antes de renderizar. No hay capturas del panel por dentro. | Crear el proyecto, seguir `ADMIN_BOOTSTRAP.md`, entrar y volver a correr `qa-capturas.mjs` con las rutas internas. |
| Login, recuperación, sesión vencida, retorno post-login | Íd. | Íd. |
| Subida a Storage, límite de tamaño y lista de MIME | Storage es un servicio aparte. Las políticas SQL sí se probaron; la subida real no. | Subir un `.svg` y un archivo de 11 MB: los dos deben ser rechazados. |
| Borrado del objeto en Storage al eliminar un medio | Íd. | Borrar un medio sin uso y confirmar que el objeto desaparece del bucket. |
| Webhook con tráfico real de Mercado Pago | Sin credenciales; `api.mercadopago.com` está bloqueada desde este entorno. Firma, frescura, idempotencia y estados desconocidos están cubiertos por pruebas unitarias. | Credenciales `TEST-`, un pago de prueba, y confirmar que el pedido pasa a `confirmed` y queda una fila en `payments`. |
| Migraciones sobre una base remota | No se aplicó ninguna migración a producción, y no se hará sin confirmación explícita. | `supabase db push` contra un proyecto de staging primero. |

## Dependencias

`npm audit --omit=dev` reporta **3 vulnerabilidades altas**, todas transitivas
de Next 15: `postcss` (cuatro avisos de XSS y lectura de archivos vía
`sourceMappingURL`) y `sharp` (libvips). La única corrección disponible es
Next 16, que es un cambio mayor.

No se aplicó: queda fuera del alcance de esta auditoría y merece su propia
rama con su propia verificación del storefront. Ambas afectan a herramientas de
build, no al servidor en producción, pero hay que subirlo.
