import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { correctiveActionService } from '@/lib/corrective-actions';
import { handleError, AuthenticationError, logError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new AuthenticationError();
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const technicianId = searchParams.get('technicianId');

    const actions = await correctiveActionService.getOpenActions(
      locationId || undefined,
      technicianId || undefined
    );

    return NextResponse.json({ actions });
  } catch (error) {
    logError(error, 'GET /api/corrective-actions');
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message, code: errorResponse.code },
      { status: errorResponse.statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { inspectionId, itemId, failureDetails } = body;

    if (!inspectionId || !itemId || !failureDetails) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const action = await correctiveActionService.createCorrectiveAction({
      inspectionId,
      itemId,
      failureDetails,
    });

    return NextResponse.json({ action });
  } catch (error) {
    logError(error, 'POST /api/corrective-actions');
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message, code: errorResponse.code },
      { status: errorResponse.statusCode }
    );
  }
}
