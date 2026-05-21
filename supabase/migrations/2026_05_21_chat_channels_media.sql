-- =================================================================
-- Migración: canales (rrhh / ssoma) + adjuntos multimedia en messages
-- 2026-05-21 — Idempotente, no destructiva.
--
-- Soluciona:
--   • Los mensajes del obrero ahora se dirigen a un CANAL (rrhh / ssoma),
--     no a un admin individual → TODOS los admins lo reciben.
--   • Permite enviar audio, imagen o video como adjunto.
-- =================================================================

-- 1) Columnas nuevas en messages -----------------------------------
ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS media_url text,
    ADD COLUMN IF NOT EXISTS media_type text,           -- 'audio' | 'image' | 'video'
    ADD COLUMN IF NOT EXISTS media_duration_ms integer, -- duración (audio/video)
    ADD COLUMN IF NOT EXISTS media_mime text;

-- Validación de canal (rrhh, ssoma o general por compatibilidad atrás).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_name = 'messages' AND constraint_name = 'messages_channel_check'
    ) THEN
        ALTER TABLE public.messages
            ADD CONSTRAINT messages_channel_check
            CHECK (channel IN ('rrhh','ssoma','general'));
    END IF;
END $$;

-- Validación de tipo de media.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_name = 'messages' AND constraint_name = 'messages_media_type_check'
    ) THEN
        ALTER TABLE public.messages
            ADD CONSTRAINT messages_media_type_check
            CHECK (media_type IS NULL OR media_type IN ('audio','image','video'));
    END IF;
END $$;

-- Índices para consultas por canal y por trabajador (acelera lectura).
CREATE INDEX IF NOT EXISTS messages_worker_channel_idx
    ON public.messages (worker_id, channel, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_channel_idx
    ON public.messages (channel, created_at DESC);

-- 2) Bucket de media del chat --------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS — lectura pública (los archivos del chat son públicos pero el
-- nombre de archivo lleva UUID aleatorio para evitar enumeración).
DROP POLICY IF EXISTS "chat_media_read" ON storage.objects;
CREATE POLICY "chat_media_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

-- INSERT: cualquier usuario autenticado puede subir un archivo en su
-- carpeta {auth.uid()}/...
DROP POLICY IF EXISTS "chat_media_insert_own" ON storage.objects;
CREATE POLICY "chat_media_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'chat-media'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3) Permitir mensajes sin receiver específico (broadcast a admins).
--   El cliente del obrero deja receiver_id = NULL cuando escribe a un
--   canal. Todos los admins lo verán. La columna ya es nullable, no
--   hace falta cambiarla.

COMMENT ON COLUMN public.messages.channel IS
    'Canal del mensaje: rrhh, ssoma o general (legado). Los obreros eligen el área a la que escriben.';
COMMENT ON COLUMN public.messages.media_url IS
    'URL pública del adjunto en storage chat-media (audio/image/video).';
