import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/server/db';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orgId = formData.get('orgId') as string;

    if (!file || !orgId) {
      return NextResponse.json(
        { error: 'Missing file or orgId' },
        { status: 400 }
      );
    }

    // Verify user has access to this organization
    const profile = await db.getProfile(user.id);
    if (!profile || profile.org_id !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const filePath = `organizations/${orgId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('log-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading logo:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload logo' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('log-photos')
      .getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
