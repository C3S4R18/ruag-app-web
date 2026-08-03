-- =================================================================
-- Migración: rol de ficha "staff" (personal de oficina)
-- 2026-05-29 — No destructiva / idempotente.
--
-- tipo_personal define el TIPO DE FICHA que llena la persona en la app
-- móvil / portal del obrero:
--   'obrero' (default) → docs obligatorios (DNI, Certiadulto, RETCC)
--   'staff'            → docs libres, sin Carnet RETCC
--
-- ACTUALIZADO 2026-08-03: la lista de valores permitidos ya no vive aquí.
-- La migración 2026_08_03_tipo_personal_arug_cg.sql la amplió a
-- 'obrero' | 'staff' | 'arug' | 'cg' con constraints llamados
-- fichas_tipo_personal_check / profiles_tipo_personal_check.
-- Este archivo ya NO crea el CHECK: si volviera a correr con la lista
-- vieja de dos valores, ARUG y CG dejarían de poder asignarse.
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

-- Validación de valores permitidos: la define 2026_08_03_tipo_personal_arug_cg.sql.
-- Aquí solo se crea si NO existe ningún CHECK sobre tipo_personal (base nueva
-- desde cero), y con la lista completa de cuatro valores para no chocar con
-- las pantallas de Staff / ARUG / CG.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.profiles'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%tipo_personal%'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_tipo_personal_check
            CHECK (tipo_personal IN ('obrero', 'staff', 'arug', 'cg'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.fichas'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%tipo_personal%'
    ) THEN
        ALTER TABLE public.fichas
            ADD CONSTRAINT fichas_tipo_personal_check
            CHECK (tipo_personal IN ('obrero', 'staff', 'arug', 'cg'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_tipo_personal_idx ON public.profiles (tipo_personal);
CREATE INDEX IF NOT EXISTS fichas_tipo_personal_idx ON public.fichas (tipo_personal);
