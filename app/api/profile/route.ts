import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;
    const profile = await db.getProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get organization information if user has an org
    let organization = null;
    if (profile.org_id) {
      organization = await db.getOrganization(profile.org_id);
    }

    const profileData = {
      ...profile,
      organizationName: organization?.name || 'No organization',
      organizationId: organization?.id || null,
      complianceMode: organization?.compliance_mode || 'US_NFPA58',
    };

    return NextResponse.json(profileData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { name } = body;

    // Update profile
    const updatedProfile = await db.updateProfile(user.id, {
      name: name || undefined,
    });

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Get organization information
    let organization = null;
    if (updatedProfile.org_id) {
      organization = await db.getOrganization(updatedProfile.org_id);
    }

    const profileData = {
      ...updatedProfile,
      organizationName: organization?.name || 'No organization',
      organizationId: organization?.id || null,
      complianceMode: organization?.compliance_mode || 'US_NFPA58',
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
