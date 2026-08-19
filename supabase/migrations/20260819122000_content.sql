-- ============================================================================
-- 0003 · CMS estructurado del sitio
--
-- No es un page builder. Cada sección tiene una clave fija y un contrato de
-- campos validado con Zod en el servidor (`src/server/content/schemas.ts`).
-- El administrador edita campos, nunca JSON crudo ni HTML arbitrario.
--
-- `draft` y `published` conviven: se edita el borrador y se publica cuando
-- está listo. El storefront lee sólo `published`.
-- ============================================================================

create table public.site_sections (
  id uuid primary key default gen_random_uuid(),
  -- Clave estable de la sección: 'hero', 'categorias', 'mostrador', …
  key text not null unique,
  is_enabled boolean not null default true,
  position integer not null default 0,
  -- Contenido validado contra el esquema Zod de esta clave.
  draft jsonb not null default '{}'::jsonb,
  published jsonb,
  -- Medios referenciados, como array de uuid en texto. Permite responder
  -- "¿esta imagen está en uso?" sin recorrer todas las formas del jsonb.
  media_ids jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_sections_key_format check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint site_sections_media_is_array check (jsonb_typeof(media_ids) = 'array')
);

create index site_sections_order_idx on public.site_sections (position);

create trigger site_sections_touch
  before update on public.site_sections
  for each row execute function public.touch_updated_at();

-- ── Ajustes generales ──────────────────────────────────────────────────────
-- Clave/valor tipado por Zod. Datos del negocio, no secretos: las claves de
-- API viven en variables de entorno del servidor, nunca en la base.
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint site_settings_key_format check (key ~ '^[a-z0-9_]+$')
);

create trigger site_settings_touch
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ── ¿Este medio está en uso? ───────────────────────────────────────────────
-- El panel la consulta antes de ofrecer el borrado de un archivo.
create or replace function public.media_asset_usage(p_media_id uuid)
returns table (usage_kind text, usage_id uuid, usage_label text)
language sql
stable
set search_path = public, pg_temp
as $$
  select 'product'::text, p.id, p.name
  from public.product_images pi
  join public.products p on p.id = pi.product_id
  where pi.media_id = p_media_id
  union all
  select 'category'::text, c.id, c.name
  from public.categories c
  where c.image_id = p_media_id
  union all
  select 'section'::text, s.id, s.key
  from public.site_sections s
  where s.media_ids @> to_jsonb(array[p_media_id::text]);
$$;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.site_sections enable row level security;
alter table public.site_settings enable row level security;

-- Público: sólo secciones habilitadas y ya publicadas. El borrador no sale.
create policy site_sections_public_read on public.site_sections
  for select to anon, authenticated
  using (is_enabled and published is not null);

create policy site_sections_admin_read on public.site_sections
  for select to authenticated using (public.is_active_admin());
create policy site_sections_admin_write on public.site_sections
  for all to authenticated
  using (public.is_active_admin()) with check (public.is_active_admin());

-- Los ajustes del sitio los lee el público (datos de contacto, horarios…)
-- pero sólo el dueño los cambia: son configuración crítica.
create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated using (true);
create policy site_settings_owner_write on public.site_settings
  for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- ── Semilla de secciones ───────────────────────────────────────────────────
-- Sólo las claves y el orden. El contenido lo carga el administrador o la
-- migración de fixtures; acá no se inventa ningún texto comercial.
insert into public.site_sections (key, position) values
  ('hero', 10),
  ('categorias', 20),
  ('mostrador', 30),
  ('detalle-final', 40),
  ('arma-tu-evento', 50),
  ('fechas-importantes', 60),
  ('formas-de-pedir', 70),
  ('la-mesa', 80),
  ('cta-final', 90),
  ('footer', 100)
on conflict (key) do nothing;
