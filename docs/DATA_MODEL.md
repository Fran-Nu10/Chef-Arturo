# Modelo de datos

Las migraciones versionadas están en `supabase/migrations/`, en orden de
aplicación. Se aplican de cero sobre una base vacía; el orden importa.

Todos los importes se guardan en **centésimos enteros** (`*_cents`). Nunca en
coma flotante: `0.1 + 0.2` no da `0.3` y ese error se acumula en cada línea de
cada pedido. La moneda es `UYU` y hay un `CHECK` que lo obliga.

## Administración

### `admin_users`
| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | FK a `auth.users`, `on delete cascade` |
| `role` | `admin_role` | `owner` \| `staff` |
| `is_active` | `boolean` | Desactivar en vez de borrar conserva el historial |
| `display_name` | `text` | |
| `created_at` / `updated_at` | `timestamptz` | |

## Catálogo

### `media_assets`
Todo archivo vive en Supabase Storage. Si se importa material autorizado de un
banco externo se **copia al bucket** y se guarda su procedencia: no queda un
hotlink permanente contra un dominio de terceros.

Campos de procedencia: `source`, `source_url`, `credit`, `license`,
`is_temporary`. Los técnicos: `bucket`, `path`, `mime_type`, `width`, `height`,
`bytes`, `alt`.

### `categories`
`slug` único con formato validado, `name`, `description`, `position`,
`is_active`, `image_id`, SEO.

### `products`
| Grupo | Columnas |
| --- | --- |
| Identidad | `slug` único, `name`, `category_id`, `short_description`, `full_description` |
| Precio | `price_cents` (nullable), `currency` |
| Estado | `status` (`draft`/`active`/`archived`), `sale_mode` (`direct`/`preorder`/`quote`), `is_featured`, `position` |
| Stock | `track_stock`, `stock_quantity`, `low_stock_threshold` |
| Comercial | `lead_time_days`, `min_quantity`, `fulfillment` |
| SEO | `seo_title`, `seo_description` |
| Fechas | `created_at`, `updated_at`, `archived_at` |

Dos reglas viven en la base, no sólo en la aplicación:

- `products_direct_needs_price`: un producto de compra directa necesita precio.
  Sin él no se puede cobrar.
- Trigger `products_no_delete_if_sold`: un producto que ya figura en un pedido
  **no puede borrarse**, ni con la clave de servicio. Se archiva.

### `product_images`
`product_id`, `media_id`, `alt`, `position`, `is_primary`. Un índice único
parcial garantiza **una sola imagen principal por producto**.

## Contenido

### `site_sections`
Un registro por sección de la home, con clave estable. Guarda `draft` y
`published` por separado: el storefront lee sólo `published`. `media_ids` lista
los archivos que usa, para poder responder «¿esta imagen está en uso?» sin
recorrer el JSON.

El contenido se valida contra un esquema Zod por clave
(`src/server/contenido/esquemas.ts`). No es un page builder y no acepta HTML.

### `site_settings`
Clave/valor tipado. Datos del negocio, **nunca secretos**: las credenciales van
en variables de entorno del servidor.

## Pedidos

### `customers`
`phone` normalizado a dígitos con índice único: es la clave natural y evita el
duplicado evidente. `first_order_at` y `last_order_at` se actualizan solas.

### `orders`
Número legible (`CA-1000`, de una secuencia), cliente, estados, importes
calculados por el servidor, fecha y franja pedidas, retiro o entrega,
dirección, comentarios del cliente y notas internas.

Estados del pedido: `pending` → `confirmed` → `preparing` → `ready` →
`completed`, más `cancelled` desde cualquiera. Estados de pago: `pending`,
`approved`, `rejected`, `cancelled`, `refunded`.

`orders_delivery_needs_address` obliga a que una entrega a domicilio tenga
dirección.

### `order_items`
Guardan un **snapshot**: `product_name`, `product_slug`, `unit_price_cents`,
`sale_mode`. Si mañana cambia el precio o el nombre del producto, el pedido
histórico sigue diciendo qué se compró y a cuánto.

### `order_status_history`
Lo escribe un trigger en cada cambio de estado, venga de donde venga. El
operador puede sumar una nota con el motivo.

### `payments`
Un registro por intento de cobro. `provider_preference_id` y
`provider_payment_id`, con índice único sobre el segundo.

### `payment_events`
Bitácora técnica del webhook. La unicidad de `(provider, event_key)` es lo que
da **idempotencia**: Mercado Pago reintenta la misma notificación varias veces
y no puede provocar efectos repetidos. No guarda secretos.

## Funciones

| Función | Para qué |
| --- | --- |
| `is_active_admin()` · `admin_role()` · `is_owner()` | Autorización en las políticas. `SECURITY DEFINER` con `search_path` fijado |
| `touch_updated_at()` | Trigger de marca de tiempo |
| `create_public_order(...)` | La única puerta por la que `anon` escribe un pedido |
| `media_asset_usage(uuid)` | Dónde se usa un archivo, antes de ofrecer borrarlo |
| `log_order_status_change()` | Historial automático |
| `prevent_delete_sold_product()` | Guardia de borrado |

## Diagrama de relaciones

```
auth.users ──1:1── admin_users
                     │
media_assets ──┬── product_images ──── products ──── categories
               └── categories.image_id                  │
                                                        │
customers ──1:N── orders ──1:N── order_items ───────────┘
                    ├──1:N── order_status_history
                    └──1:N── payments

site_sections   site_settings   payment_events   (independientes)
```
