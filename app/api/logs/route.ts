import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/server/db';
import { validateLogData } from '@/lib/compliance';
import { finalizeLogPdf } from '@/lib/actions/finalizeLogPdf';
import { handleError, AuthenticationError, logError } from '@/lib/errors';
import { validateRequestBody, createLogSchema } from '@/lib/validation';

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
      bodyData: body 
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

    // Generate PDF asynchronously (don't wait for it)
    finalizeLogPdf(log.id).catch((error) => {
      console.error('Failed to generate PDF for log:', log.id, error);
    });

    return NextResponse.json({
      success: true,
      log,
      message: 'Log created successfully',
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
