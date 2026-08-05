-- Tipo de documento de identidad en la ficha: DNI o Carnet de Extranjería.
--
-- El número siempre vive en fichas.dni (una sola columna, como ya lo hacía
-- la app). Esta columna sólo dice QUÉ documento es, para poder validarlo
-- distinto (DNI = 8 dígitos, CE = 6+ alfanumérico) y etiquetarlo bien en
-- los formatos impresos.
--
-- Hasta ahora el formulario web tenía el selector DNI/CE pero el valor se
-- perdía al recargar: nunca se guardaba en la base.

alter table public.fichas
  add column if not exists tipo_documento text not null default 'DNI';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.fichas'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%tipo_documento%'
  ) then
    alter table public.fichas
      add constraint fichas_tipo_documento_check
      check (tipo_documento in ('DNI', 'CE'));
  end if;
end $$;
