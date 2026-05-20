-- =================================================================
-- Migración: foto de perfil del obrero
-- Fecha: 2026-05-20
-- Compatible con esquema existente (no destructiva).
-- =================================================================

-- 1) Columna nueva en fichas (nullable, no rompe nada).
ALTER TABLE public.fichas
ADD COLUMN IF NOT EXISTS foto_perfil_url text;

COMMENT ON COLUMN public.fichas.foto_perfil_url IS
'URL pública de la foto de perfil del trabajador (storage worker-photos).';

-- 2) Crear bucket público worker-photos (idempotente).
INSERT INTO storage.buckets (id, name, public)
VALUES ('worker-photos', 'worker-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3) RLS · políticas mínimas
--    Lectura pública (los GIFs/fotos son visibles sin login,
--    como el resto de archivos públicos).
DROP POLICY IF EXISTS "worker_photos_read" ON storage.objects;
CREATE POLICY "worker_photos_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'worker-photos');

--    Subida sólo si el path empieza con auth.uid()
--    (cada obrero sólo puede subir su propia foto).
DROP POLICY IF EXISTS "worker_photos_insert_own" ON storage.objects;
CREATE POLICY "worker_photos_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'worker-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

--    Actualizar / sobreescribir su propia foto.
DROP POLICY IF EXISTS "worker_photos_update_own" ON storage.objects;
CREATE POLICY "worker_photos_update_own"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'worker-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

--    Eliminar la suya.
DROP POLICY IF EXISTS "worker_photos_delete_own" ON storage.objects;
CREATE POLICY "worker_photos_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'worker-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
