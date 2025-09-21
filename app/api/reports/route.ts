import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { db } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Reports API: Starting request...');
    const supabase = createClient();

    // Get the user from the request
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('🔍 Reports API: No authenticated user, using fallback');
      // Fallback to hardcoded user ID for development
      const userId = 'cd754800-bbab-4b62-a261-8660004333c9';
      console.log('🔍 Reports API: Using fallback user ID:', userId);
    } else {
      console.log('🔍 Reports API: Authenticated user:', user.id);
    }

    const userId = user?.id || 'cd754800-bbab-4b62-a261-8660004333c9';

    // Get user profile
    console.log('🔍 Reports API: Getting profile for user:', userId);
    const profile = await db.getProfile(userId);
    console.log('🔍 Reports API: Profile result:', {
      hasProfile: !!profile,
      orgId: profile?.org_id,
      name: profile?.name,
    });

    if (!profile?.org_id) {
      console.log('🔍 Reports API: No organization found - returning 404');
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

    // Get logs for the organization with user information
    // Using service client to bypass RLS recursion issues
    console.log('🔍 Reports API: Fetching logs for org_id:', profile.org_id);
    const { data: logs, error: logsError } = await serviceClient
      .from('logs')
      .select('*')
      .eq('org_id', profile.org_id)
      .order('occurred_at', { ascending: false });

    console.log('🔍 Reports API: Logs query result:', {
      logsCount: logs?.length || 0,
      error: logsError?.message || 'none',
    });

    // Get user profiles separately to avoid RLS recursion
    let logsWithUsers = [];
    if (logs && logs.length > 0) {
      const userIds = [...new Set(logs.map((log) => log.user_id))];
      console.log('🔍 Reports API: Fetching profiles for user_ids:', userIds);
      const { data: profiles, error: profilesError } = await serviceClient
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      console.log('🔍 Reports API: Profiles query result:', {
        profilesCount: profiles?.length || 0,
        error: profilesError?.message || 'none',
      });

      if (!profilesError && profiles) {
        const profileMap = new Map(profiles.map((p) => [p.id, p]));
        logsWithUsers = logs.map((log) => ({
          ...log,
          user: profileMap.get(log.user_id) || {
            id: log.user_id,
            name: 'Unknown',
            email: 'unknown@example.com',
          },
        }));
      } else {
        // Fallback if profiles can't be fetched
        logsWithUsers = logs.map((log) => ({
          ...log,
          user: {
            id: log.user_id,
            name: 'Unknown',
            email: 'unknown@example.com',
          },
        }));
      }
    }

    if (logsError) {
      console.error('Error fetching logs:', logsError);
      return NextResponse.json(
        { error: 'Failed to fetch logs' },
        { status: 500 }
      );
    }

    // Get corrective actions for logs in this organization
    let correctiveActions = [];
    if (logs && logs.length > 0) {
      const logIds = logs.map((log) => log.id);
      const { data: correctiveActionsData, error: correctiveError } =
        await serviceClient
          .from('corrective_actions')
          .select('*')
          .in('inspection_id', logIds);

      if (correctiveError) {
        console.error('Error fetching corrective actions:', correctiveError);
        return NextResponse.json(
          { error: 'Failed to fetch corrective actions' },
          { status: 500 }
        );
      }

      correctiveActions = correctiveActionsData || [];
    }

    // Calculate report data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const logsThisMonth =
      logs?.filter((log) => new Date(log.occurred_at) >= startOfMonth).length ||
      0;

    const logsThisWeek =
      logs?.filter((log) => new Date(log.occurred_at) >= startOfWeek).length ||
      0;

    const totalLogs = logs?.length || 0;
    const totalCorrectiveActions = correctiveActions?.length || 0;
    const openCorrectiveActions =
      correctiveActions?.filter((action) => !action.completed_at).length || 0;

    // Calculate compliance rate (logs without corrective actions / total logs)
    const logsWithCorrectiveActions =
      logs?.filter(
        (log) => log.corrective_action && log.corrective_action.trim() !== ''
      ).length || 0;

    const complianceRate =
      totalLogs > 0
        ? Math.round(
            ((totalLogs - logsWithCorrectiveActions) / totalLogs) * 100
          )
        : 100;

    const reportData = {
      totalLogs,
      logsThisMonth,
      logsThisWeek,
      complianceRate,
      correctiveActions: totalCorrectiveActions,
      openCorrectiveActions,
      logs: logsWithUsers || [],
    };

    console.log('🔍 Reports API: Final report data:', {
      totalLogs: reportData.totalLogs,
      logsWithUsersCount: reportData.logs.length,
      logsThisMonth: reportData.logsThisMonth,
    });

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
