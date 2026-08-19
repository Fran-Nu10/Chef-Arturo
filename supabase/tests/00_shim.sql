-- ============================================================================
-- Shim de Supabase para pruebas locales
--
-- Reproduce lo mínimo que las migraciones dan por sentado en un proyecto
-- Supabase real: el esquema `auth` con su tabla de usuarios y `auth.uid()`,
-- los roles `anon` / `authenticated` / `service_role`, y el esquema `storage`.
--
-- ESTE ARCHIVO NO ES UNA MIGRACIÓN. No se aplica al proyecto real, donde todo
-- esto ya existe y lo mantiene la plataforma. Vive en `supabase/tests/` para
-- poder correr las migraciones y las pruebas de RLS contra un Postgres común.
-- ============================================================================

create schema if not exists auth;
create schema if not exists storage;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- En Supabase, `auth.uid()` lee el claim `sub` del JWT que PostgREST deja en
-- `request.jwt.claims`. Se replica igual para que las políticas se prueben
-- con el mismo mecanismo que en producción.
-- Tolera que el ajuste no exista o venga vacío, igual que en Supabase: fuera
-- de una petición de PostgREST (por ejemplo, en un trigger disparado por la
-- clave de servicio) simplemente no hay usuario.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub',
    ''
  )::uuid;
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    'anon'
  );
$$;

-- ── Roles ──────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users to service_role;

-- Supabase concede los privilegios de tabla por defecto; RLS es lo que
-- después decide fila por fila. Se replica para que la prueba mida las
-- políticas y no un GRANT ausente.
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public
  grant all on tables to service_role;

-- ── Storage ────────────────────────────────────────────────────────────────
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz not null default now()
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null references storage.buckets (id),
  name text not null,
  owner uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects to anon, authenticated;
grant all on storage.objects, storage.buckets to service_role;
