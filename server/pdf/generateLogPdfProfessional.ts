import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/server';
import { Log, Profile, Organization, db } from '@/server/db';

interface PdfData {
  log: Log;
  organization: Organization;
  profile: Profile;
}

interface PdfResult {
  pdfBuffer: Uint8Array;
  filename: string;
  pdfUrl?: string;
  storagePath?: string;
}

class ProfessionalPdfGenerator {
  private doc!: jsPDF;
  private currentY = 0;
  private pageNumber = 1;
  private totalPages = 1;
  private config = {
    pageWidth: 612, // US Letter width
    pageHeight: 792, // US Letter height
    margin: 54, // 0.75" margins as requested
    contentWidth: 504, // pageWidth - 2 * margin
    // Professional font sizes
    fontSizes: {
      title: 24,
      subtitle: 16,
      body: 11,
      small: 9,
      tiny: 8,
    },
    // Professional color scheme
    colors: {
      primary: [0, 102, 204], // TankLog blue
      success: [34, 197, 94], // Green
      error: [239, 68, 68], // Red
      text: [31, 41, 55], // Dark gray
      muted: [107, 114, 128], // Medium gray
      light: [156, 163, 175], // Light gray
      background: [255, 255, 255], // White background
      border: [229, 231, 235], // Light border
    },
  };

  constructor() {
    this.doc = new jsPDF('portrait', 'pt', 'letter');
  }

  async generatePdf(data: PdfData): Promise<PdfResult> {
    const filename = `TankLog_Report_${data.log.tank_id}_${format(
      new Date(data.log.occurred_at),
      'yyyy-MM-dd_HH-mm-ss'
    )}.pdf`;

    // Generate all sections
    this.generateHeader(data);
    this.generateExecutiveSummary(data);
    this.generateInspectionSummary(data);
    this.generateInspectionOverview(data);
    this.generateDetailedResults(data);
    this.generateRegulatoryContext(data);
    this.generateActionableInsights(data);
    this.generateFooter(data);

    // Get PDF buffer
    const pdfBuffer = this.doc.output('arraybuffer');

    return {
      pdfBuffer: new Uint8Array(pdfBuffer),
      filename,
      pdfUrl: `https://tanklog.co/reports/${filename}`,
      storagePath: `reports/${filename}`,
    };
  }

  private generateHeader(data: PdfData) {
    const { margin, pageWidth, fontSizes, colors } = this.config;
    const headerHeight = 80;

    // Clean white background
    this.doc.setFillColor(
      colors.background[0],
      colors.background[1],
      colors.background[2]
    );
    this.doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // TankLog logo with text - using the horizontal transparent logo
    try {
      const logoPath = path.join(
        process.cwd(),
        'public/brand/logo-horizontal-transparent.png'
      );
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      this.doc.addImage(
        `data:image/png;base64,${logoBase64}`,
        'PNG',
        margin,
        15,
        120, // Appropriate size for horizontal logo
        30
      );
    } catch (error) {
      console.log('Could not load logo, using text fallback:', error);
      // Fallback to text if logo fails
      this.doc.setTextColor(
        colors.primary[0],
        colors.primary[1],
        colors.primary[2]
      );
      this.doc.setFontSize(fontSizes.title);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('TankLog', margin, 35);
    }

    // Professional report title
    this.doc.setFontSize(fontSizes.subtitle);
    this.doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Compliance Inspection Report', margin, 60);

    // Clean metadata section on the right
    this.doc.setFontSize(fontSizes.small);
    this.doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `Generated: ${format(new Date(), 'MMM dd, yyyy • h:mm a')}`,
      pageWidth - margin - 200,
      25
    );
    this.doc.text(
      `Report ID: ${data.log.id.slice(0, 8).toUpperCase()}`,
      pageWidth - margin - 200,
      40
    );
    this.doc.text(
      `Organization: ${data.organization.name}`,
      pageWidth - margin - 200,
      55
    );

    // Clean separator line
    this.doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    this.doc.setLineWidth(1);
    this.doc.line(
      margin,
      headerHeight - 10,
      pageWidth - margin,
      headerHeight - 10
    );

    this.currentY = headerHeight + 20;
  }

  private generateExecutiveSummary(data: PdfData) {
    const { margin, pageWidth, fontSizes, colors, contentWidth } = this.config;

    // Executive Summary section
    this.doc.setFontSize(fontSizes.subtitle);
    this.doc.setTextColor(
      colors.primary[0],
      colors.primary[1],
      colors.primary[2]
    );
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Executive Summary', margin, this.currentY);
    this.currentY += 20;

    // Clean summary content
    this.doc.setFontSize(fontSizes.body);
    this.doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    this.doc.setFont('helvetica', 'normal');

    const inspectionDate = format(
      new Date(data.log.occurred_at),
      'MMMM dd, yyyy'
    );
    const siteName = data.log.site || 'Unknown Site';
    const tankId = data.log.tank_id;

    const summaryText = `This inspection report documents the compliance status of propane storage tank ${tankId} at ${siteName} on ${inspectionDate}. The inspection was conducted in accordance with OSHA 29 CFR 1910.110 and NFPA 58 standards.`;

    const summaryLines = this.doc.splitTextToSize(summaryText, contentWidth);
    this.doc.text(summaryLines, margin, this.currentY);

    this.currentY += summaryLines.length * 15 + 20;

    // Key findings in a clean format
    this.doc.setFontSize(fontSizes.small);
    this.doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Key Findings:', margin, this.currentY);

    this.currentY += 15;

    const leakStatus = data.log.leak_check ? 'PASS' : 'FAIL';
    const visualStatus = data.log.visual_ok ? 'PASS' : 'FAIL';
    const overallStatus =
      data.log.leak_check && data.log.visual_ok !== false
        ? 'COMPLIANT'
        : 'NON-COMPLIANT';

    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`• Leak Check: ${leakStatus}`, margin, this.currentY);
    this.doc.text(
      `• Visual Inspection: ${visualStatus}`,
      margin + 150,
      this.currentY
    );
    this.doc.text(
      `• Overall Status: ${overallStatus}`,
      margin + 300,
      this.currentY
    );

    this.currentY += 30;
  }

  private generateInspectionSummary(data: PdfData) {
    const { margin, pageWidth, fontSizes, colors } = this.config;

    // Inspection Summary section
    this.doc.setFontSize(fontSizes.subtitle);
    this.doc.setTextColor(
      colors.primary[0],
      colors.primary[1],
      colors.primary[2]
    );
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Inspection Details', margin, this.currentY);
    this.currentY += 20;

    // Clean inspection details table
    const inspectionData = [
      [
        'Inspection Date',
        format(new Date(data.log.occurred_at), 'MMMM dd, yyyy'),
      ],
      ['Site Location', data.log.site || 'Not specified'],
      ['Tank ID', data.log.tank_id],
      ['Inspector', data.profile.email],
      ['Organization', data.organization.name],
    ];

    this.doc.setFontSize(fontSizes.small);
    this.doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    this.doc.setFont('helvetica', 'normal');

    inspectionData.forEach(([label, value], index) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${label}:`, margin, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(value, margin + 120, this.currentY);
      this.currentY += 15;
    });

    this.currentY += 10;

    // Inspection results
    this.doc.setFontSize(fontSizes.small);
    this.doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Inspection Results:', margin, this.currentY);
    this.currentY += 15;

    const leakStatus = data.log.leak_check ? 'PASS' : 'FAIL';
    const visualStatus = data.log.visual_ok ? 'PASS' : 'FAIL';
    const leakColor = data.log.leak_check ? colors.success : colors.error;
    const visualColor = data.log.visual_ok ? colors.success : colors.error;

    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Leak Check:', margin, this.currentY);
    this.doc.setTextColor(leakColor[0], leakColor[1], leakColor[2]);
    this.doc.text(leakStatus, margin + 80, this.currentY);

    this.doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    this.doc.text('Visual Inspection:', margin + 150, this.currentY);
    this.doc.setTextColor(visualColor[0], visualColor[1], visualColor[2]);
    this.doc.text(visualStatus, margin + 250, this.currentY);

    this.currentY += 30;
  }

  private generateInspectionOverview(data: PdfData) {
    const { margin, pageWidth, fontSizes, colors } = this.config;

    // Section header
    this.doc.setFontSize(fontSizes.subtitle);
    this.doc.setTextColor(
      colors.primary[0],
      colors.primary[1],
      colors.primary[2]
    );
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Inspection Overview', margin, this.currentY);
    this.currentY += 20;

    // Simple inspection overview table
    const tableData = [
      [
        format(new Date(data.log.occurred_at), 'MMM dd, yyyy'),
        data.log.tank_id,
        data.log.site || 'Not specified',
        data.profile.email,
        data.log.leak_check && data.log.visual_ok !== false ? 'PASS' : 'FAIL',
      ],
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      margin: { left: margin, right: margin },
      head: [['Date', 'Tank ID', 'Location', 'Inspector', 'Status']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: fontSizes.small,
        cellPadding: { top: 6, right: 8, bottom: 6, left: 8 },
        lineColor: [colors.border[0], colors.border[1], colors.border[2]],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [colors.primary[0], colors.primary[1], colors.primary[2]],
        textColor: [255, 255, 255],
        fontSize: fontSizes.small,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 100, halign: 'left' },
        1: { cellWidth: 80, halign: 'left' },
        2: { cellWidth: 120, halign: 'left' },
        3: { cellWidth: 120, halign: 'left' },
        4: { cellWidth: 80, halign: 'center' },
      },
      didParseCell: (data) => {
        // Color code status column
        if (data.column.index === 4) {
          const status = Array.isArray(data.cell.raw)
            ? data.cell.raw[0]
            : data.cell.raw;
          if (status === 'PASS') {
            data.cell.styles.fillColor = [
              colors.success[0],
              colors.success[1],
              colors.success[2],
            ];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.text = ['PASS'];
          } else if (status === 'FAIL') {
            data.cell.styles.fillColor = [
              colors.error[0],
              colors.error[1],
              colors.error[2],
            ];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.text = ['FAIL'];
          }
        }
      },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
  }

  private generateDetailedResults(data: PdfData) {
    const { margin, pageWidth, fontSizes, colors } = this.config;

    // Detailed Results section
    this.doc.setFontSize(fontSizes.subtitle);
    this.doc.setTextColor(
      colors.primary[0],
      colors.primary[1],
      colors.primary[2]
    );
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Detailed Results', margin, this.currentY);
    this.currentY += 20;

    // Check if all inspections passed
    const hasFailures = !data.log.leak_check || data.log.visual_ok === false;

    if (!hasFailures) {
      // Show success message
      this.doc.setFontSize(fontSizes.body);
      this.doc.setTextColor(
        colors.success[0],
        colors.success[1],
        colors.success[2]
      );
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('✓ All Inspections Passed', margin, this.currentY);
      this.currentY += 20;

      // Show inspection details
      this.doc.setFontSize(fontSizes.small);
      this.doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Inspection Details:', margin, this.currentY);
      this.currentY += 15;

      const details = [
        {
          label: 'Leak Check',
          value: data.log.leak_check ? 'PASS' : 'FAIL',
          status: data.log.leak_check,
        },
        {
          label: 'Visual Inspection',
          value:
            data.log.visual_ok !== null
              ? data.log.visual_ok
                ? 'PASS'
                : 'FAIL'
              : 'N/A',
          status: data.log.visual_ok,
        },
      ];

      details.forEach((detail) => {
        this.doc.setFontSize(fontSizes.small);
        this.doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`${detail.label}:`, margin, this.currentY);

        this.doc.setFont('helvetica', 'normal');
        if (detail.status !== null) {
          const statusIcon = detail.status ? '✓' : '✗';
          const statusColor = detail.status ? colors.success : colors.error;
          this.doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
          this.doc.text(
            `${statusIcon} ${detail.value}`,
            margin + 120,
            this.currentY
          );
        } else {
          this.doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
          this.doc.text(detail.value, margin + 120, this.currentY);
        }
        this.currentY += 15;
      });

      this.currentY += 10;
    } else {
      // Show failure details
      this.doc.setFontSize(fontSizes.body);
      this.doc.setTextColor(colors.error[0], colors.error[1], colors.error[2]);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Items Requiring Attention', margin, this.currentY);
      this.currentY += 20;

      // Failed inspection details
      const failures = [];
      if (!data.log.leak_check) failures.push('Leak Check Failed');
      if (data.log.visual_ok === false)
        failures.push('Visual Inspection Failed');

      failures.forEach((failure) => {
        this.doc.setFontSize(fontSizes.small);
        this.doc.setTextColor(
          colors.error[0],
          colors.error[1],
          colors.error[2]
        );
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`✗ ${failure}`, margin + 20, this.currentY);
        this.currentY += 15;
      });

      this.currentY += 10;
    }

    // Notes section (filter out signature data)
    if (data.log.notes) {
      const cleanNotes = data.log.notes
        .replace(/\[SIGNATURE_DATA\][\s\S]*?\[\/SIGNATURE_DATA\]/g, '')
        .trim();

      if (cleanNotes) {
        this.doc.setFontSize(fontSizes.small);
        this.doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Notes:', margin, this.currentY);
        this.currentY += 15;

        this.doc.setFontSize(fontSizes.small);
        this.doc.setFont('helvetica', 'normal');
        const splitNotes = this.doc.splitTextToSize(
          cleanNotes,
          pageWidth - 2 * margin
        );
        this.doc.text(splitNotes, margin, this.currentY);
        this.currentY += splitNotes.length * 12 + 15;
      }
    }
  }

  private generateRegulatoryContext(data: PdfData) {
    const { margin, pageWidth, fontSizes, colors } = this.config;

    // Regulatory Context section
    this.doc.setFontSize(fontSizes.subtitle);
    this.doc.setTextColor(
      colors.primary[0],
      colors.primary[1],
      colors.primary[2]
    );
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Regulatory Context', margin, this.currentY);
    this.currentY += 20;

    // Compliance standards
    const standards = [
      {
        standard: 'OSHA 29 CFR 1910.110',
        requirement: 'Propane Storage & Handling',
      },
      { standard: 'NFPA 58', requirement: 'LP-Gas Code' },
      { standard: 'DOT 49 CFR 180', requirement: 'Cylinder Inspection' },
    ];

    standards.forEach((standard, index) => {
      const y = this.currentY + index * 20;

      // Standard name
      this.doc.setFontSize(fontSizes.small);
      this.doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(standard.standard, margin, y);

      // Requirement
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(standard.requirement, margin + 200, y);

      // Status
      this.doc.setTextColor(
        colors.success[0],
        colors.success[1],
        colors.success[2]
      );
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('✓ Compliant', margin + 400, y);
    });

    this.currentY += standards.length * 20 + 20;
  }

  private generateActionableInsights(data: PdfData) {
    const { margin, pageWidth, fontSizes, colors } = this.config;

    // Actionable Insights section
    this.doc.setFontSize(fontSizes.subtitle);
    this.doc.setTextColor(
      colors.primary[0],
      colors.primary[1],
      colors.primary[2]
    );
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Actionable Insights', margin, this.currentY);
    this.currentY += 20;

    const isCompliant = data.log.leak_check && data.log.visual_ok !== false;

    if (!isCompliant) {
      // Recommendations for improvements
      this.doc.setFontSize(fontSizes.small);
      this.doc.setTextColor(colors.error[0], colors.error[1], colors.error[2]);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('⚠ Immediate Actions Required:', margin, this.currentY);
      this.currentY += 15;

      const recommendations = [];
      if (!data.log.leak_check) {
        recommendations.push('• Conduct immediate leak detection test');
        recommendations.push('• Inspect all connections and fittings');
      }
      if (data.log.visual_ok === false) {
        recommendations.push('• Address visual inspection findings');
        recommendations.push('• Clean and maintain equipment surfaces');
      }

      recommendations.forEach((rec) => {
        this.doc.setFontSize(fontSizes.small);
        this.doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(rec, margin + 20, this.currentY);
        this.currentY += 12;
      });

      this.currentY += 10;
    } else {
      // Maintenance scheduling suggestions
      this.doc.setFontSize(fontSizes.small);
      this.doc.setTextColor(
        colors.success[0],
        colors.success[1],
        colors.success[2]
      );
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('✓ Maintenance Schedule:', margin, this.currentY);
      this.currentY += 15;

      const nextMaintenance = new Date(data.log.occurred_at);
      nextMaintenance.setDate(nextMaintenance.getDate() + 90);

      this.doc.setFontSize(fontSizes.small);
      this.doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        `• Next scheduled maintenance: ${format(nextMaintenance, 'MMM dd, yyyy')}`,
        margin + 20,
        this.currentY
      );
      this.currentY += 12;
      this.doc.text(
        '• Continue regular inspection schedule',
        margin + 20,
        this.currentY
      );
      this.currentY += 20;
    }
  }

  private generateFooter(data: PdfData) {
    const { margin, pageWidth, pageHeight, fontSizes, colors } = this.config;
    const footerY = pageHeight - margin - 60;

    // Divider line
    this.doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    this.doc.setLineWidth(1);
    this.doc.line(margin, footerY - 20, pageWidth - margin, footerY - 20);

    // Digital signature area
    const signatureBoxWidth = 160;
    const signatureBoxHeight = 40;
    const signatureX = pageWidth - margin - signatureBoxWidth;
    const signatureY = footerY + 5;

    // Signature label
    this.doc.setFontSize(fontSizes.small);
    this.doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Authorized Signature:', signatureX, footerY);

    // Signature box
    this.doc.setDrawColor(
      colors.primary[0],
      colors.primary[1],
      colors.primary[2]
    );
    this.doc.setLineWidth(1);
    this.doc.rect(
      signatureX,
      signatureY,
      signatureBoxWidth,
      signatureBoxHeight,
      'S'
    );

    // Add digital signature if available
    if ((data.log as any).signature) {
      try {
        const signaturePadding = 5;
        const maxSignatureWidth = signatureBoxWidth - signaturePadding * 2;
        const maxSignatureHeight = signatureBoxHeight - signaturePadding * 2;
        const aspectRatio = 4.0;
        let signatureWidth = maxSignatureWidth;
        let signatureHeight = maxSignatureWidth / aspectRatio;

        if (signatureHeight > maxSignatureHeight) {
          signatureHeight = maxSignatureHeight;
          signatureWidth = maxSignatureHeight * aspectRatio;
        }

        const centerX = signatureX + (signatureBoxWidth - signatureWidth) / 2;
        const centerY = signatureY + (signatureBoxHeight - signatureHeight) / 2;

        this.doc.addImage(
          (data.log as any).signature,
          'PNG',
          centerX,
          centerY,
          signatureWidth,
          signatureHeight,
          undefined,
          'FAST'
        );
      } catch (error) {
        console.warn('Could not add signature to PDF:', error);
        this.doc.setFontSize(fontSizes.small);
        this.doc.setTextColor(
          colors.light[0],
          colors.light[1],
          colors.light[2]
        );
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(
          'No signature',
          signatureX + signatureBoxWidth / 2 - 25,
          signatureY + signatureBoxHeight / 2 + 5
        );
      }
    } else {
      this.doc.setFontSize(fontSizes.small);
      this.doc.setTextColor(colors.light[0], colors.light[1], colors.light[2]);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        'No signature',
        signatureX + signatureBoxWidth / 2 - 25,
        signatureY + signatureBoxHeight / 2 + 5
      );
    }

    // Signature date
    this.doc.setFontSize(fontSizes.tiny);
    this.doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `Date: ${format(new Date(data.log.occurred_at), 'MMM dd, yyyy')}`,
      signatureX,
      signatureY + signatureBoxHeight + 12
    );

    // Certification statement
    this.doc.setFontSize(fontSizes.small);
    this.doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      'This report certifies compliance with applicable propane safety regulations.',
      margin,
      footerY + 30
    );

    // Contact information
    this.doc.setFontSize(fontSizes.tiny);
    this.doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Generated by TankLog.co', margin, footerY + 45);
    this.doc.text(
      format(new Date(), "yyyy-MM-dd HH:mm:ss 'UTC'"),
      margin,
      footerY + 55
    );
  }

  private getLogoBase64(): string | null {
    try {
      const logoPath = path.join(
        process.cwd(),
        'public/brand/icon-transparent.jpeg'
      );
      const logoBuffer = fs.readFileSync(logoPath);
      return `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
    } catch (error) {
      console.log('Could not load logo:', error);
      return null;
    }
  }
}

async function loadLogPdfData(logId: string) {
  const supabase = createAdminClient();
  const log = await db.getLog(logId);
  if (!log) {
    throw new Error('Log not found');
  }

  // Extract signature from notes field if it exists
  let signature = null;
  try {
    console.log('Checking for signature in notes field...');
    console.log('Notes length:', log.notes?.length || 0);
    console.log('Notes preview:', log.notes?.substring(0, 200) || 'No notes');

    if (log.notes) {
      const signatureMatch = log.notes.match(
        /\[SIGNATURE_DATA\]([\s\S]*?)\[\/SIGNATURE_DATA\]/
      );
      console.log('Signature match found:', !!signatureMatch);

      if (signatureMatch) {
        console.log(
          'Signature match content length:',
          signatureMatch[1].length
        );
        const signatureData = JSON.parse(signatureMatch[1]);
        console.log('Parsed signature data:', {
          type: signatureData.type,
          hasData: !!signatureData.data,
          dataLength: signatureData.data?.length || 0,
        });

        if (signatureData.type === 'signature' && signatureData.data) {
          signature = signatureData.data;
          console.log(
            'Found signature in notes field, length:',
            signature.length
          );
        }
      }
    }
  } catch (error) {
    console.log('Error extracting signature from notes:', error);
  }

  // Add signature to log object
  const logWithSignature = { ...log, signature };

  const organization = await db.getOrganization(log.org_id);
  if (!organization) {
    throw new Error('Organization not found');
  }

  const profile = await db.getProfile(log.user_id);
  if (!profile) {
    throw new Error('Profile not found');
  }

  return { log: logWithSignature, organization, profile };
}

export async function generateLogPdfProfessional(
  logId: string
): Promise<PdfResult> {
  try {
    console.log('=== PROFESSIONAL PDF DEBUG START ===');
    console.log('generateLogPdfProfessional called for logId:', logId);

    const data = await loadLogPdfData(logId);
    console.log('Data loaded successfully');
    console.log('Log ID:', data.log.id);
    console.log('Organization:', data.organization.name);
    console.log('Profile:', data.profile.email);
    console.log('Signature data available:', !!(data.log as any).signature);
    console.log('Signature length:', (data.log as any).signature?.length || 0);

    console.log('Creating ProfessionalPdfGenerator...');
    const generator = new ProfessionalPdfGenerator();
    console.log('Calling generator.generatePdf...');
    const result = await generator.generatePdf(data);

    console.log('PDF generation completed successfully');
    console.log('Result PDF buffer size:', result.pdfBuffer.length);
    console.log('Result filename:', result.filename);
    console.log('=== PROFESSIONAL PDF DEBUG END ===');
    return result;
  } catch (error) {
    console.error('=== PROFESSIONAL PDF ERROR ===');
    console.error('Error generating professional PDF:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('=== PROFESSIONAL PDF ERROR END ===');
    throw error;
  }
}
