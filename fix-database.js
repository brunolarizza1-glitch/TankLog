// Quick script to add missing columns to the logs table
// Run this in Supabase SQL Editor

const sql = `
-- Add missing columns to logs table
ALTER TABLE logs ADD COLUMN IF NOT EXISTS vehicle_id text;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS initials text;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';
ALTER TABLE logs ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS email_message_id text;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_logs_vehicle_id ON logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_logs_initials ON logs(initials);
CREATE INDEX IF NOT EXISTS idx_logs_pdf_url ON logs(pdf_url);
`;

console.log('Copy and paste this SQL into your Supabase SQL Editor:');
console.log(sql);








