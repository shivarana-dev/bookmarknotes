-- Allow folder_id to be null for files in root directory
ALTER TABLE public.files ALTER COLUMN folder_id DROP NOT NULL;