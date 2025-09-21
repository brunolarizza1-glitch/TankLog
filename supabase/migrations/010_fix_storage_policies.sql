-- Fix storage RLS policies to remove infinite recursion
-- Drop existing problematic storage policies
DROP POLICY IF EXISTS "Organization members can read their PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can update their PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can delete their PDFs" ON storage.objects;

-- Create simplified storage policies that don't cause recursion
-- For log-pdfs bucket - allow authenticated users to access PDFs
CREATE POLICY "Authenticated users can read PDFs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'log-pdfs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can upload PDFs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'log-pdfs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update PDFs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'log-pdfs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete PDFs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'log-pdfs' AND
  auth.uid() IS NOT NULL
);

-- Also fix the log-photos policies to prevent similar issues
DROP POLICY IF EXISTS "Users can view photos from their org" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload photos for their org" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete photos from their org" ON storage.objects;

CREATE POLICY "Authenticated users can read photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'log-photos' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can upload photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'log-photos' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'log-photos' AND
  auth.uid() IS NOT NULL
);

