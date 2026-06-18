-- =================================================================
-- Migración: fecha de firma del trabajador
-- 2026-06-18 — No destructiva / idempotente.
--
-- Los documentos imprimibles (RISST, IPERC, EPP, etc.) deben mostrar
-- la fecha en que el trabajador FIRMÓ, no la fecha de impresión.
-- =================================================================

ALTER TABLE public.fichas
    ADD COLUMN IF NOT EXISTS firma_fecha timestamptz;

COMMENT ON COLUMN public.fichas.firma_fecha IS
    'Fecha/hora en que el trabajador guardó su firma (para los PDF imprimibles).';

-- Backfill: fichas ya firmadas sin fecha → usar ssoma_updated_at o updated_at.
UPDATE public.fichas
SET firma_fecha = COALESCE(ssoma_updated_at, updated_at)
WHERE firma_fecha IS NULL
  AND (firma_url IS NOT NULL OR url_firma IS NOT NULL);
