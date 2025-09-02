-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_folders_updated_at ON public.folders;
DROP TRIGGER IF EXISTS update_files_updated_at ON public.files;

-- Now drop and recreate the function with secure search_path
DROP FUNCTION IF EXISTS public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add CHECK constraints to sanitize names
ALTER TABLE public.files 
ADD CONSTRAINT files_name_sanitized 
CHECK (name IS NOT NULL AND name != '' AND name !~ '[/\\]');

ALTER TABLE public.folders 
ADD CONSTRAINT folders_name_sanitized 
CHECK (name IS NOT NULL AND name != '' AND name !~ '[/\\]');

-- Create trigger function to enforce user_id and auto-update timestamps
CREATE OR REPLACE FUNCTION public.enforce_user_security()
RETURNS TRIGGER AS $$
BEGIN
-- Always set user_id to current authenticated user, ignore client input
NEW.user_id = auth.uid();
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger function for inserts to set user_id
CREATE OR REPLACE FUNCTION public.set_user_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
NEW.user_id = auth.uid();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply triggers to files table
CREATE TRIGGER enforce_files_user_security
BEFORE INSERT ON public.files
FOR EACH ROW EXECUTE FUNCTION public.set_user_id_on_insert();

CREATE TRIGGER enforce_files_update_security
BEFORE UPDATE ON public.files
FOR EACH ROW EXECUTE FUNCTION public.enforce_user_security();

-- Apply triggers to folders table
CREATE TRIGGER enforce_folders_user_security
BEFORE INSERT ON public.folders
FOR EACH ROW EXECUTE FUNCTION public.set_user_id_on_insert();

CREATE TRIGGER enforce_folders_update_security
BEFORE UPDATE ON public.folders
FOR EACH ROW EXECUTE FUNCTION public.enforce_user_security();