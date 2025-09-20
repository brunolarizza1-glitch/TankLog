'use server';

import { generateLogPdfPuppeteer } from '@/server/pdf/generateLogPdfPuppeteer';
import { db } from '@/server/db';
import { createClient } from '@/lib/supabase/server';

export interface FinalizePdfResult {
  success: boolean;
  pdfUrl?: string;
  filename?: string;
  error?: string;
}

export async function finalizeLogPdf(
  logId: string
): Promise<FinalizePdfResult> {
  console.log('finalizeLogPdf called for logId:', logId);
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Verify user has access to this log
    const log = await db.getLog(logId);
    if (!log) {
      return {
        success: false,
        error: 'Log not found',
      };
    }

    // Check if user has access to this log's organization
    const profile = await db.getProfile(user.id);
    if (!profile || profile.org_id !== log.org_id) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    // Generate PDF
    const pdfResult = await generateLogPdfPuppeteer(logId);

    // Update log with PDF URL
    const updatedLog = await db.updateLog(logId, {
      pdf_url: pdfResult.storagePath,
    });

    if (!updatedLog) {
      return {
        success: false,
        error: 'Failed to update log with PDF URL',
      };
    }

    return {
      success: true,
      pdfUrl: pdfResult.pdfUrl,
      filename: pdfResult.filename,
    };
  } catch (error) {
    console.error('Error finalizing PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
