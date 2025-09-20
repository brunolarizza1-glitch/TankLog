import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { correctiveActionService } from '@/lib/corrective-actions';
import { handleError, AuthenticationError, logError } from '@/lib/errors';

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
      throw new AuthenticationError();
    }

    const { id } = params;
    const body = await request.json();
    const { status, resolutionNotes, photoEvidence } = body;

    if (status === 'completed') {
      const action = await correctiveActionService.markActionCompleted({
        actionId: id,
        resolutionNotes: resolutionNotes || '',
        photoEvidence: photoEvidence || undefined,
      });
      return NextResponse.json({ action });
    } else {
      const action = await correctiveActionService.updateActionStatus(
        id,
        status
      );
      return NextResponse.json({ action });
    }
  } catch (error) {
    logError(error, `PATCH /api/corrective-actions/${params.id}`);
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message, code: errorResponse.code },
      { status: errorResponse.statusCode }
    );
  }
}

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
      throw new AuthenticationError();
    }

    const { id } = params;
    const actions = await correctiveActionService.getOpenActions();
    const action = actions.find((a) => a.id === id);

    if (!action) {
      return NextResponse.json(
        { error: 'Corrective action not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ action });
  } catch (error) {
    logError(error, `GET /api/corrective-actions/${params.id}`);
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message, code: errorResponse.code },
      { status: errorResponse.statusCode }
    );
  }
}
