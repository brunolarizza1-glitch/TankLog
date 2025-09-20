-- Add compliance_mode columns to organizations and logs tables
-- This migration adds compliance mode support for US_NFPA58 and CA_TSSA

-- Add compliance_mode to organizations table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'compliance_mode'
    ) THEN
        ALTER TABLE organizations 
        ADD COLUMN compliance_mode text NOT NULL DEFAULT 'US_NFPA58' 
        CHECK (compliance_mode IN ('US_NFPA58', 'CA_TSSA'));
    END IF;
END $$;

-- Add compliance_mode to logs table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'logs' 
        AND column_name = 'compliance_mode'
    ) THEN
        ALTER TABLE logs 
        ADD COLUMN compliance_mode text NOT NULL DEFAULT 'US_NFPA58' 
        CHECK (compliance_mode IN ('US_NFPA58', 'CA_TSSA'));
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_compliance_mode ON organizations(compliance_mode);
CREATE INDEX IF NOT EXISTS idx_logs_compliance_mode ON logs(compliance_mode);

-- Update existing records to have the default compliance mode
UPDATE organizations SET compliance_mode = 'US_NFPA58' WHERE compliance_mode IS NULL;
UPDATE logs SET compliance_mode = 'US_NFPA58' WHERE compliance_mode IS NULL;
