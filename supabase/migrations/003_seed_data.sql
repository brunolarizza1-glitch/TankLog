-- Seed data for development/demo
-- Note: This assumes you have a test user in auth.users
-- In production, this would be handled by your auth flow

-- Create a demo organization
INSERT INTO organizations (id, name, owner_id, compliance_mode) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Demo Propane Company',
  '00000000-0000-0000-0000-000000000000', -- Placeholder for auth user
  'US_NFPA58'
);

-- Create a demo admin profile
-- Note: In real implementation, this would be created when user signs up
INSERT INTO profiles (id, email, name, org_id, role) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Placeholder for auth user
  'admin@demopropane.com',
  'Demo Admin',
  '550e8400-e29b-41d4-a716-446655440000',
  'admin'
);

-- Create a demo worker profile
INSERT INTO profiles (id, email, name, org_id, role) VALUES (
  '11111111-1111-1111-1111-111111111111', -- Placeholder for auth user
  'worker@demopropane.com',
  'Demo Worker',
  '550e8400-e29b-41d4-a716-446655440000',
  'worker'
);

-- Create example logs
INSERT INTO logs (
  id,
  root_id,
  version,
  org_id,
  user_id,
  compliance_mode,
  occurred_at,
  site,
  tank_id,
  pressure,
  leak_check,
  visual_ok,
  notes,
  customer_email
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  1,
  '550e8400-e29b-41d4-a716-446655440000',
  '11111111-1111-1111-1111-111111111111',
  'US_NFPA58',
  '2024-01-15 09:30:00+00',
  'Main Distribution Center',
  'TANK-001',
  '250 PSI',
  true,
  true,
  'Routine inspection completed. All systems normal.',
  'customer@example.com'
);

-- Create a second example log
INSERT INTO logs (
  id,
  root_id,
  version,
  org_id,
  user_id,
  compliance_mode,
  occurred_at,
  site,
  tank_id,
  pressure,
  leak_check,
  visual_ok,
  notes,
  corrective_action
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '33333333-3333-3333-3333-333333333333',
  1,
  '550e8400-e29b-41d4-a716-446655440000',
  '11111111-1111-1111-1111-111111111111',
  'US_NFPA58',
  '2024-01-16 14:15:00+00',
  'Warehouse B',
  'TANK-002',
  '180 PSI',
  false,
  false,
  'Minor leak detected at valve connection.',
  'Tightened valve connection and re-tested. Leak resolved.'
);
