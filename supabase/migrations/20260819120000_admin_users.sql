-- ============================================================================
-- 0001 · Administradores y helpers de autorización
--
-- No existe registro público de administradores: las filas de `admin_users`
-- las crea un humano con la clave de servicio (ver docs/ADMIN_BOOTSTRAP.md).
-- El rol vive en esta tabla y NO en `auth.users.raw_user_meta_data`, porque
-- esa metadata es editable por el propio usuario y no sirve para autorizar.
-- ============================================================================

create extension if not exists "pgcrypto";

create type public.admin_role as enum ('owner', 'staff');

create table public.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.admin_role not null default 'staff',
  is_active boolean not null default true,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Administradores del panel. La pertenencia y el rol se gestionan fuera de la aplicación.';

-- ── Helpers de autorización ────────────────────────────────────────────────
--
-- Son SECURITY DEFINER a propósito. Las políticas de casi todas las tablas
-- preguntan "¿quien llama es admin activo?", y esa pregunta se responde
-- leyendo `admin_users`, que a su vez tiene RLS. Si el helper corriera como
-- INVOKER, evaluar la política de `admin_users` volvería a invocar el helper:
-- recursión infinita. Como DEFINER corre con el dueño de la función, que no
-- está sujeto a RLS, y la recursión se corta.
--
-- Contrapartida: la función salta RLS, así que no recibe parámetros del
-- cliente, no hace nada más que un SELECT acotado a auth.uid(), y fija
-- `search_path` para que nadie pueda anteponer un esquema con una tabla
-- `admin_users` falsa.

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.id = auth.uid()
      and a.is_active
  );
$$;

create or replace function public.admin_role()
returns public.admin_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select a.role
  from public.admin_users a
  where a.id = auth.uid()
    and a.is_active;
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.admin_role() = 'owner'::public.admin_role;
$$;

revoke all on function public.is_active_admin() from public;
revoke all on function public.admin_role() from public;
revoke all on function public.is_owner() from public;
grant execute on function public.is_active_admin() to authenticated;
grant execute on function public.admin_role() to authenticated;
grant execute on function public.is_owner() to authenticated;

-- ── Marca de tiempo compartida ─────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger admin_users_touch
  before update on public.admin_users
  for each row execute function public.touch_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.admin_users enable row level security;

-- Un admin activo ve la lista de admins; sólo el dueño la modifica. Ningún
-- rol público llega hasta acá.
create policy admin_users_select on public.admin_users
  for select to authenticated
  using (public.is_active_admin());

create policy admin_users_write on public.admin_users
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());
