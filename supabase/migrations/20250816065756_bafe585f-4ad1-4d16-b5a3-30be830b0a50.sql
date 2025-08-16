-- Create storage bucket for study materials if it doesn't exist
DO $$
BEGIN
    -- Check if bucket exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'study-materials') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'study-materials', 
            'study-materials', 
            true, 
            52428800, -- 50MB limit
            ARRAY['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        );
    END IF;
END
$$;

-- Create storage policies for study materials
CREATE POLICY IF NOT EXISTS "Users can view their own study materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can upload their own study materials"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can update their own study materials"
ON storage.objects FOR UPDATE
USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can delete their own study materials"
ON storage.objects FOR DELETE
USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);