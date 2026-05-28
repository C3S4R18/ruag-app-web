-- =================================================================
-- Migración: Chat persistente entre administradores
-- 2026-05-28 — No destructiva / idempotente.
--
-- Mensajes que sobreviven al refresco (a diferencia del broadcast efímero).
-- Solo admins (profiles.role = 'admin') pueden leer/escribir.
-- =================================================================

CREATE TABLE IF NOT EXISTS public.admin_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    photo_url text,
    color text,
    text text NOT NULL CHECK (length(text) > 0 AND length(text) <= 2000),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_messages_created_at_idx
    ON public.admin_messages (created_at DESC);

-- Row Level Security: solo admins
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_messages_select ON public.admin_messages;
CREATE POLICY admin_messages_select ON public.admin_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS admin_messages_insert ON public.admin_messages;
CREATE POLICY admin_messages_insert ON public.admin_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Permite borrar solo los propios mensajes (admins pueden eliminar lo que ENVIARON).
DROP POLICY IF EXISTS admin_messages_delete_own ON public.admin_messages;
CREATE POLICY admin_messages_delete_own ON public.admin_messages
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Realtime: añadir a la publicación para recibir INSERTs en vivo.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'admin_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_messages;
    END IF;
END $$;
