import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createClient();
    const redirectUrl = `${process.env.APP_URL}/auth/callback`;
    console.log('Sending magic link to:', email, 'with redirect:', redirectUrl);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('Magic link error:', error);
      return NextResponse.json(
        { error: 'Failed to send magic link', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Magic link sent to your email',
    });
  } catch (error) {
    console.error('Magic link request error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
