import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { db } from '@/server/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to verify org access
    const profile = await db.getProfile(user.id);
    if (!profile?.org_id) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    // Create service client to bypass RLS
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the specific log
    const { data: log, error: logError } = await serviceClient
      .from('logs')
      .select('*')
      .eq('id', params.id)
      .eq('org_id', profile.org_id)
      .single();

    // Get user profile separately to avoid RLS recursion
    let logWithUser = null;
    if (log && !logError) {
      const { data: userProfile, error: profileError } = await serviceClient
        .from('profiles')
        .select('id, name, email')
        .eq('id', log.user_id)
        .single();

      logWithUser = {
        ...log,
        user: userProfile || {
          id: log.user_id,
          name: 'Unknown',
          email: 'unknown@example.com',
        },
      };
    }

    if (logError || !logWithUser) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    return NextResponse.json(logWithUser);
  } catch (error) {
    console.error('Error fetching log:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
