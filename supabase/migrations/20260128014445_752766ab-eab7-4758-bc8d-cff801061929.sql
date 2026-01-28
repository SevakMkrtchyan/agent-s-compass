-- Create storage bucket for offer templates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('offer-templates', 'offer-templates', true);

-- Allow public read access
CREATE POLICY "Public read access for offer templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'offer-templates');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload offer templates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'offer-templates');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete offer templates"
ON storage.objects FOR DELETE
USING (bucket_id = 'offer-templates');