# Despliegue

## Antes de la primera vez

1. Proyecto Supabase creado y migraciones aplicadas (`docs/BACKEND.md`).
2. Buckets `media` y `private` con sus políticas.
3. Primer dueño creado (`docs/ADMIN_BOOTSTRAP.md`).
4. Mercado Pago configurado, o asumido como pendiente (`docs/MERCADO_PAGO.md`).

## Variables en el hosting

Cargá las seis de `.env.example` en el panel del hosting. Las tres sin prefijo
`NEXT_PUBLIC_` deben quedar marcadas como secretas y **no** disponibles en el
cliente.

`NEXT_PUBLIC_SITE_URL` tiene que ser la URL pública real: de ahí salen las URLs
de retorno de Mercado Pago y la de notificación del webhook.

## Verificación antes de publicar

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

Y contra la base:

```bash
npm run db:test
```

## Migraciones en producción

**No apliques migraciones a producción sin confirmación explícita.**

Procedimiento:

1. Backup a demanda desde el panel de Supabase (**Database → Backups**).
2. Aplicar primero en un proyecto de staging con datos parecidos.
3. Revisar el SQL: buscar `drop`, `alter ... type`, `not null` sobre tablas con
   datos. Todo eso puede perder información.
4. Aplicar en una ventana de bajo tráfico.
5. Verificar con `npm run db:test` apuntando a staging, nunca a producción.

Las migraciones actuales son todas aditivas: crean tipos, tablas, funciones y
políticas. Ninguna borra ni transforma datos existentes.

## Backups

Supabase hace backups automáticos según el plan. Además:

- Backup a demanda antes de cada migración.
- Exportar `orders`, `order_items`, `customers` y `payments` con periodicidad
  propia: es la información que no se puede reconstruir.
- Los archivos de Storage **no** entran en el backup de la base. Copialos
  aparte.

## Rollback

**De la aplicación:** volver al despliegue anterior desde el hosting. El
storefront y el panel son compatibles hacia atrás mientras el esquema no cambie.

**De una migración:** no hay `down` automático. Si algo sale mal:

1. Restaurar el backup previo (Database → Backups → Restore). Se pierde lo
   escrito desde el backup: confirmalo con el dueño antes.
2. O escribir una migración correctiva hacia adelante, que suele ser preferible
   con pedidos en curso.

**De un despliegue con credenciales comprometidas:**

1. Rotar la clave en el proveedor (Supabase: Settings → API → Reset;
   Mercado Pago: regenerar el token).
2. Actualizar la variable en el hosting y redesplegar.
3. Revisar `payment_events` en busca de actividad extraña.

Si se rota `SUPABASE_SECRET_KEY`, el webhook deja de funcionar hasta que se
actualice la variable: los pagos quedan pendientes, no se pierden.

## Después de publicar

- `/admin/login` responde y permite entrar con el dueño.
- Un pedido de prueba entra y aparece en el panel.
- El webhook responde 200 en `GET /api/pagos/mercadopago/webhook`.
- El storefront muestra los productos activos.

## Riesgos pendientes

- Sin limitación de tasa ni captcha en el checkout público.
- El webhook no se verificó contra una notificación real de Mercado Pago.
- Las políticas de RLS se probaron contra PostgreSQL con un shim del esquema
  `auth`, no contra un proyecto Supabase real.
