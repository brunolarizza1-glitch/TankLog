-- Add demo columns to profiles and organizations tables
ALTER TABLE profiles ADD COLUMN is_demo BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN is_demo BOOLEAN DEFAULT FALSE;

-- Add demo logs table for demo data
CREATE TABLE demo_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site TEXT NOT NULL,
  tank_id TEXT NOT NULL,
  vehicle_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  leak_check BOOLEAN NOT NULL,
  visual_ok BOOLEAN,
  pressure TEXT,
  notes TEXT,
  corrective_action TEXT,
  compliance_mode TEXT NOT NULL DEFAULT 'US_NFPA58',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id)
);

-- Insert demo organization
INSERT INTO organizations (id, name, address, is_demo) 
VALUES ('demo-org-123', 'Demo Propane Company', '123 Demo Street, Demo City, DC 12345', true)
ON CONFLICT (id) DO UPDATE SET is_demo = true;

-- Insert demo profile
INSERT INTO profiles (id, name, email, organization_id, is_demo)
VALUES ('3c2081c6-34fa-4d80-863a-fb15dd016625', 'Demo Inspector', 'demo@tanklog.com', 'demo-org-123', true)
ON CONFLICT (id) DO UPDATE SET is_demo = true;

-- Insert demo logs
INSERT INTO demo_logs (site, tank_id, vehicle_id, occurred_at, leak_check, visual_ok, pressure, notes, corrective_action, compliance_mode, user_id, organization_id) VALUES
('Main Facility - Building A', 'TANK-001', 'VEH-001', '2025-01-20T09:00:00Z', true, true, '250', 'Routine inspection completed. All systems functioning normally. No leaks detected during soap bubble test.', null, 'US_NFPA58', '3c2081c6-34fa-4d80-863a-fb15dd016625', 'demo-org-123'),
('Secondary Facility - Building B', 'TANK-002', null, '2025-01-19T14:30:00Z', false, false, '180', 'Minor leak detected at connection point. Soap bubble test confirmed leak at valve connection.', 'Replace gasket and retest system pressure. Schedule follow-up inspection within 24 hours.', 'US_NFPA58', '3c2081c6-34fa-4d80-863a-fb15dd016625', 'demo-org-123'),
('Main Facility - Building A', 'TANK-003', 'VEH-002', '2025-01-18T11:15:00Z', true, true, '275', 'Weekly inspection. No issues found. All safety systems operational.', null, 'US_NFPA58', '3c2081c6-34fa-4d80-863a-fb15dd016625', 'demo-org-123'),
('Remote Site - Location C', 'TANK-004', null, '2025-01-17T16:45:00Z', true, true, '220', 'Monthly comprehensive inspection. All safety systems operational. Documentation updated.', null, 'CA_TSSA', '3c2081c6-34fa-4d80-863a-fb15dd016625', 'demo-org-123'),
('Main Facility - Building A', 'TANK-005', 'VEH-003', '2025-01-16T08:30:00Z', false, true, '190', 'Pressure below recommended range. Visual inspection passed but pressure needs adjustment.', 'Adjust pressure regulator and verify system integrity. Retest within 48 hours.', 'US_NFPA58', '3c2081c6-34fa-4d80-863a-fb15dd016625', 'demo-org-123');

-- Enable RLS on demo_logs
ALTER TABLE demo_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for demo_logs
CREATE POLICY "Demo logs are viewable by demo users" ON demo_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_demo = true
    )
  );
