-- ============================================================================
-- 0006 · Buckets y políticas de Storage
--
-- Dos buckets:
--   · `media`   público en lectura — es lo que sirve el storefront.
--   · `private` sin lectura pública — comprobantes y material sin publicar.
--
-- Escritura, sustitución y borrado: sólo administradores activos.
--
-- `storage` lo administra Supabase: acá no se crea ni se altera el esquema ni
-- sus tablas. Sólo se declaran buckets y políticas sobre `storage.objects`,
-- que es la vía documentada. Todo es idempotente para poder reaplicarlo.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4']),
  ('private', 'private', false, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── Lectura ────────────────────────────────────────────────────────────────
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "private_admin_read" on storage.objects;
create policy "private_admin_read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'private' and public.is_active_admin());

-- ── Escritura ──────────────────────────────────────────────────────────────
drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('media', 'private') and public.is_active_admin());

drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('media', 'private') and public.is_active_admin())
  with check (bucket_id in ('media', 'private') and public.is_active_admin());

drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('media', 'private') and public.is_active_admin());
