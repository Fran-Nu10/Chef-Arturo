-- ============================================================================
-- 0008 · Quitarle al público el EXECUTE que Supabase concede por defecto
--
-- Las migraciones anteriores hacían `revoke all on function ... from public`
-- creyendo que con eso alcanzaba. No alcanza.
--
-- Supabase deja configurado, sobre el esquema `public`:
--
--     alter default privileges in schema public
--       grant all on functions to anon, authenticated, service_role;
--
-- O sea que cada función nueva nace con un GRANT **explícito** a `anon` y a
-- `authenticated`. Revocar de `public` (el pseudo-rol) no toca esos grants,
-- así que las nueve funciones quedaron publicadas en `/rest/v1/rpc/…`.
--
-- No se detectó en las pruebas locales porque un PostgreSQL a secas no trae
-- esos privilegios por defecto: es una diferencia real entre el entorno de
-- pruebas y Supabase. Lo levantó el linter del proyecto.
--
-- Impacto real: bajo pero innecesario. Los helpers devuelven falso o nulo sin
-- sesión, y las funciones de trigger fallan si se las llama directamente. Aun
-- así, nada de esto tiene por qué estar expuesto.
-- ============================================================================

-- ── Funciones de trigger: no las llama nadie, las dispara la base ───────────
-- Postgres comprueba EXECUTE al crear el trigger, no al dispararlo, así que
-- revocar no rompe nada.
-- `from public` además de los roles: en Postgres toda función nace con
-- EXECUTE para el pseudo-rol PUBLIC, y revocar sólo de `anon` deja esa vía
-- abierta. Hacen falta las dos cosas, y en el primer intento faltaba ésta.
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.log_order_status_change() from public, anon, authenticated;
revoke execute on function public.prevent_delete_sold_product() from public, anon, authenticated;
revoke execute on function public.restore_stock_on_cancel() from public, anon, authenticated;

-- ── Helpers de autorización ────────────────────────────────────────────────
-- `authenticated` sí los necesita: las políticas RLS se evalúan con los
-- privilegios de quien consulta, así que sin EXECUTE fallaría toda la lectura
-- del panel. `anon` no los necesita — ninguna política suya llama funciones.
revoke execute on function public.is_active_admin() from anon;
revoke execute on function public.is_owner() from anon;

-- `admin_role()` no lo llama ni la aplicación ni ninguna política: sólo
-- `is_owner()`, que es SECURITY DEFINER y corre como su dueño.
revoke execute on function public.admin_role() from anon, authenticated;

-- ── Uso de medios ──────────────────────────────────────────────────────────
-- La consulta el panel antes de borrar un archivo. Es del administrador.
revoke execute on function public.media_asset_usage(uuid) from public, anon;
grant execute on function public.media_asset_usage(uuid) to authenticated;

-- ── Lo que sí queda público ────────────────────────────────────────────────
-- `create_public_order` sigue siendo ejecutable por `anon`: es la puerta del
-- checkout, la única vía por la que un visitante sin sesión puede crear un
-- pedido, y valida todo lo que recibe. Está en la migración 0005.
