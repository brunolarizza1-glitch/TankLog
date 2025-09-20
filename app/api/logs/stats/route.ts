import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/server/db';
import { handleError, AuthenticationError, logError } from '@/lib/errors';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new AuthenticationError();
    }

    const profile = await db.getProfile(user.id);
    if (!profile || !profile.org_id) {
      return NextResponse.json(
        { error: 'User not associated with organization' },
        { status: 400 }
      );
    }

    // Get basic stats for the organization
    const logs = await db.getLogsByOrg(profile.org_id, 1000); // Get more logs for stats

    const stats = {
      totalLogs: logs.length,
      thisMonth: logs.filter((log) => {
        const logDate = new Date(log.occurred_at);
        const now = new Date();
        return (
          logDate.getMonth() === now.getMonth() &&
          logDate.getFullYear() === now.getFullYear()
        );
      }).length,
      pendingIssues: logs.filter(
        (log) => log.leak_check === false || log.visual_ok === false
      ).length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    logError(error, 'GET /api/logs/stats');
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message, code: errorResponse.code },
      { status: errorResponse.statusCode }
    );
  }
}
