import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test Auth API: Starting request...');

    // Try to get the user
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('🔍 Test Auth API: Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message || 'none',
    });

    // Also try to get the session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log('🔍 Test Auth API: Session check:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionError: sessionError?.message || 'none',
    });

    // Check cookies
    const cookies = request.cookies.getAll();
    console.log(
      '🔍 Test Auth API: Cookies:',
      cookies.map((c) => c.name)
    );

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email } : null,
      session: session
        ? { user: { id: session.user.id, email: session.user.email } }
        : null,
      cookies: cookies.map((c) => c.name),
      authError: authError?.message || null,
      sessionError: sessionError?.message || null,
    });
  } catch (error) {
    console.error('Error in test auth API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
