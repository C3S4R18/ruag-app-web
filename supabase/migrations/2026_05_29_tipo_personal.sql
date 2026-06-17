-- =================================================================
-- Migración: rol de ficha "staff" (personal de oficina)
-- 2026-05-29 — No destructiva / idempotente.
--
-- tipo_personal define el TIPO DE FICHA que llena la persona en la app
-- móvil / portal del obrero:
--   'obrero' (default) → docs obligatorios (DNI, Certiadulto, RETCC)
--   'staff'            → docs libres, sin Carnet RETCC
--
-- Es independiente de profiles.role (que controla acceso al dashboard:
-- admin vs no-admin). Un admin puede tener role='admin' y
-- tipo_personal='staff' (entra al dashboard como admin, llena su ficha
-- como staff en Android).
-- =================================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS tipo_personal text NOT NULL DEFAULT 'obrero';

ALTER TABLE public.fichas
    ADD COLUMN IF NOT EXISTS tipo_personal text NOT NULL DEFAULT 'obrero';

-- Validación de valores permitidos (idempotente).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_tipo_personal_chk') THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_tipo_personal_chk CHECK (tipo_personal IN ('obrero', 'staff'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fichas_tipo_personal_chk') THEN
        ALTER TABLE public.fichas
            ADD CONSTRAINT fichas_tipo_personal_chk CHECK (tipo_personal IN ('obrero', 'staff'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_tipo_personal_idx ON public.profiles (tipo_personal);
CREATE INDEX IF NOT EXISTS fichas_tipo_personal_idx ON public.fichas (tipo_personal);
