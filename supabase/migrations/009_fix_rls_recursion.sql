-- Fix RLS policies to remove infinite recursion
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can read org profiles" ON profiles;
DROP POLICY IF EXISTS "Members can select their organization" ON organizations;

-- Recreate organizations policy without circular dependency
CREATE POLICY "Members can select their organization" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.org_id = organizations.id 
      AND profiles.id = auth.uid()
    )
  );

-- Recreate profiles policy without circular dependency
CREATE POLICY "Admins can read org profiles" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p2 
      WHERE p2.id = auth.uid() 
      AND p2.role = 'admin' 
      AND p2.org_id = profiles.org_id
    )
  );


