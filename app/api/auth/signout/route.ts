import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function handleSignOut() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.redirect(
      new URL(
        '/signin?error=signout_failed',
        process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      )
    );
  }

  return NextResponse.redirect(
    new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
  );
}

export async function POST() {
  return handleSignOut();
}

export async function GET() {
  return handleSignOut();
}
