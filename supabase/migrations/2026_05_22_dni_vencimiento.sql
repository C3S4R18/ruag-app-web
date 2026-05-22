-- =================================================================
-- Migración: fecha de vencimiento del DNI detectada por IA
-- 2026-05-22 — No destructiva / idempotente.
--
-- La IA (Gemini) lee la foto/PDF del DNI subido por el obrero y extrae
-- la fecha de caducidad, igual que el RETCC y los Antecedentes.
-- =================================================================

ALTER TABLE public.fichas
    ADD COLUMN IF NOT EXISTS dni_fecha_vencimiento date;

COMMENT ON COLUMN public.fichas.dni_fecha_vencimiento IS
    'Fecha de caducidad del DNI (leída por IA del documento).';

-- Índice para que el dashboard liste rápido los DNI próximos a vencer.
CREATE INDEX IF NOT EXISTS fichas_dni_venc_idx
    ON public.fichas (dni_fecha_vencimiento)
    WHERE dni_fecha_vencimiento IS NOT NULL;
