import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { handleError, logError } from '@/lib/errors';

/**
 * Unsubscribe from corrective action reminders
 *
 * This endpoint handles unsubscribing users from corrective action reminders
 * using a token-based approach for security.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing unsubscribe token' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find the corrective action by ID (using token as action ID for simplicity)
    // In a production system, you'd want to use a proper JWT token with expiration
    const { data: action, error: actionError } = await supabase
      .from('corrective_actions')
      .select(
        `
        id,
        assigned_to,
        technician:profiles!corrective_actions_assigned_to_fkey(id, name, email)
      `
      )
      .eq('id', token)
      .single();

    if (actionError || !action) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 400 }
      );
    }

    // Cancel all pending reminders for this action
    const { error: cancelError } = await supabase
      .from('follow_up_reminders')
      .update({ status: 'cancelled' })
      .eq('corrective_action_id', action.id)
      .eq('status', 'pending');

    if (cancelError) {
      console.error('Failed to cancel reminders:', cancelError);
    }

    // Return success page HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - TankLog</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          .success-icon {
            font-size: 48px;
            color: #10b981;
            margin-bottom: 20px;
          }
          h1 {
            color: #374151;
            margin-bottom: 16px;
          }
          p {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .action-details {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
          }
          .back-link {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin-top: 20px;
          }
          .back-link:hover {
            background-color: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>Successfully Unsubscribed</h1>
          <p>
            You have been unsubscribed from corrective action reminders for this specific action.
          </p>
          
          <div class="action-details">
            <h3 style="margin-top: 0; color: #374151;">Action Details:</h3>
            <p><strong>Assigned to:</strong> ${action.technician?.[0]?.name || action.assigned_to || 'Unknown'}</p>
            <p><strong>Action ID:</strong> ${action.id}</p>
          </div>
          
          <p>
            You will no longer receive email reminders for this corrective action. 
            If you need to resubscribe or have any questions, please contact your administrator.
          </p>
          
          <a href="/corrective-actions" class="back-link">
            View Corrective Actions
          </a>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    logError(error, 'GET /api/reminders/unsubscribe');
    const errorResponse = handleError(error);

    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.statusCode }
    );
  }
}
