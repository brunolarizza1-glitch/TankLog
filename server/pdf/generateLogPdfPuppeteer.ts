import puppeteer from 'puppeteer';
import { createAdminClient } from '@/lib/supabase/server';
import { db } from '@/server/db';
import { sendLogPdfEmail } from '@/lib/postmark';
import { generateLogPdfProfessional } from './generateLogPdfProfessional';

interface PdfResult {
  pdfBuffer: Uint8Array;
  pdfUrl?: string;
  storagePath?: string;
  filename: string;
}

async function loadLogPdfData(logId: string) {
  const log = await db.getLog(logId);
  if (!log) {
    throw new Error('Log not found');
  }

  const organization = await db.getOrganization(log.org_id);
  if (!organization) {
    throw new Error('Organization not found');
  }

  const profile = await db.getProfile(log.user_id);
  if (!profile) {
    throw new Error('Profile not found');
  }

  return { log, organization, profile };
}

function generateFilename(pdfData: any): string {
  const date = new Date(pdfData.log.occurred_at);
  const dateStr = date.toISOString().split('T')[0];
  const site = pdfData.log.site.replace(/[^a-zA-Z0-9]/g, '_');
  return `tanklog_${site}_${dateStr}_${pdfData.log.id.slice(0, 8)}.pdf`;
}

function generateHtml(logData: any, organization: any, profile: any): string {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBoolean = (value: boolean) => (value ? 'Yes' : 'No');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TankLog Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .logo-section {
      display: flex;
      align-items: center;
    }
    .logo {
      width: 40px;
      height: 40px;
      margin-right: 10px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
    }
    .header-info {
      text-align: right;
    }
    .org-name {
      font-size: 14px;
      font-weight: bold;
      color: #374151;
      margin-bottom: 4px;
    }
    .date {
      font-size: 12px;
      color: #6b7280;
    }
    .content {
      display: flex;
      gap: 20px;
    }
    .left-column, .right-column {
      flex: 1;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .field {
      display: flex;
      margin-bottom: 8px;
    }
    .field-label {
      font-weight: bold;
      width: 120px;
      color: #374151;
    }
    .field-value {
      flex: 1;
      color: #6b7280;
    }
    .notes {
      background: #f9fafb;
      padding: 10px;
      border-radius: 4px;
      margin-top: 10px;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
        <img src="file://${process.cwd()}/public/brand/icon-transparent.jpeg" class="logo" alt="TankLog">
    </div>
    <div class="header-info">
      <div class="org-name">${organization.name}</div>
      <div class="date">${formatDate(logData.occurred_at)}</div>
    </div>
  </div>

  <div class="content">
    <div class="left-column">
      <div class="section">
        <div class="section-title">Log Details</div>
        <div class="field">
          <div class="field-label">Site:</div>
          <div class="field-value">${logData.site || 'N/A'}</div>
        </div>
        <div class="field">
          <div class="field-label">Vehicle:</div>
          <div class="field-value">${logData.vehicle_id || 'N/A'}</div>
        </div>
        <div class="field">
          <div class="field-label">Tank ID:</div>
          <div class="field-value">${logData.tank_id || 'N/A'}</div>
        </div>
        <div class="field">
          <div class="field-label">Pressure:</div>
          <div class="field-value">${logData.pressure ? `${logData.pressure} PSI` : 'N/A'}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Inspections</div>
        <div class="field">
          <div class="field-label">Leak Check:</div>
          <div class="field-value">${formatBoolean(logData.leak_check)}</div>
        </div>
        <div class="field">
          <div class="field-label">Visual OK:</div>
          <div class="field-value">${formatBoolean(logData.visual_ok)}</div>
        </div>
      </div>
    </div>

    <div class="right-column">
      <div class="section">
        <div class="section-title">Compliance</div>
        <div class="field">
          <div class="field-label">Mode:</div>
          <div class="field-value">${logData.compliance_mode === 'US_NFPA58' ? 'US NFPA 58' : 'CA TSSA'}</div>
        </div>
        <div class="field">
          <div class="field-label">Inspector:</div>
          <div class="field-value">${profile.full_name || 'N/A'}</div>
        </div>
        <div class="field">
          <div class="field-label">Initials:</div>
          <div class="field-value">Digital Signature</div>
        </div>
        <div class="field">
          <div class="field-label">Date:</div>
          <div class="field-value">${formatDate(logData.occurred_at)}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Notes</div>
        <div class="notes">${logData.notes || 'No notes provided'}</div>
      </div>

      ${
        logData.corrective_action
          ? `
      <div class="section">
        <div class="section-title">Corrective Action</div>
        <div class="notes">${logData.corrective_action}</div>
      </div>
      `
          : ''
      }
    </div>
  </div>

  <div class="footer">
    <div>Generated by TankLog - Professional Tank Inspection Management</div>
    <div>Data Hash: ${logData.id.slice(0, 16)}</div>
  </div>
</body>
</html>
  `;
}

async function uploadPdfToStorage(
  pdfBuffer: Uint8Array,
  filename: string,
  logData: { log: any; organization: any; profile: any }
): Promise<string> {
  const supabase = createAdminClient();
  
  // Get organization ID from log data
  const orgId = logData.log.org_id;
  
  // Create storage path
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const storagePath = `${orgId}/${year}/${month}/${filename}`;
  
  console.log('Uploading PDF to storage path:', storagePath);
  console.log('PDF buffer size:', pdfBuffer.length);
  console.log('PDF buffer type:', pdfBuffer.constructor.name);
  
  // Upload PDF buffer to storage (convert Uint8Array to Buffer)
  const bufferToUpload = Buffer.from(pdfBuffer);
  console.log('Converted buffer size:', bufferToUpload.length);
  
  const { error, data } = await supabase.storage
    .from('log-pdfs')
    .upload(storagePath, bufferToUpload, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false,
    });
  
  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(`Failed to upload PDF to storage: ${error.message}`);
  }
  
  console.log('PDF uploaded successfully to:', storagePath);
  console.log('Upload result:', data);
  return storagePath;
}

async function generateSignedUrl(storagePath: string): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase.storage
    .from('log-pdfs')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 30); // 30 days

  if (!data?.signedUrl) {
    throw new Error('Failed to generate signed URL');
  }

  return data.signedUrl;
}

export async function generateLogPdfPuppeteer(
  logId: string
): Promise<PdfResult> {
  console.log('=== PDF GENERATION DEBUG START ===');
  console.log('generateLogPdfPuppeteer called for logId:', logId);
  try {
    // Load log data once
    const logData = await loadLogPdfData(logId);
    console.log('Log data loaded:', logData.log.id);
    
    // Use the new professional PDF generator
    console.log('Calling generateLogPdfProfessional...');
    const result = await generateLogPdfProfessional(logId);
    console.log('PDF generation completed successfully');
    console.log('PDF buffer size:', result.pdfBuffer.length);
    console.log('PDF filename:', result.filename);
    
    // Upload PDF to storage
    console.log('Uploading PDF to storage...');
    const storagePath = await uploadPdfToStorage(result.pdfBuffer, result.filename, logData);
    console.log('PDF uploaded to storage path:', storagePath);
    
    // Generate signed URL
    const pdfUrl = await generateSignedUrl(storagePath);
    console.log('Generated signed URL:', pdfUrl);
    
    const finalResult = {
      ...result,
      storagePath,
      pdfUrl,
    };
    
    console.log('=== PDF GENERATION DEBUG END ===');
    return finalResult;
  } catch (error) {
    console.error('=== PDF GENERATION ERROR ===');
    console.error('Error generating PDF:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('=== PDF GENERATION ERROR END ===');
    throw new Error(
      `Failed to generate PDF for log ${logId}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
