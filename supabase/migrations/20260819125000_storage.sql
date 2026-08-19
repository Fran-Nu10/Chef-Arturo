-- ============================================================================
-- 0006 · Buckets y políticas de Storage
--
-- Dos buckets:
--   · `media`   público en lectura — es lo que sirve el storefront.
--   · `private` sin lectura pública — comprobantes y material sin publicar.
--
-- Escritura, sustitución y borrado: sólo administradores activos.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4']),
  ('private', 'private', false, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'])
on conflict (id) do nothing;

-- ── Lectura ────────────────────────────────────────────────────────────────
create policy "media_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

create policy "private_admin_read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'private' and public.is_active_admin());

-- ── Escritura ──────────────────────────────────────────────────────────────
create policy "media_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('media', 'private') and public.is_active_admin());

create policy "media_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('media', 'private') and public.is_active_admin())
  with check (bucket_id in ('media', 'private') and public.is_active_admin());

create policy "media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('media', 'private') and public.is_active_admin());
