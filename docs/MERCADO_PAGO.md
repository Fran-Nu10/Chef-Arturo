# Mercado Pago · Checkout Pro

## Modos

| Modo | Cuándo | Qué pasa |
| --- | --- | --- |
| `deshabilitado` | Sin `MERCADO_PAGO_ACCESS_TOKEN` | El checkout online no se ofrece. El panel lo muestra como «pendiente de configuración». Queda WhatsApp |
| `prueba` | Token que empieza con `TEST-` | Funciona completo, pero los cobros no son reales. El panel lo avisa |
| `produccion` | Token de producción | Cobros reales |

El modo se deduce del prefijo del token. Saberlo evita el peor error posible:
creer que se está cobrando cuando se está en sandbox.

**Sin credenciales nunca se simula un pago aprobado.** Un pedido puede quedar
pendiente, pero jamás aparece como pagado sin que el proveedor lo confirme.

## Configuración

### 1 · Credenciales

Panel de Mercado Pago → **Tus integraciones** → tu aplicación → **Credenciales**.

```env
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
```

Para probar, usá las credenciales de prueba (`TEST-...`) y un usuario de
prueba. Nunca pongas el token en el repositorio.

### 2 · Webhook

En **Notificaciones → Webhooks**, configurá:

```
https://TU-DOMINIO/api/pagos/mercadopago/webhook
```

Evento: **Pagos**. Mercado Pago genera una **clave secreta**: copiala a

```env
MERCADO_PAGO_WEBHOOK_SECRET=...
```

Sin esa clave el webhook rechaza todo con 401. Es lo correcto: sin firma
verificable, cualquiera podría aprobar pedidos con un POST.

### 3 · URL del sitio

```env
NEXT_PUBLIC_SITE_URL=https://tu-dominio
```

Se usa para las URLs de retorno y para la de notificación. Sin barra final.

## Cómo funciona

### Crear la preferencia

Sólo desde el servidor, una por pedido:

- `external_reference` = id interno del pedido. Es lo que ata la notificación
  con nuestra fila.
- `X-Idempotency-Key: pedido-<id>` — un reintento de red no genera dos
  preferencias.
- Los importes llegan ya calculados por la base. La preferencia no deriva
  ningún precio de algo que venga del navegador.

Se guarda `provider_preference_id` en `payments`, con estado `pending`.

### Recibir la notificación

`src/app/api/pagos/mercadopago/webhook/route.ts`, en este orden:

1. **Firma.** HMAC-SHA256 sobre
   `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`, comparada en tiempo
   constante. Inválida → 401 sin registrar nada.
2. **Idempotencia.** Se inserta en `payment_events` con clave única
   `(provider, event_key)`. Si ya existía → 200 y termina. Mercado Pago
   reintenta la misma notificación varias veces.
3. **Consulta al proveedor.** Del cuerpo recibido sólo se toma el id; el estado
   se pregunta con `GET /v1/payments/{id}` autenticado.
4. **Control de importe.** Si el importe cobrado no coincide con el total del
   pedido, se registra el desvío y **no se aprueba**.
5. **Actualización.** Se hace upsert en `payments` y se actualiza
   `orders.payment_status`. Un pago aprobado confirma el pedido sólo si seguía
   `pending`: no pisa lo que un humano ya movió.

Los errores propios responden 200 con el detalle guardado en
`payment_events.error`, para que el proveedor no entre en un ciclo de
reintentos por una falla nuestra.

### Estados

| Mercado Pago | Nuestro |
| --- | --- |
| `approved`, `authorized` | `approved` |
| `rejected` | `rejected` |
| `cancelled` | `cancelled` |
| `refunded`, `charged_back` | `refunded` |
| `pending`, `in_process`, `in_mediation`, desconocido | `pending` |

Lo desconocido cae en `pending`, nunca en `approved`.

## Probar

1. Credenciales `TEST-`.
2. Usuario de prueba comprador desde el panel de Mercado Pago.
3. Pedido de punta a punta con las tarjetas de prueba.
4. Simulá el webhook desde el panel de Mercado Pago y verificá en
   `payment_events` que quedó registrado y procesado.
5. Reenviá la misma notificación: la segunda debe responder
   `{"recibido":true,"duplicado":true}` sin cambiar nada.

## Pendiente de verificar

El webhook nunca recibió una notificación real: la firma está probada con
vectores propios (`src/server/__tests__/mercadopago.test.ts`) pero no contra el
proveedor. Verificalo con el simulador antes de abrir al público.
