-- =================================================================
-- Migración: fechas de vencimiento detectadas por IA (RETCC + Antecedentes)
-- 2026-05-21 — No destructiva / idempotente.
--
-- La IA (Gemini) lee la foto del documento subido por el obrero y extrae
-- las fechas. Las guardamos aquí para que el dashboard del admin avise
-- "por vencer / vencido" y la app del obrero alerte.
-- =================================================================

ALTER TABLE public.fichas
    -- RETCC (ya existe fecha_vencimiento_retcc; agregamos inscripción)
    ADD COLUMN IF NOT EXISTS retcc_fecha_inscripcion date,
    -- Antecedentes / Certiadulto (vigencia 3 meses)
    ADD COLUMN IF NOT EXISTS antecedentes_fecha_emision date,
    ADD COLUMN IF NOT EXISTS antecedentes_fecha_vencimiento date,
    -- Metadatos de la lectura IA (confianza, texto crudo, timestamp, etc.)
    ADD COLUMN IF NOT EXISTS docs_ia_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.fichas.fecha_vencimiento_retcc IS
    'Fecha de caducidad del Carnet RETCC (leída por IA del documento).';
COMMENT ON COLUMN public.fichas.antecedentes_fecha_vencimiento IS
    'Fecha de caducidad del certificado de Antecedentes (vigencia 3 meses).';
COMMENT ON COLUMN public.fichas.docs_ia_meta IS
    'Metadatos de la extracción IA: { retcc: {...}, antecedentes: {...} }.';

-- Índices para que el dashboard liste rápido los próximos a vencer.
CREATE INDEX IF NOT EXISTS fichas_retcc_venc_idx
    ON public.fichas (fecha_vencimiento_retcc)
    WHERE fecha_vencimiento_retcc IS NOT NULL;

CREATE INDEX IF NOT EXISTS fichas_antecedentes_venc_idx
    ON public.fichas (antecedentes_fecha_vencimiento)
    WHERE antecedentes_fecha_vencimiento IS NOT NULL;
