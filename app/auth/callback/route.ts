import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/server/db';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirect_to') ?? '/';

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      try {
        // Check if profile exists, create if not
        let profile = await db.getProfile(data.user.id);

        if (!profile) {
          // Create profile for new user
          profile = await db.createProfile({
            id: data.user.id,
            email: data.user.email || '',
            name:
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              data.user.email?.split('@')[0] ||
              'User',
            role: 'admin', // First user in org becomes admin
          });
        }

        // If user has no org_id, create organization and update profile
        if (profile && !profile.org_id) {
          const userName = profile.name || 'User';
          const orgName = `${userName}'s Company`;

          // Create organization
          const organization = await db.createOrganization({
            name: orgName,
            owner_id: data.user.id,
            compliance_mode: 'US_NFPA58',
          });

          if (organization) {
            // Update profile with org_id
            await db.updateProfile(data.user.id, {
              org_id: organization.id,
              role: 'admin', // Keep as admin since they own the org
            });
          }
        }

        return NextResponse.redirect(`${origin}${redirectTo}`);
      } catch (error) {
        return NextResponse.redirect(`${origin}/signin?error=bootstrap_error`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/signin?error=auth_error`);
}
