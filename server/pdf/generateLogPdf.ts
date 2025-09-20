import { db } from '../db';
import { createAdminClient } from '@/lib/supabase/server';
import { Log, Organization, Profile } from '../db';
import { getComplianceModeInfo } from '@/lib/compliance';
import crypto from 'crypto';

export interface LogPdfData {
  log: Log;
  organization: Organization;
  profile: Profile;
  complianceInfo: any;
  photoUrls: string[];
}

export interface PdfResult {
  pdfUrl: string;
  filename: string;
  storagePath: string;
}

export class PdfGenerationError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'PdfGenerationError';
  }
}

/**
 * Generate a PDF for a TankLog log entry
 */
export async function generateLogPdf(logId: string): Promise<PdfResult> {
  try {
    // Load log data with related information
    const pdfData = await loadLogPdfData(logId);

    // Generate filename
    const filename = generateFilename(pdfData);

    // Create HTML content
    const html = generateLogHtml(pdfData);

    // For now, we'll create a simple HTML file and return the path
    // In production, this would use Puppeteer to generate the actual PDF
    const storagePath = await savePdfToStorage(
      html,
      filename,
      pdfData.log.org_id
    );

    // Generate signed URL for immediate access
    const pdfUrl = await generateSignedUrl(storagePath);

    return {
      pdfUrl,
      filename,
      storagePath,
    };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new PdfGenerationError(
      `Failed to generate PDF for log ${logId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PDF_GENERATION_FAILED'
    );
  }
}

/**
 * Load all data needed for PDF generation
 */
async function loadLogPdfData(logId: string): Promise<LogPdfData> {
  const supabase = createAdminClient();

  // Load log with user and organization data
  const { data: logData, error: logError } = await supabase
    .from('logs')
    .select(
      `
      *,
      user:profiles!logs_user_id_fkey(id, name, email),
      organization:organizations!logs_org_id_fkey(id, name, logo_url, compliance_mode)
    `
    )
    .eq('id', logId)
    .single();

  if (logError || !logData) {
    throw new PdfGenerationError(`Log not found: ${logId}`, 'LOG_NOT_FOUND');
  }

  const log = logData as Log & {
    user: Profile;
    organization: Organization;
  };

  // Get compliance mode info
  const complianceInfo = getComplianceModeInfo(log.compliance_mode);

  // Load photo URLs (they should already be in photo_urls array)
  const photoUrls = log.photo_urls || [];

  return {
    log,
    organization: log.organization,
    profile: log.user,
    complianceInfo,
    photoUrls,
  };
}

/**
 * Generate filename for the PDF
 */
function generateFilename(data: LogPdfData): string {
  const { log, organization } = data;
  const date = new Date(log.occurred_at);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Sanitize strings for filename
  const orgSlug = organization.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const siteSlug = (log.site || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const tankSlug = log.tank_id
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${orgSlug}_${siteSlug}_${year}-${month}-${day}_Tank-${tankSlug}_v${log.version}.pdf`;
}

/**
 * Generate HTML content for the PDF
 */
function generateLogHtml(data: LogPdfData): string {
  const { log, organization, profile, complianceInfo, photoUrls } = data;

  const occurredAt = new Date(log.occurred_at);
  const localDate = occurredAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const logIdShort = log.id.substring(0, 8).toUpperCase();

  // Generate integrity hash
  const integrityData = `${log.id}${log.occurred_at}${log.site}${log.tank_id}${log.leak_check}`;
  const integrityHash = crypto
    .createHash('sha256')
    .update(integrityData)
    .digest('hex')
    .substring(0, 8);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${complianceInfo.formTitle}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .page {
            width: 8.5in;
            min-height: 11in;
            padding: 0.75in;
            margin: 0 auto;
            background: white;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1in;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 0.5in;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
        }
        
        .logo {
            max-width: 96px;
            max-height: 96px;
            object-fit: contain;
        }
        
        .title-section {
            text-align: right;
            flex: 1;
            margin-left: 1in;
        }
        
        .title {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 0.25in;
        }
        
        .subtitle {
            font-size: 11px;
            color: #666;
        }
        
        .content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5in;
            margin-bottom: 0.75in;
        }
        
        .field-group {
            margin-bottom: 0.25in;
        }
        
        .field-label {
            font-weight: bold;
            color: #374151;
            margin-bottom: 0.1in;
        }
        
        .field-value {
            color: #111;
            word-wrap: break-word;
        }
        
        .status-pass {
            color: #059669;
            font-weight: bold;
        }
        
        .status-fail {
            color: #dc2626;
            font-weight: bold;
        }
        
        .status-ok {
            color: #059669;
            font-weight: bold;
        }
        
        .status-issues {
            color: #dc2626;
            font-weight: bold;
        }
        
        .notes {
            grid-column: 1 / -1;
            margin-top: 0.25in;
        }
        
        .notes-content {
            background: #f9fafb;
            padding: 0.25in;
            border-radius: 4px;
            white-space: pre-wrap;
        }
        
        .corrective-action {
            grid-column: 1 / -1;
            margin-top: 0.25in;
            background: #fef2f2;
            padding: 0.25in;
            border-radius: 4px;
            border-left: 4px solid #dc2626;
        }
        
        .photos {
            grid-column: 1 / -1;
            margin-top: 0.5in;
        }
        
        .photos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(2in, 1fr));
            gap: 0.25in;
            margin-top: 0.25in;
        }
        
        .photo {
            width: 100%;
            height: 2in;
            object-fit: cover;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
        }
        
        .photo-placeholder {
            width: 100%;
            height: 2in;
            background: #f3f4f6;
            border: 2px dashed #d1d5db;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            font-size: 10px;
        }
        
        .footer {
            position: fixed;
            bottom: 0.5in;
            left: 0.75in;
            right: 0.75in;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 0.25in;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            .page {
                margin: 0;
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Header -->
        <div class="header">
            <div class="logo-section">
                ${
                  organization.logo_url
                    ? `<img src="${organization.logo_url}" alt="${organization.name}" class="logo">`
                    : `<div class="title">TankLog</div>`
                }
            </div>
            <div class="title-section">
                <div class="title">${complianceInfo.formTitle}</div>
                <div class="subtitle">
                    ${organization.name} • ${localDate} • ${logIdShort}
                </div>
            </div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <div class="field-group">
                <div class="field-label">Occurred At</div>
                <div class="field-value">${localDate}</div>
            </div>
            
            <div class="field-group">
                <div class="field-label">Site / Facility</div>
                <div class="field-value">${log.site || 'Not specified'}</div>
            </div>
            
            ${
              log.vehicle_id
                ? `
            <div class="field-group">
                <div class="field-label">Vehicle / Bobtail ID</div>
                <div class="field-value">${log.vehicle_id}</div>
            </div>
            `
                : ''
            }
            
            <div class="field-group">
                <div class="field-label">Tank / Cylinder ID</div>
                <div class="field-value">${log.tank_id}</div>
            </div>
            
            ${
              log.pressure
                ? `
            <div class="field-group">
                <div class="field-label">Pressure</div>
                <div class="field-value">${log.pressure} ${complianceInfo.labels.pressureUnit}</div>
            </div>
            `
                : ''
            }
            
            <div class="field-group">
                <div class="field-label">Leak Check</div>
                <div class="field-value ${log.leak_check ? 'status-pass' : 'status-fail'}">
                    ${log.leak_check ? '✓ Pass' : '✗ Fail'}
                </div>
            </div>
            
            ${
              log.visual_ok !== null
                ? `
            <div class="field-group">
                <div class="field-label">Visual Inspection</div>
                <div class="field-value ${log.visual_ok ? 'status-ok' : 'status-issues'}">
                    ${log.visual_ok ? '✓ All OK' : '✗ Issues Found'}
                </div>
            </div>
            `
                : ''
            }
            
            <div class="field-group">
                <div class="field-label">Operator</div>
                <div class="field-value">
                    ${profile.name || profile.email}<br>
                    ${profile.email}<br>
                    Initials: ${log.initials || 'N/A'}
                </div>
            </div>
            
            ${
              log.notes
                ? `
            <div class="notes">
                <div class="field-label">Notes</div>
                <div class="notes-content">${log.notes}</div>
            </div>
            `
                : ''
            }
            
            ${
              log.corrective_action
                ? `
            <div class="corrective-action">
                <div class="field-label">Corrective Action</div>
                <div class="field-value">${log.corrective_action}</div>
            </div>
            `
                : ''
            }
        </div>
        
        <!-- Photos -->
        ${
          photoUrls.length > 0
            ? `
        <div class="photos">
            <div class="field-label">Photos (${photoUrls.length})</div>
            <div class="photos-grid">
                ${photoUrls
                  .map(
                    (url) => `
                    <img src="${url}" alt="Log photo" class="photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="photo-placeholder" style="display: none;">Photo unavailable</div>
                `
                  )
                  .join('')}
            </div>
        </div>
        `
            : ''
        }
        
        <!-- Footer -->
        <div class="footer">
            <div>Generated by TankLog at ${new Date().toISOString()}</div>
            <div>Compliance: ${log.compliance_mode}</div>
            <div>Integrity: ${integrityHash}</div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Save PDF to Supabase Storage
 */
async function savePdfToStorage(
  html: string,
  filename: string,
  orgId: string
): Promise<string> {
  const supabase = createAdminClient();

  // For now, we'll save the HTML file
  // In production, this would generate the actual PDF using Puppeteer
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const storagePath = `${orgId}/${year}/${month}/${filename}`;

  // Convert HTML to buffer
  const buffer = Buffer.from(html, 'utf8');

  const { error } = await supabase.storage
    .from('log-pdfs')
    .upload(storagePath, buffer, {
      contentType: 'text/html', // Would be 'application/pdf' in production
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new PdfGenerationError(
      `Failed to save PDF to storage: ${error.message}`,
      'STORAGE_ERROR'
    );
  }

  return storagePath;
}

/**
 * Generate signed URL for PDF access
 */
async function generateSignedUrl(storagePath: string): Promise<string> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage
    .from('log-pdfs')
    .createSignedUrl(storagePath, 30 * 24 * 60 * 60); // 30 days

  if (error) {
    throw new PdfGenerationError(
      `Failed to generate signed URL: ${error.message}`,
      'URL_GENERATION_ERROR'
    );
  }

  return data.signedUrl;
}
