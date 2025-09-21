-- Add signature column to logs table
ALTER TABLE logs ADD COLUMN IF NOT EXISTS signature text;