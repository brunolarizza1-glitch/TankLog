import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test Data API: Starting request...');

    // Create service client to bypass RLS
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get some test data
    const { data: logs, error: logsError } = await serviceClient
      .from('logs')
      .select('id, pdf_url, occurred_at')
      .limit(5)
      .order('occurred_at', { ascending: false });

    console.log('🔍 Test Data API: Logs query result:', {
      logsCount: logs?.length || 0,
      error: logsError?.message || 'none',
    });

    if (logsError) {
      console.error('Error fetching logs:', logsError);
      return NextResponse.json(
        { error: 'Failed to fetch logs', details: logsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      count: logs?.length || 0,
    });
  } catch (error) {
    console.error('Error in test data API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

