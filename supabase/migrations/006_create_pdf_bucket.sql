-- Create log-pdfs storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public)
VALUES ('log-pdfs', 'log-pdfs', false)
ON CONFLICT (id) DO NOTHING;



