# Seguridad

## Principio

El cliente propone, el servidor dispone. Nada que venga del navegador se toma
como verdad: ni el precio, ni el total, ni el estado del pago, ni el rol del
usuario.

## Row Level Security

RLS está activo en **todas** las tablas expuestas. Lo que no tiene política
para un rol, ese rol no lo ve ni lo toca.

| Tabla | Anónimo | Autenticado sin rol | Staff | Owner |
| --- | --- | --- | --- | --- |
| `categories` | lee las activas | igual | todo | todo |
| `products` | lee los activos | igual | todo | todo |
| `product_images` | lee las de productos activos | igual | todo | todo |
| `media_assets` | lee el bucket `media` | igual | todo | todo |
| `site_sections` | lee habilitadas y publicadas | igual | todo | todo |
| `site_settings` | lee | lee | lee | escribe |
| `customers` | — | — | todo | todo |
| `orders` | — | — | todo | todo |
| `order_items` | — | — | todo | todo |
| `order_status_history` | — | — | lee e inserta | igual |
| `payments` | — | — | **sólo lee** | **sólo lee** |
| `payment_events` | — | — | — | — |
| `admin_users` | — | — | lee | escribe |

Tres garantías que conviene enunciar aparte:

1. **Nadie aprueba un pago desde el navegador.** `payments` no tiene política
   de escritura para ningún rol autenticado. Sólo la toca el webhook, que corre
   en el servidor con la clave de servicio.
2. **Nadie cambia el total de un pedido desde el cliente.** El comprador no
   puede escribir en `orders`; el administrador sólo ajusta envío y descuento,
   y el total se recalcula desde las líneas guardadas.
3. **Nadie se auto-promueve.** `admin_users` sólo la escribe un `owner` activo.

### Funciones `security definer`

`is_active_admin()`, `admin_role()`, `is_owner()` y `create_public_order()` son
`SECURITY DEFINER`. Se justifica en cada caso:

**Los tres helpers de rol.** Casi todas las políticas preguntan «¿quien llama
es admin activo?», y responder eso implica leer `admin_users`, que también
tiene RLS. Si corrieran como `INVOKER`, evaluar la política de `admin_users`
volvería a invocar el helper: recursión infinita. Como `DEFINER` corren con el
dueño de la función, que no está sujeto a RLS, y la recursión se corta.

Mitigaciones: no reciben parámetros del cliente, no hacen más que un `SELECT`
acotado a `auth.uid()`, tienen `SET search_path = public, pg_temp` para que
nadie pueda anteponer un esquema con una tabla `admin_users` falsa, y el
`EXECUTE` está revocado de `public` y concedido sólo a `authenticated`.

**`create_public_order`.** Necesita insertar en tablas que `anon` no puede
tocar. Por eso hace de aduana: sólo acepta `(product_id, quantity)`, relee el
precio de la tabla `products` filtrando por `status = 'active'`, calcula
subtotal y total, fuerza los estados a pendiente, valida cantidad mínima y
stock, y corre entera en una transacción. Rechaza métodos de pago que el
comprador no puede elegir —no se puede crear un pedido declarando que ya se
pagó— y limita el número de líneas.

### Sin recursión en las políticas

Ninguna política consulta la misma tabla que protege salvo a través de un
helper `SECURITY DEFINER`. Es la única forma de tener políticas basadas en rol
sin caer en recursión.

## Storage

- `media`: lectura pública. Es lo que sirve el storefront.
- `private`: sin lectura pública; sólo administradores activos.
- Escritura, sustitución y borrado en ambos: sólo administradores activos.
- Límite de 10 MB y lista blanca de MIME. `image/svg+xml` está excluido a
  propósito: un SVG es un documento ejecutable.

## Secretos

`SUPABASE_SECRET_KEY`, `MERCADO_PAGO_ACCESS_TOKEN` y
`MERCADO_PAGO_WEBHOOK_SECRET` no llevan prefijo `NEXT_PUBLIC_` y sólo se leen
desde módulos marcados con `server-only`, lo que rompe el build si alguien los
importa desde un componente cliente.

En el repositorio no hay ninguna credencial: `.env.example` sólo tiene los
nombres, y `.env*` está en `.gitignore`.

## Autenticación

- Sin registro público de administradores.
- El rol se relee de `admin_users` en cada petición; no se confía en el JWT ni
  en la metadata del usuario, que el propio usuario puede editar.
- La protección de `/admin` es server-side y ocurre antes de renderizar: sin
  sesión administrativa el HTML del panel **no llega a generarse** (verificado:
  la respuesta de `/admin` sin sesión no contiene ningún dato del panel).
- El login responde lo mismo ante email inexistente y contraseña equivocada,
  para no permitir enumerar cuentas. La recuperación de contraseña responde
  siempre igual, por lo mismo.
- Si el usuario existe en `auth` pero no es administrador activo, se cierra la
  sesión antes de responder: no queda una sesión válida colgando.

## Webhook de pagos

1. Verificar la firma HMAC-SHA256 con comparación en **tiempo constante**
   (`timingSafeEqual`): un `===` filtra información por lo que tarda en fallar.
   Una firma inválida corta antes de registrar nada, para que nadie pueda
   llenar la tabla de eventos.
2. Registrar el evento con clave única. Un duplicado responde 200 y termina.
3. Consultar el pago al proveedor con una llamada autenticada. **Nunca se cree
   el cuerpo recibido**: sólo se toma el id.
4. Comparar el importe cobrado con el del pedido. Si no coinciden, se registra
   y no se aprueba.
5. Recién ahí actualizar. Un pago aprobado confirma el pedido sólo si seguía
   pendiente: no pisa lo que un humano ya movió.

## Validación

Zod en todos los límites: formularios, parámetros de URL y webhook. Los
formatos de `slug`, teléfono y MIME se validan en la aplicación y además con
`CHECK` en la base, para que también valgan si alguien opera por SQL.

Los destinos de CTA del CMS salen de una lista cerrada. Un campo de URL libre
en un CMS es una puerta abierta a `javascript:` y a redirecciones a terceros.

## Pruebas

`supabase/tests/01_rls.sql` — 48 aserciones contra un PostgreSQL real,
cubriendo anónimo, autenticado sin permisos, administrador inactivo, staff y
owner. Se ejecutan con `npm run db:test`.

## Riesgos pendientes

| Riesgo | Estado |
| --- | --- |
| Las políticas nunca se ejercitaron contra un proyecto Supabase real | Probadas contra PostgreSQL 16 con un shim del esquema `auth`. Volver a correrlas con `supabase db reset` antes de producción |
| El webhook nunca recibió una notificación real de Mercado Pago | La firma está probada con vectores propios. Verificar contra el simulador del panel de Mercado Pago |
| Sin limitación de tasa en el checkout público | `create_public_order` es la única puerta y valida todo, pero nada impide crear muchos pedidos. Agregar rate limiting en el borde antes de abrir al público |
| Sin captcha en el checkout | Mismo motivo |
| El bucket `media` es de lectura pública | Es lo previsto: son las fotos del catálogo. Nada sensible debe ir ahí |
| Rotación de credenciales | Sin procedimiento definido. Ver `docs/DEPLOYMENT.md` |


## Los privilegios por defecto de Supabase sobre funciones

Al conectar el proyecto real apareció algo que las pruebas locales no podían
detectar. Supabase deja configurado, sobre el esquema `public`:

```sql
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
```

O sea que **cada función nueva nace con un GRANT explícito a `anon`**. Las
migraciones hacían `revoke all on function ... from public`, que revoca del
pseudo-rol `PUBLIC` pero no toca ese grant explícito. Resultado: las nueve
funciones quedaron publicadas en `/rest/v1/rpc/…`, incluidas las de trigger.

Un PostgreSQL a secas no trae esos privilegios por defecto, así que el shim de
`supabase/tests/` no lo reproducía y la suite local pasaba en verde. Lo levantó
el linter del propio proyecto Supabase.

**Impacto real: bajo.** Los helpers devuelven falso o nulo sin sesión, y una
función de trigger llamada directamente falla. Pero no hay motivo para tenerlas
expuestas.

La migración `0008` lo corrige revocando de `public` **y** de los roles. Ésta
es la matriz que queda, y conviene comprobarla después de agregar cualquier
función nueva:

| Función | `anon` | `authenticated` |
| --- | --- | --- |
| `create_public_order` | ✅ | ✅ |
| `is_active_admin` | ❌ | ✅ |
| `is_owner` | ❌ | ✅ |
| `admin_role` | ❌ | ❌ |
| `media_asset_usage` | ❌ | ✅ |
| `touch_updated_at` | ❌ | ❌ |
| `log_order_status_change` | ❌ | ❌ |
| `prevent_delete_sold_product` | ❌ | ❌ |
| `restore_stock_on_cancel` | ❌ | ❌ |

`create_public_order` es la única deliberadamente pública: es la puerta del
checkout y valida todo lo que recibe.

`authenticated` necesita `is_active_admin()` e `is_owner()` porque las
políticas RLS se evalúan con los privilegios de quien consulta: sin EXECUTE
fallaría toda la lectura del panel.

Comprobación:

```sql
select p.proname,
       has_function_privilege('anon', p.oid, 'execute') as anon,
       has_function_privilege('authenticated', p.oid, 'execute') as autenticado
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' order by p.proname;
```
