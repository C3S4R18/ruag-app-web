-- =================================================================
-- Migración: Examen Médico Ocupacional (subido por el ADMIN) + IA
-- 2026-05-25 — No destructiva / idempotente.
--
-- A diferencia de RETCC/Antecedentes/DNI (que sube el obrero), el examen
-- médico lo sube el administrador para cada trabajador. La IA (Gemini) lee
-- el PDF/imagen y extrae la fecha de vencimiento; el dashboard alerta
-- (solo para admins) cuando está por vencer o vencido.
-- =================================================================

ALTER TABLE public.fichas
    ADD COLUMN IF NOT EXISTS examen_medico_url text,
    ADD COLUMN IF NOT EXISTS examen_medico_fecha_emision date,
    ADD COLUMN IF NOT EXISTS examen_medico_fecha_vencimiento date;

COMMENT ON COLUMN public.fichas.examen_medico_url IS
    'URL del Certificado de Aptitud Médico Ocupacional (subido por el admin).';
COMMENT ON COLUMN public.fichas.examen_medico_fecha_emision IS
    'Fecha de emisión/evaluación del examen médico (leída por IA).';
COMMENT ON COLUMN public.fichas.examen_medico_fecha_vencimiento IS
    'Fecha de caducidad/vigencia del examen médico (leída por IA; si no está impresa, emisión + 1 año).';

-- Índice para listar rápido los exámenes próximos a vencer.
CREATE INDEX IF NOT EXISTS fichas_examen_medico_venc_idx
    ON public.fichas (examen_medico_fecha_vencimiento)
    WHERE examen_medico_fecha_vencimiento IS NOT NULL;
