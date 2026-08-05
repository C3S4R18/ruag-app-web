-- Bóveda de contraseñas generadas por el administrador.
--
-- Guarda SÓLO las contraseñas que el propio admin creó desde el panel
-- (alta de cuenta o "Nueva contraseña"), para que pueda volver a verlas
-- sin tener que restablecerlas otra vez.
--
-- Las contraseñas que el trabajador elige por su cuenta NO se guardan aquí:
-- Supabase sólo conserva su hash bcrypt y nadie puede leerlas.
--
-- SEGURIDAD:
--   · El valor va CIFRADO con AES-256-GCM. La llave vive en la variable de
--     entorno CREDENTIALS_SECRET, fuera de la base de datos. Una fuga de la
--     base sola no revela ninguna contraseña.
--   · RLS activo y SIN políticas: ningún usuario autenticado —ni siquiera un
--     admin con su token— puede leer esta tabla desde el cliente. Sólo el
--     service role, desde /api/admin/accesos, que primero verifica que quien
--     llama sea admin.

create table if not exists public.credenciales_admin (
  user_id uuid primary key,
  -- Contraseña cifrada (AES-256-GCM): iv, tag y texto cifrado en hex.
  iv text not null,
  tag text not null,
  secreto text not null,
  email text,
  creada_por uuid,
  creada_por_nombre text,
  created_at timestamptz not null default timezone('utc', now()),
  -- Momento en que se fijó, para detectar si el trabajador la cambió después.
  fijada_at timestamptz not null default timezone('utc', now())
);

alter table public.credenciales_admin enable row level security;

-- Sin policies a propósito: RLS activo sin reglas = nadie desde el cliente.
-- El service role ignora RLS y es el único camino de lectura.
revoke all on public.credenciales_admin from anon, authenticated;
