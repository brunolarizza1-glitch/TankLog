import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('redirect_to') || '/';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.APP_URL}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.APP_URL}/signin?error=oauth_error`
    );
  }

  return NextResponse.redirect(data.url);
}
