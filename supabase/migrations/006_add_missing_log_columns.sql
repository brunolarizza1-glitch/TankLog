-- Add missing columns to logs table
-- This migration adds the missing columns that are referenced in the application

-- Add vehicle_id column (optional for US compliance mode)
ALTER TABLE logs ADD COLUMN IF NOT EXISTS vehicle_id text;

-- Add initials column (required for all logs)
ALTER TABLE logs ADD COLUMN IF NOT EXISTS initials text;

-- Add photo_urls column (array of photo URLs)
ALTER TABLE logs ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';

-- Add pdf_url column (URL to generated PDF)
ALTER TABLE logs ADD COLUMN IF NOT EXISTS pdf_url text;

-- Add email_message_id column (for tracking sent emails)
ALTER TABLE logs ADD COLUMN IF NOT EXISTS email_message_id text;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_logs_vehicle_id ON logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_logs_initials ON logs(initials);
CREATE INDEX IF NOT EXISTS idx_logs_pdf_url ON logs(pdf_url);





