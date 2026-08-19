# Backend

Next.js 15 (App Router) + Supabase: PostgreSQL, Auth y Storage. Sin ORM: el
cliente de Supabase con tipos escritos a mano alcanza, y una capa más sería
peso sin beneficio para este tamaño.

## Arquitectura

```
src/
  lib/supabase/
    env.ts        lectura tipada del entorno · decide modo demo vs real
    cliente.ts    cliente de navegador (clave publicable, sujeto a RLS)
    servidor.ts   cliente de servidor + cliente de servicio (saltea RLS)
    tipos.ts      tipos de la base
  server/
    autorizacion.ts   sesión y rol; exigirAdmin / exigirOwner
    dinero.ts         centésimos enteros y cálculo de totales
    validacion.ts     esquemas Zod de los límites de entrada
    catalogo/         repositorio + acciones
    pedidos/          repositorio + acciones + checkout público
    contenido/        esquemas del CMS + repositorio + acciones
    pagos/            Mercado Pago
    reportes/         métricas
  middleware.ts   renovación de sesión
supabase/
  migrations/     migraciones versionadas
  tests/          shim de Supabase + pruebas de RLS
```

**Regla de capas:** ningún componente habla con Supabase directamente. Todo
pasa por un repositorio en `src/server/`.

## Modo demo

Sin `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`:

- La aplicación **compila y arranca** igual.
- El storefront público sigue mostrando los fixtures de `src/content/`.
- El panel **avisa qué variables faltan**. No muestra un panel operativo falso
  ni finge guardar nada.

Los repositorios devuelven `null` en modo demo y quien llama decide qué hacer.

## Puesta en marcha

### 1 · Crear el proyecto Supabase

En [supabase.com](https://supabase.com) → New project. Elegí la región más
cercana a Uruguay y guardá la contraseña de la base en un gestor.

### 2 · Variables de entorno

```bash
cp .env.example .env.local
```

| Variable | De dónde sale | Se expone al navegador |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL | sí |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Settings → API → anon/publishable | sí |
| `SUPABASE_SECRET_KEY` | Settings → API → service_role | **NO** |
| `MERCADO_PAGO_ACCESS_TOKEN` | Panel de Mercado Pago | **NO** |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Panel de Mercado Pago | **NO** |
| `NEXT_PUBLIC_SITE_URL` | La URL pública del sitio, sin barra final | sí |

`SUPABASE_SECRET_KEY` saltea RLS. Sólo la usan el webhook de pagos y el alta
del primer dueño. Nunca lleva prefijo `NEXT_PUBLIC_`.

### 3 · Migraciones

Con la CLI de Supabase:

```bash
npx supabase link --project-ref <ref-del-proyecto>
npx supabase db push
```

O pegando cada archivo de `supabase/migrations/` en el SQL Editor, **en orden
de nombre**. Están pensadas para aplicarse de cero sobre una base vacía.

> No apliques migraciones contra una base con datos sin revisar antes qué hace
> cada una y sin backup. Ver `docs/DEPLOYMENT.md`.

### 4 · Buckets de Storage

La migración `..._storage.sql` crea `media` (público) y `private` (privado) con
sus políticas. Si tu proyecto no permite insertar en `storage.buckets` desde
SQL, crealos a mano con esos nombres y esa visibilidad, y aplicá sólo las
políticas.

### 5 · Primer administrador

`docs/ADMIN_BOOTSTRAP.md`. No hay email ni contraseña en el repositorio.

### 6 · Mercado Pago

`docs/MERCADO_PAGO.md`. Es opcional: sin credenciales el checkout online
aparece como pendiente de configuración y queda WhatsApp.

## Definiciones del reporte

Importan porque se parecen y no son lo mismo:

- **Facturación bruta** — suma de los totales de todos los pedidos creados en
  el rango, cancelados incluidos. Mide demanda, no ingresos.
- **Ingresos aprobados** — suma de los totales de los pedidos cuyo pago está
  aprobado. Es la única cifra que representa dinero.
- **Pagos pendientes** — totales de pedidos cuyo pago no se resolvió.
- **Reembolsos** — totales con pago reembolsado.
- **Cancelados** — no cuentan como venta en ninguna métrica de ingreso.
- **Ticket promedio** — ingresos aprobados sobre cantidad de pedidos pagados.
  Sin pedidos pagados es cero, no una media inventada.
- **Productos más vendidos** — unidades de pedidos no cancelados, sin importar
  el estado del pago.

Esto no es contabilidad, ni un reporte fiscal, ni una conciliación bancaria.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test        # dominio (vitest)
npm run db:test     # migraciones + RLS contra PostgreSQL
npm run build
```

`npm run db:test` necesita un PostgreSQL alcanzable:

```bash
PGHOST=/tmp PGPORT=54322 PGUSER=postgres npm run db:test
```

Contra un Supabase local (`supabase start`), `supabase db reset` ya aplica las
migraciones y el shim sobra.
