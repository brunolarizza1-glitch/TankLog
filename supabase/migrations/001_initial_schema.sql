-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  logo_url text,
  owner_id uuid NOT NULL,
  compliance_mode text NOT NULL DEFAULT 'US_NFPA58' CHECK (compliance_mode IN ('US_NFPA58', 'CA_TSSA')),
  created_at timestamptz DEFAULT now()
);

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  org_id uuid REFERENCES organizations(id),
  role text CHECK (role IN ('admin', 'worker')) DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

-- Create logs table
CREATE TABLE logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  root_id uuid NOT NULL,        -- stable id for versioning
  version int NOT NULL DEFAULT 1,
  org_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  compliance_mode text NOT NULL DEFAULT 'US_NFPA58' CHECK (compliance_mode IN ('US_NFPA58', 'CA_TSSA')),
  occurred_at timestamptz NOT NULL,
  site text NOT NULL,
  tank_id text NOT NULL,
  pressure text,
  leak_check boolean NOT NULL,
  visual_ok boolean,            -- US emphasis; optional in CA
  notes text,
  corrective_action text,
  customer_email text,
  photo_urls text[] DEFAULT '{}',
  pdf_url text,
  email_message_id text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_org_id ON profiles(org_id);
CREATE INDEX idx_logs_org_id ON logs(org_id);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_root_id ON logs(root_id);
CREATE INDEX idx_logs_occurred_at ON logs(occurred_at);

-- Create storage bucket for log photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'log-photos',
  'log-photos',
  false,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg']
);
