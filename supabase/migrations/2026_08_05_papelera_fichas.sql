-- Papelera de fichas: recuperar trabajadores borrados por error.
--
-- Hasta ahora "Eliminar Fichas" hacía DELETE directo sobre public.fichas
-- y no había vuelta atrás. Ahora el borrado guarda primero una copia
-- completa de la fila (jsonb) aquí; desde el panel se puede restaurar.
--
-- Ejecutar en el SQL editor de Supabase.

-- ── Helper: ¿el usuario actual es admin? ────────────────────────────────
-- SECURITY DEFINER para que la consulta a profiles dentro de las policies
-- no quede bloqueada por el RLS de la propia tabla profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── Tabla papelera ──────────────────────────────────────────────────────
create table if not exists public.fichas_papelera (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid not null,
  user_id uuid,
  dni text,
  nombre_completo text,
  -- Copia íntegra de la fila de fichas al momento de borrar.
  snapshot jsonb not null,
  eliminado_por uuid,
  eliminado_por_nombre text,
  motivo text,
  created_at timestamptz not null default timezone('utc', now()),
  restaurado_at timestamptz,
  restaurado_por_nombre text
);

create index if not exists fichas_papelera_dni_idx on public.fichas_papelera (dni);
create index if not exists fichas_papelera_pendientes_idx
  on public.fichas_papelera (created_at desc)
  where restaurado_at is null;

-- ── RLS: sólo admins ────────────────────────────────────────────────────
alter table public.fichas_papelera enable row level security;

drop policy if exists "papelera_select_admin" on public.fichas_papelera;
create policy "papelera_select_admin" on public.fichas_papelera
  for select to authenticated using (public.is_admin());

drop policy if exists "papelera_insert_admin" on public.fichas_papelera;
create policy "papelera_insert_admin" on public.fichas_papelera
  for insert to authenticated with check (public.is_admin());

drop policy if exists "papelera_update_admin" on public.fichas_papelera;
create policy "papelera_update_admin" on public.fichas_papelera
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "papelera_delete_admin" on public.fichas_papelera;
create policy "papelera_delete_admin" on public.fichas_papelera
  for delete to authenticated using (public.is_admin());
