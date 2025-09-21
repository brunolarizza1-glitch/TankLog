import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS issues
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { pdfPaths } = await request.json();

    if (!pdfPaths || !Array.isArray(pdfPaths)) {
      return NextResponse.json(
        { error: 'pdfPaths array is required' },
        { status: 400 }
      );
    }

    const urls: Record<string, string> = {};

    for (const { logId, pdfPath } of pdfPaths) {
      if (pdfPath) {
        try {
          // Try to generate signed URL directly first
          const { data, error } = await supabase.storage
            .from('log-pdfs')
            .createSignedUrl(pdfPath, 60 * 60 * 24 * 30); // 30 days

          if (!error && data?.signedUrl) {
            urls[logId] = data.signedUrl;
            console.log(`✅ Generated signed URL for log ${logId}: ${pdfPath}`);
          } else {
            console.log(`PDF file not found for log ${logId}: ${pdfPath}`);
            // Don't continue here, just skip this PDF
          }
        } catch (error) {
          console.error(`Error generating signed URL for log ${logId}:`, error);
        }
      }
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Error generating PDF URLs:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF URLs' },
      { status: 500 }
    );
  }
}
