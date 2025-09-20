import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { createClient } from '@/lib/supabase/server';

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

    const complianceMode = await db.getOrganizationComplianceMode(params.id);

    if (!complianceMode) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ compliance_mode: complianceMode });
  } catch (error) {
    console.error('Error fetching compliance mode:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Check if user is admin
    const profile = await db.getProfile(user.id);
    if (!profile || profile.role !== 'admin' || profile.org_id !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { compliance_mode } = await request.json();

    if (
      !compliance_mode ||
      !['US_NFPA58', 'CA_TSSA'].includes(compliance_mode)
    ) {
      return NextResponse.json(
        { error: 'Invalid compliance mode' },
        { status: 400 }
      );
    }

    const updatedOrg = await db.updateOrganization(params.id, {
      compliance_mode,
    });

    if (!updatedOrg) {
      return NextResponse.json(
        { error: 'Failed to update compliance mode' },
        { status: 500 }
      );
    }

    return NextResponse.json({ compliance_mode: updatedOrg.compliance_mode });
  } catch (error) {
    console.error('Error updating compliance mode:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
