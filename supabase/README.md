# TankLog Database Schema

This directory contains the Supabase database schema, migrations, and configuration for TankLog.

## Schema Overview

### Tables

#### `organizations`

- Stores company/organization information
- Each organization has a compliance mode (US_NFPA58 or CA_TSSA)
- Owner is the first admin user

#### `profiles`

- User profiles linked to auth.users
- Contains role (admin/worker) and organization membership
- First user in an org becomes admin

#### `logs`

- Propane tank inspection logs
- Versioned system with root_id for tracking changes
- Supports both US and Canadian compliance standards
- Includes photo storage and PDF generation

### Storage

#### `log-photos` bucket

- Stores inspection photos
- 5MB max per file
- JPEG format only
- Organized by log ID

## Row Level Security (RLS)

### Organizations

- Members can read their organization
- Only admins can create/update organizations

### Profiles

- Users can read/update their own profile
- Admins can read all profiles in their organization

### Logs

- Users can create logs for their organization
- Workers can only read their own logs
- Admins can read all logs in their organization
- Only admins can update logs
- No deletes allowed (append-only)

### Storage

- Users can upload/view/delete photos for their organization

## Running Migrations

### Local Development

```bash
# Start Supabase locally
supabase start

# Apply migrations
supabase db reset

# Or apply specific migration
supabase db push
```

### Production

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

## Environment Variables

Add these to your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth (for Supabase Auth)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret
```

## Database Helper

The `server/db.ts` file provides typed database operations:

```typescript
import { db } from '@/server/db';

// Create a log
const log = await db.createLog({
  root_id: 'uuid',
  org_id: 'uuid',
  user_id: 'uuid',
  occurred_at: '2024-01-15T09:30:00Z',
  site: 'Main Distribution Center',
  tank_id: 'TANK-001',
  leak_check: true,
  // ... other fields
});

// Get logs for organization
const logs = await db.getLogsByOrg('org-uuid');
```

## Compliance Standards

### US_NFPA58

- Requires visual inspection (visual_ok field)
- Standard US propane safety regulations

### CA_TSSA

- Canadian Technical Standards and Safety Authority
- Visual inspection is optional
- Different reporting requirements

## Seed Data

The `003_seed_data.sql` migration creates:

- Demo organization
- Admin and worker profiles
- Sample inspection logs

This data is for development/testing only.
