'use server';

import { generateLogPdfPuppeteer } from '@/server/pdf/generateLogPdfPuppeteer';
import { db } from '@/server/db';
import { createClient } from '@/lib/supabase/server';
import { sendLogPdfEmail } from '@/lib/postmark';

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

    // Check if log exists before updating
    console.log('=== LOG EXISTENCE CHECK ===');
    const existingLog = await db.getLog(logId);
    console.log('Existing log found:', !!existingLog);
    if (existingLog) {
      console.log('Log ID:', existingLog.id);
      console.log('Log org_id:', existingLog.org_id);
      console.log('Log user_id:', existingLog.user_id);
    }
    console.log('=== LOG EXISTENCE CHECK END ===');

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

    // Send email with PDF attachment to the account holder
    try {
      console.log('=== EMAIL DEBUG START ===');
      console.log('Sending email to account holder:', user.email);
      console.log('PDF buffer size:', pdfResult.pdfBuffer.length);
      console.log('PDF filename:', pdfResult.filename);
      console.log('Log data:', JSON.stringify(log, null, 2));

      if (!user.email) {
        throw new Error('User email not found');
      }

      const emailResult = await sendLogPdfEmail(
        user.email,
        log,
        Buffer.from(pdfResult.pdfBuffer),
        pdfResult.filename
      );
      console.log('Email sent successfully:', emailResult);

      // Update log with email message ID
      await db.updateLog(logId, {
        email_message_id: emailResult.MessageID,
      });
      console.log('=== EMAIL DEBUG END ===');
    } catch (error) {
      console.error('=== EMAIL ERROR ===');
      console.error('Failed to send email:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('=== EMAIL ERROR END ===');
      // Don't fail the PDF generation if email fails
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
