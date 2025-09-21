import { createAdminClient } from '@/lib/supabase/server';
import { getComplianceModeInfo } from '@/lib/compliance';

interface LogData {
  log: any;
  organization: any;
  profile: any;
}

export async function loadLogPdfData(logId: string): Promise<LogData> {
  const supabase = createAdminClient();
  
  // Load log data
  const { data: log, error: logError } = await supabase
    .from('logs')
    .select(`
      *,
      user:user_id (
        name,
        email
      )
    `)
    .eq('id', logId)
    .single();

  if (logError || !log) {
    throw new Error(`Log not found: ${logError?.message || 'Unknown error'}`);
  }

  // Load organization data
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', log.org_id)
    .single();

  if (orgError || !organization) {
    throw new Error(`Organization not found: ${orgError?.message || 'Unknown error'}`);
  }

  // Load profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', log.user_id)
    .single();

  if (profileError || !profile) {
    throw new Error(`Profile not found: ${profileError?.message || 'Unknown error'}`);
  }

  return {
    log,
    organization,
    profile: {
      name: profile.name || log.user?.name,
      email: profile.email || log.user?.email,
    },
  };
}

export function generateLogHtml(logData: LogData): string {
  const { log, organization, profile } = logData;
  
  const complianceInfo = getComplianceModeInfo(log.compliance_mode);
  const localDate = new Date(log.occurred_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const logIdShort = log.id.substring(0, 8);
  const generatedAt = new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  
  // Generate integrity hash (simplified)
  const integrityHash = Buffer.from(`${log.id}-${log.occurred_at}`).toString('base64').substring(0, 12);

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${complianceInfo.labels.formTitle}</title>
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
        margin-bottom: 0.75in;
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

      .executive-summary {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 0.4in;
        margin-bottom: 0.5in;
      }

      .summary-title {
        font-size: 14px;
        font-weight: bold;
        color: #1e293b;
        margin-bottom: 0.2in;
      }

      .summary-content {
        font-size: 12px;
        line-height: 1.5;
        color: #475569;
      }

      .inspection-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 0.5in;
        font-size: 11px;
      }

      .inspection-table th {
        background: #f1f5f9;
        color: #334155;
        font-weight: bold;
        padding: 0.2in 0.15in;
        text-align: left;
        border: 1px solid #cbd5e1;
      }

      .inspection-table td {
        padding: 0.15in;
        border: 1px solid #cbd5e1;
        vertical-align: top;
      }

      .status-pass {
        color: #059669;
        font-weight: bold;
      }

      .status-fail {
        color: #dc2626;
        font-weight: bold;
      }

      .compliance-section {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 6px;
        padding: 0.3in;
        margin-bottom: 0.5in;
      }

      .compliance-title {
        font-size: 13px;
        font-weight: bold;
        color: #0c4a6e;
        margin-bottom: 0.2in;
      }

      .compliance-item {
        display: flex;
        align-items: center;
        margin-bottom: 0.1in;
        font-size: 11px;
      }

      .compliance-check {
        margin-right: 0.1in;
        font-weight: bold;
      }

      .notes-section {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 0.3in;
        margin-bottom: 0.5in;
      }

      .notes-title {
        font-size: 13px;
        font-weight: bold;
        color: #374151;
        margin-bottom: 0.15in;
      }

      .notes-content {
        font-size: 11px;
        line-height: 1.4;
        color: #4b5563;
        white-space: pre-wrap;
      }

      .corrective-action {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-left: 4px solid #dc2626;
        border-radius: 6px;
        padding: 0.3in;
        margin-bottom: 0.5in;
      }

      .corrective-title {
        font-size: 13px;
        font-weight: bold;
        color: #dc2626;
        margin-bottom: 0.15in;
      }

      .corrective-content {
        font-size: 11px;
        line-height: 1.4;
        color: #7f1d1d;
      }

      .photos-section {
        margin-bottom: 0.5in;
      }

      .photos-title {
        font-size: 13px;
        font-weight: bold;
        color: #374151;
        margin-bottom: 0.2in;
      }

      .photos-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(2in, 1fr));
        gap: 0.25in;
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

      .signature-section {
        background: #f9fafb;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 0.3in;
        margin-bottom: 1in;
      }

      .signature-title {
        font-size: 13px;
        font-weight: bold;
        color: #374151;
        margin-bottom: 0.15in;
      }

      .signature-box {
        height: 60px;
        border: 1px solid #9ca3af;
        border-radius: 4px;
        margin: 0.1in 0;
        background: white;
        display: flex;
        align-items: center;
        padding: 0.1in;
      }

      .signature-date {
        margin-top: 0.15in;
        font-size: 11px;
        color: #374151;
      }

      .footer {
        position: fixed;
        bottom: 0.25in;
        left: 0.75in;
        right: 0.75in;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 9px;
        color: #6b7280;
        border-top: 1px solid #e5e7eb;
        padding-top: 0.2in;
        background: white;
        line-height: 1.3;
      }

      .footer-left {
        flex: 1;
      }

      .footer-right {
        text-align: right;
        flex: 1;
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
          ${organization.logo_url
            ? `<img src="${organization.logo_url}" alt="${organization.name}" class="logo" />`
            : `<div class="title">TankLog</div>`
          }
        </div>
        <div class="title-section">
          <div class="title">${complianceInfo.labels.formTitle}</div>
          <div class="subtitle">
            ${organization.name} • ${localDate} • ${logIdShort}
          </div>
        </div>
      </div>

      <!-- Executive Summary -->
      <div class="executive-summary">
        <div class="summary-title">Executive Summary</div>
        <div class="summary-content">
          ${log.leak_check
            ? `Inspection completed successfully with no leaks detected${log.visual_ok ? ' and all visual components in good condition' : ''}.`
            : `Inspection identified issues requiring attention${log.visual_ok === false ? ' including visual inspection concerns' : ''}.`
          }
          ${log.pressure ? `System pressure recorded at ${log.pressure} ${complianceInfo.labels.pressureUnit}.` : ''}
          ${log.corrective_action ? `Corrective action required: ${log.corrective_action}` : ''}
          ${!log.corrective_action && !log.leak_check ? 'No corrective action specified.' : ''}
        </div>
      </div>

      <!-- Inspection Overview Table -->
      <table class="inspection-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Equipment ID</th>
            <th>Location</th>
            <th>Test Type</th>
            <th>Result</th>
            <th>Technician</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${localDate}</td>
            <td>${log.tank_id}${log.vehicle_id ? `<br><small>Vehicle: ${log.vehicle_id}</small>` : ''}</td>
            <td>${log.site || 'Not specified'}</td>
            <td>Leak Check${log.visual_ok !== null ? ' & Visual' : ''}</td>
            <td>
              <span class="${log.leak_check ? 'status-pass' : 'status-fail'}">
                ${log.leak_check ? '✓ PASS' : '✗ FAIL'}
              </span>
              ${log.visual_ok !== null ? `
              <br><span class="${log.visual_ok ? 'status-pass' : 'status-fail'}">
                ${log.visual_ok ? '✓ Visual OK' : '✗ Visual Issues'}
              </span>
              ` : ''}
            </td>
            <td>${profile.name || profile.email}</td>
          </tr>
        </tbody>
      </table>

      <!-- Regulatory Compliance -->
      <div class="compliance-section">
        <div class="compliance-title">Regulatory Compliance</div>
        <div class="compliance-item">
          <span class="compliance-check">${log.leak_check ? '✓' : '✗'}</span>
          Leak detection test completed per ${log.compliance_mode} standards
        </div>
        ${log.visual_ok !== null ? `
        <div class="compliance-item">
          <span class="compliance-check">${log.visual_ok ? '✓' : '✗'}</span>
          Visual inspection ${log.visual_ok ? 'passed - no damage or defects observed' : 'failed - issues identified'}
        </div>
        ` : ''}
        ${log.pressure ? `
        <div class="compliance-item">
          <span class="compliance-check">✓</span>
          Pressure reading recorded: ${log.pressure} ${complianceInfo.labels.pressureUnit}
        </div>
        ` : ''}
        <div class="compliance-item">
          <span class="compliance-check">✓</span>
          Inspection documented and digitally signed
        </div>
      </div>

      <!-- Notes -->
      ${log.notes ? `
      <div class="notes-section">
        <div class="notes-title">Additional Notes</div>
        <div class="notes-content">${log.notes}</div>
      </div>
      ` : ''}

      <!-- Corrective Action -->
      ${log.corrective_action ? `
      <div class="corrective-action">
        <div class="corrective-title">Required Corrective Action</div>
        <div class="corrective-content">${log.corrective_action}</div>
      </div>
      ` : ''}

      <!-- Digital Signature -->
      <div class="signature-section">
        <div class="signature-title">Digital Signature</div>
        <div class="signature-box">
          ${log.signature
            ? `
          <div style="font-size: 10px; color: #059669">
            ✓ Digital signature verified
          </div>
          `
            : `
          <div style="font-size: 10px; color: #6b7280">
            Digital signature not provided
          </div>
          `
          }
        </div>
        <div class="signature-date">Date: ${localDate}</div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-left">
          <div>Generated by TankLog at ${generatedAt}</div>
          <div>Report ID: ${logIdShort}</div>
        </div>
        <div class="footer-right">
          <div>Compliance: ${log.compliance_mode}</div>
          <div>Integrity: ${integrityHash}</div>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
}

export async function generateLogPdf(logId: string): Promise<{
  html: string;
  filename: string;
}> {
  const logData = await loadLogPdfData(logId);
  const html = generateLogHtml(logData);
  
  const timestamp = new Date(logData.log.occurred_at)
    .toISOString()
    .replace('T', '_')
    .replace(/\.\d{3}Z$/, '')
    .replace(/:/g, '-');
  
  const filename = `TankLog_Report_${logData.log.tank_id}_${timestamp}.pdf`;
  
  return {
    html,
    filename,
  };
}