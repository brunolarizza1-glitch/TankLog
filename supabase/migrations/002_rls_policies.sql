-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Organizations RLS Policies
-- Members can select their organization
CREATE POLICY "Members can select their organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT org_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Profiles RLS Policies
-- Users can select and update their own profile
CREATE POLICY "Users can select own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Admins can read all profiles in their organization
CREATE POLICY "Admins can read org profiles" ON profiles
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Logs RLS Policies
-- Users can insert logs for their organization
CREATE POLICY "Users can insert logs for their org" ON logs
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Members can read logs in their organization
-- Workers are limited to their own logs, admins can read all org logs
CREATE POLICY "Members can read org logs" ON logs
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM profiles 
      WHERE id = auth.uid()
    ) AND (
      -- Admins can read all logs in their org
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      OR
      -- Workers can only read their own logs
      user_id = auth.uid()
    )
  );

-- Only admins can update logs in their organization
CREATE POLICY "Admins can update org logs" ON logs
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Deny all delete operations on logs (append-only)
CREATE POLICY "Deny all deletes on logs" ON logs
  FOR DELETE USING (false);

-- Storage RLS Policies for log-photos bucket
CREATE POLICY "Users can upload photos for their org" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'log-photos' AND
    auth.uid() IS NOT NULL AND
    -- Verify the user belongs to an organization
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view photos from their org" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'log-photos' AND
    auth.uid() IS NOT NULL AND
    -- Verify the user belongs to an organization
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos from their org" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'log-photos' AND
    auth.uid() IS NOT NULL AND
    -- Verify the user belongs to an organization
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid()
    )
  );
