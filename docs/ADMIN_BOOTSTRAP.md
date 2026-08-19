# Crear el primer administrador

No hay registro público de administradores, y no debe haberlo: cualquiera que
pudiera darse de alta tendría acceso a los pedidos y a los datos de los
clientes. El primer dueño se crea a mano, una sola vez.

**No hay email ni contraseña en el repositorio.** Los elegís vos al ejecutar
estos pasos.

## Requisitos

- El proyecto Supabase creado y las migraciones aplicadas (`docs/BACKEND.md`).
- Acceso al panel de Supabase con permisos de administrador del proyecto.

## Paso 1 · Crear el usuario en Auth

En el panel de Supabase: **Authentication → Users → Add user → Create new user**.

- Email: el del dueño.
- Password: generala con un gestor de contraseñas. Mínimo 12 caracteres.
- Marcá **Auto Confirm User** para no depender del correo de confirmación.

Copiá el **UUID** que queda en la lista de usuarios.

## Paso 2 · Darle el rol

En **SQL Editor**, con el UUID del paso anterior:

```sql
insert into public.admin_users (id, role, is_active, display_name)
values ('PEGA-ACÁ-EL-UUID', 'owner', true, 'Nombre del dueño');
```

Esa fila es la que autoriza. El rol vive acá y no en
`auth.users.raw_user_meta_data` porque esa metadata la puede editar el propio
usuario desde el cliente: sería como dejar que cada uno se firme su credencial.

## Paso 3 · Comprobar

```sql
select a.id, u.email, a.role, a.is_active
from public.admin_users a
join auth.users u on u.id = a.id;
```

Entrá a `/admin/login` con ese email. Si el rol no está o `is_active` es
`false`, el panel cierra la sesión y avisa; no deja una sesión a medias.

## Altas siguientes

Una vez que existe un dueño, las demás cuentas se crean igual (paso 1) y el
dueño ejecuta el paso 2 con `role = 'staff'`. Las políticas sólo dejan escribir
en `admin_users` a un `owner` activo.

## Dar de baja a alguien

```sql
update public.admin_users set is_active = false where id = 'UUID';
```

Preferí desactivar antes que borrar: la fila sigue explicando quién hizo cada
cambio en el historial de pedidos. Si además querés revocar el acceso de
inmediato, borrá también las sesiones del usuario desde **Authentication →
Users**.

## Si perdés el acceso

Con acceso al panel de Supabase siempre podés reactivar o crear una cuenta con
los pasos de arriba. Si perdiste también ese acceso, no hay puerta trasera en
la aplicación: es deliberado.
