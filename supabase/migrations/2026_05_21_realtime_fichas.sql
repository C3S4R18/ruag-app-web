-- =================================================================
-- Migración: habilitar realtime + REPLICA IDENTITY FULL para fichas
-- 2026-05-21
--
-- Soluciona: el admin no recibe el cambio de doc_states cuando el
-- obrero descarga un PDF (badge no pasa a "Descargado" en vivo).
--
-- Causa raíz: la tabla `fichas` puede no estar incluida en la
-- publicación `supabase_realtime` o el `payload.new` de Postgres
-- realtime no incluye `doc_states` (jsonb cambia) sin REPLICA IDENTITY
-- FULL.
-- =================================================================

-- 1) Forzar REPLICA IDENTITY FULL para que `payload.old` y `payload.new`
--    incluyan TODAS las columnas (incluido doc_states actualizado).
ALTER TABLE public.fichas REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- 2) Asegurar que la tabla está en la publicación supabase_realtime.
--    Si ya está incluida, ALTER PUBLICATION dispara un error inocuo
--    que envolvemos en DO ... EXCEPTION.
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.fichas;
    EXCEPTION WHEN duplicate_object THEN
        -- ya estaba incluida
        NULL;
    END;
END $$;

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- 3) Verificación rápida: lista tablas con realtime activo.
--    (sólo para que veas el resultado en la consola SQL de Supabase)
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
