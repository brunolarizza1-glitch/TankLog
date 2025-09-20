import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/server/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organization = await db.getOrganization(params.id);

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, logo_url } = body;

    // Verify user has access to this organization
    const profile = await db.getProfile(user.id);
    if (!profile || profile.org_id !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update organization
    const updatedOrg = await db.updateOrganization(params.id, {
      name,
      logo_url,
    });

    if (!updatedOrg) {
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedOrg);
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
