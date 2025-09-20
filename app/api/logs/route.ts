import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/server/db';
import { validateLogData } from '@/lib/compliance';
import { finalizeLogPdf } from '@/lib/actions/finalizeLogPdf';
import { handleError, AuthenticationError, logError } from '@/lib/errors';
import { validateRequestBody, createLogSchema } from '@/lib/validation';
import { correctiveActionService } from '@/lib/corrective-actions';

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
    console.log('Log submission received:', {
      hasBody: !!body,
      bodyKeys: Object.keys(body || {}),
      bodyData: body,
    });

    // Validate request body
    const validatedData = validateRequestBody(createLogSchema, body);
    console.log('Validation passed:', { validatedData });
    const {
      site,
      vehicle_id,
      tank_id,
      pressure,
      leak_check,
      visual_ok,
      notes,
      corrective_action,
      customer_email,
      compliance_mode,
      photo_urls,
      initials,
    } = validatedData;

    // Get user profile to verify org access
    const profile = await db.getProfile(user.id);
    if (!profile || !profile.org_id) {
      return NextResponse.json(
        { error: 'User not associated with organization' },
        { status: 400 }
      );
    }

    // Validate log data based on compliance mode
    const validation = validateLogData(body, compliance_mode || 'US_NFPA58');
    console.log('Compliance validation result:', validation);
    if (!validation.valid) {
      console.log('Validation failed:', validation.errors);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Create log with compliance mode snapshot
    const logData = {
      root_id: crypto.randomUUID(), // Generate stable ID for versioning
      version: 1,
      org_id: profile.org_id,
      user_id: user.id,
      compliance_mode: compliance_mode || 'US_NFPA58', // Snapshot the compliance mode
      occurred_at: new Date().toISOString(),
      site: site || '',
      vehicle_id: vehicle_id || '',
      tank_id: tank_id || '',
      pressure: pressure || '',
      leak_check: leak_check,
      visual_ok: visual_ok,
      notes: notes || '',
      corrective_action: corrective_action || '',
      customer_email: customer_email || '',
      photo_urls: photo_urls || [],
      initials: initials || '',
    };

    const log = await db.createLog(logData);

    if (!log) {
      return NextResponse.json(
        { error: 'Failed to create log' },
        { status: 500 }
      );
    }

    // Check for failures and create corrective actions
    const createdActions = [];
    const hasFailures = leak_check === false || visual_ok === false;

    if (hasFailures) {
      try {
        // Create corrective action for leak check failure
        if (leak_check === false) {
          const leakAction =
            await correctiveActionService.createCorrectiveAction({
              inspectionId: log.id,
              itemId: 'leak_check',
              failureDetails: {
                itemId: 'leak_check',
                description: 'Leak check failed during inspection',
                requiredAction:
                  corrective_action || 'Investigate and repair leak source',
                assignedTo: user.id,
              },
            });
          createdActions.push(leakAction.id);
        }

        // Create corrective action for visual inspection failure
        if (visual_ok === false) {
          const visualAction =
            await correctiveActionService.createCorrectiveAction({
              inspectionId: log.id,
              itemId: 'visual_inspection',
              failureDetails: {
                itemId: 'visual_inspection',
                description: 'Visual inspection revealed issues',
                requiredAction:
                  corrective_action || 'Address visual inspection findings',
                assignedTo: user.id,
              },
            });
          createdActions.push(visualAction.id);
        }
      } catch (error) {
        console.error('Failed to create corrective actions:', error);
        // Don't fail the log creation if corrective actions fail
      }
    }

    // Generate PDF asynchronously (don't wait for it)
    console.log('Starting PDF generation for log:', log.id);

    // Test: Try to call finalizeLogPdf directly
    try {
      const pdfResult = await finalizeLogPdf(log.id);
      console.log('PDF generation completed synchronously:', pdfResult);
    } catch (error) {
      console.error('PDF generation failed synchronously:', error);
    }

    return NextResponse.json({
      success: true,
      log,
      message: 'Log created successfully',
      correctiveActions: createdActions,
    });
  } catch (error) {
    logError(error, 'POST /api/logs');
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message, code: errorResponse.code },
      { status: errorResponse.statusCode }
    );
  }
}

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

    // Get user profile to verify org access
    const profile = await db.getProfile(user.id);
    if (!profile || !profile.org_id) {
      return NextResponse.json(
        { error: 'User not associated with organization' },
        { status: 400 }
      );
    }

    // Get logs for the user's organization
    const logs = await db.getLogs(profile.org_id);

    return NextResponse.json({ logs });
  } catch (error) {
    logError(error, 'GET /api/logs');
    const errorResponse = handleError(error);
    return NextResponse.json(
      { error: errorResponse.message, code: errorResponse.code },
      { status: errorResponse.statusCode }
    );
  }
}
