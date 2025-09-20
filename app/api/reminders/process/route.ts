import { NextRequest, NextResponse } from 'next/server';
import { reminderService } from '@/lib/reminder-service';
import { handleError, logError } from '@/lib/errors';

/**
 * Process reminders cron job endpoint
 *
 * This endpoint should be called by a cron service (like Vercel Cron, GitHub Actions, etc.)
 * every hour to process due reminders.
 *
 * Security: This endpoint should be protected with a secret token to prevent unauthorized access.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (optional security check)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting reminder processing job...');

    // Process all due reminders
    const stats = await reminderService.processDueReminders();

    console.log('Reminder processing completed:', stats);

    return NextResponse.json({
      success: true,
      message: 'Reminder processing completed',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error, 'POST /api/reminders/process');
    const errorResponse = handleError(error);

    return NextResponse.json(
      {
        error: errorResponse.message,
        code: errorResponse.code,
        timestamp: new Date().toISOString(),
      },
      { status: errorResponse.statusCode }
    );
  }
}

/**
 * GET endpoint for manual testing and health checks
 */
export async function GET() {
  try {
    // Basic health check
    return NextResponse.json({
      status: 'healthy',
      message: 'Reminder processing endpoint is available',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
