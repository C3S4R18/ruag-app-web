-- =================================================================
-- Migración: auto-crear profile cuando se registra un usuario nuevo.
-- Soluciona el error  fichas_user_id_fkey  ( "Key is not present in
-- table profiles" ) que aparecía cuando, por una falla de red u orden,
-- el upsert en profiles no llegaba antes del upsert en fichas.
--
-- Idempotente: si la fila profile ya existe (porque el cliente la creó
-- bien), el ON CONFLICT la deja intacta.
-- =================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    nombres,
    apellido_paterno,
    apellido_materno,
    dni,
    telefono,
    role
  )
  VALUES (
    NEW.id,
    NULLIF(
      COALESCE(
        NEW.raw_user_meta_data->>'nombres',
        NEW.raw_user_meta_data->>'full_name',
        ''
      ), ''
    ),
    NEW.raw_user_meta_data->>'apellido_paterno',
    NEW.raw_user_meta_data->>'apellido_materno',
    NULLIF(NEW.raw_user_meta_data->>'dni', ''),
    NULLIF(NEW.raw_user_meta_data->>'telefono', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'obrero')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================================
-- Backfill: para los usuarios YA registrados que están huérfanos
-- (en auth.users pero no en profiles), creamos su perfil ahora con
-- lo que tengamos. Esto repara fichas que reventaban al intentar
-- guardar la firma.
-- =================================================================
INSERT INTO public.profiles (id, nombres, apellido_paterno, apellido_materno, dni, telefono, role)
SELECT
  u.id,
  NULLIF(COALESCE(u.raw_user_meta_data->>'nombres', u.raw_user_meta_data->>'full_name', ''), ''),
  u.raw_user_meta_data->>'apellido_paterno',  
  u.raw_user_meta_data->>'apellido_materno',
  NULLIF(u.raw_user_meta_data->>'dni', ''),
  NULLIF(u.raw_user_meta_data->>'telefono', ''),
  COALESCE(u.raw_user_meta_data->>'role', 'obrero')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;  
