-- Create log-pdfs storage bucket for PDF files
-- This migration sets up the storage bucket for generated PDF files

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'log-pdfs',
  'log-pdfs',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'text/html'] -- Allow PDF and HTML files
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the log-pdfs bucket
-- Only organization members can access their organization's PDFs

-- Policy for reading PDFs (organization members only)
CREATE POLICY "Organization members can read their PDFs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'log-pdfs' AND
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE org_id = (string_to_array(name, '/'))[1]::uuid
  )
);

-- Policy for uploading PDFs (organization members only)
CREATE POLICY "Organization members can upload PDFs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'log-pdfs' AND
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE org_id = (string_to_array(name, '/'))[1]::uuid
  )
);

-- Policy for updating PDFs (organization members only)
CREATE POLICY "Organization members can update their PDFs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'log-pdfs' AND
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE org_id = (string_to_array(name, '/'))[1]::uuid
  )
);

-- Policy for deleting PDFs (organization members only)
CREATE POLICY "Organization members can delete their PDFs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'log-pdfs' AND
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE org_id = (string_to_array(name, '/'))[1]::uuid
  )
);

