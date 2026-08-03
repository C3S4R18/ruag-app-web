-- Amplía tipo_personal para separar también a ARUG y CG.
--
-- Antes: 'obrero' | 'staff'.  Ahora: 'obrero' | 'staff' | 'arug' | 'cg'.
-- Todo lo que no sea 'obrero' tiene los documentos liberados (DNI, Certiadulto
-- y Carnet RETCC dejan de ser obligatorios) — misma regla que ya usaba staff,
-- aplicada en FichaForm.tsx (web) y WorkerFormScreen.kt (Android).
--
-- Ejecutar en el SQL editor de Supabase ANTES de usar los botones
-- "A ARUG" / "A CG"; sin esto el update falla con check violation.

-- 1. Quita los CHECK viejos (nombre autogenerado, lo buscamos por definición).
do $$
declare c record;
begin
  for c in
    select conrelid::regclass as tbl, conname
    from pg_constraint
    where conrelid in ('public.fichas'::regclass, 'public.profiles'::regclass)
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%tipo_personal%'
  loop
    execute format('alter table %s drop constraint %I', c.tbl, c.conname);
  end loop;
end $$;

-- 2. Vuelve a ponerlos con los cuatro valores.
alter table public.fichas
  add constraint fichas_tipo_personal_check
  check (tipo_personal = any (array['obrero'::text, 'staff'::text, 'arug'::text, 'cg'::text]));

alter table public.profiles
  add constraint profiles_tipo_personal_check
  check (tipo_personal = any (array['obrero'::text, 'staff'::text, 'arug'::text, 'cg'::text]));

-- 3. Índices: las vistas del admin filtran siempre por esta columna.
create index if not exists fichas_tipo_personal_idx on public.fichas (tipo_personal);
create index if not exists profiles_tipo_personal_idx on public.profiles (tipo_personal);
