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

    // Get user profile to verify org access
    const profile = await db.getProfile(user.id);
    if (!profile || !profile.org_id) {
      return NextResponse.json(
        { error: 'User not associated with organization' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const logId = formData.get('logId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
        { error: 'File too large (max 5MB)' },
        { status: 400 }
      );
    }

    // Generate file path: {org_id}/{YYYY}/{MM}/{logId}/{filename}.jpg
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${profile.org_id}/${year}/${month}/${logId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('log-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload photo' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('log-photos')
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
