import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { Log, Profile, Organization } from '@/server/db';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface PdfData {
  log: Log;
  profile: Profile;
  organization: Organization;
  complianceMode: string;
}

interface PdfConfig {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  contentHeight: number;
  headerHeight: number;
  footerHeight: number;
  logoSize: number;
}

export class ProfessionalPdfGenerator {
  private doc: jsPDF;
  private config: PdfConfig;
  private currentY: number = 0;
  private pageNumber: number = 1;
  private totalPages: number = 1;

  constructor() {
    // US Letter: 8.5" x 11" = 612 x 792 points
    this.config = {
      pageWidth: 612,
      pageHeight: 792,
      margin: 54, // 0.75" = 54 points
      contentWidth: 0,
      contentHeight: 0,
      headerHeight: 120,
      footerHeight: 80,
      logoSize: 60,
    };

    this.config.contentWidth = this.config.pageWidth - this.config.margin * 2;
    this.config.contentHeight =
      this.config.pageHeight -
      this.config.headerHeight -
      this.config.footerHeight -
      this.config.margin * 2;

    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });

    this.setupFonts();
  }

  private setupFonts() {
    // Add custom fonts if needed
    this.doc.setFont('helvetica');
  }

  public async generatePdf(data: PdfData): Promise<{
    pdfBuffer: Uint8Array;
    filename: string;
    pdfUrl: string;
    storagePath: string;
  }> {
    try {
      // Calculate total pages first
      this.calculateTotalPages(data);

      // Generate each page
      this.generateHeader(data);
      this.generateReportMetadata(data);
      this.generateInspectionDetails(data);
      this.generateFooter(data);

      // Generate filename
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const filename = `TankLog_Report_${data.log.tank_id}_${timestamp}.pdf`;

      // Convert to buffer
      const pdfBuffer = this.doc.output('arraybuffer') as ArrayBuffer;
      const uint8Array = new Uint8Array(pdfBuffer);

      return {
        pdfBuffer: uint8Array,
        filename,
        pdfUrl: '', // Will be set by caller
        storagePath: `reports/${filename}`,
      };
    } catch (error) {
      console.error('Error generating professional PDF:', error);
      throw error;
    }
  }

  private calculateTotalPages(data: PdfData) {
    // Estimate pages based on content
    let estimatedHeight = 0;

    // Header
    estimatedHeight += this.config.headerHeight;

    // Report metadata
    estimatedHeight += 200;

    // Inspection details table
    estimatedHeight += 300; // Base table height

    // Footer
    estimatedHeight += this.config.footerHeight;

    // Calculate pages needed
    const availableHeight = this.config.pageHeight - this.config.margin * 2;
    this.totalPages = Math.ceil(estimatedHeight / availableHeight);
  }

  private generateHeader(data: PdfData) {
    const { margin, logoSize, pageWidth } = this.config;

    // Background watermark
    this.doc.setFillColor(248, 250, 252); // Very light gray
    this.doc.rect(0, 0, pageWidth, this.config.pageHeight, 'F');

    // TankLog logo (placeholder - would need actual logo integration)
    this.doc.setFillColor(37, 99, 235); // Blue
    this.doc.rect(margin, margin, logoSize, logoSize, 'F');

    // Logo text
    this.doc.setFontSize(16);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('TL', margin + 20, margin + 35);

    // Company name
    this.doc.setFontSize(24);
    this.doc.setTextColor(17, 24, 39); // Dark gray
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TankLog', margin + logoSize + 20, margin + 30);

    // Report title
    this.doc.setFontSize(18);
    this.doc.setTextColor(55, 65, 81); // Medium gray
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      'Propane Compliance Report',
      margin + logoSize + 20,
      margin + 50
    );

    // Generation date
    this.doc.setFontSize(10);
    this.doc.setTextColor(107, 114, 128); // Light gray
    this.doc.text(
      `Generated: ${format(new Date(), "MMM dd, yyyy 'at' h:mm a")}`,
      margin + logoSize + 20,
      margin + 70
    );

    // Page numbering
    this.doc.setFontSize(10);
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(
      `Page ${this.pageNumber} of ${this.totalPages}`,
      pageWidth - margin - 60,
      margin + 30
    );

    // Divider line
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(1);
    this.doc.line(
      margin,
      margin + logoSize + 20,
      pageWidth - margin,
      margin + logoSize + 20
    );

    this.currentY = margin + logoSize + 40;
  }

  private generateReportMetadata(data: PdfData) {
    const { margin, contentWidth } = this.config;

    // Section title
    this.doc.setFontSize(14);
    this.doc.setTextColor(17, 24, 39);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Report Summary', margin, this.currentY);
    this.currentY += 25;

    // Metadata grid
    const gridWidth = contentWidth / 2;
    const gridHeight = 80;

    // Left column
    this.generateMetadataBox(
      margin,
      this.currentY,
      gridWidth - 10,
      gridHeight,
      'Inspection Details',
      [
        `Date: ${format(parseISO(data.log.occurred_at), 'MMM dd, yyyy')}`,
        `Time: ${format(parseISO(data.log.occurred_at), 'h:mm a')}`,
        `Tank ID: ${data.log.tank_id}`,
        `Site: ${data.log.site || 'N/A'}`,
      ]
    );

    // Right column
    this.generateMetadataBox(
      margin + gridWidth + 10,
      this.currentY,
      gridWidth - 10,
      gridHeight,
      'Compliance Status',
      [
        `Leak Check: ${data.log.leak_check ? 'PASS' : 'FAIL'}`,
        `Visual: ${data.log.visual_ok !== null ? (data.log.visual_ok ? 'PASS' : 'FAIL') : 'N/A'}`,
        `Mode: ${data.complianceMode}`,
        `Tech: ${data.profile.name || data.profile.email}`,
      ]
    );

    this.currentY += gridHeight + 20;
  }

  private generateMetadataBox(
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    items: string[]
  ) {
    // Box background
    this.doc.setFillColor(249, 250, 251);
    this.doc.rect(x, y, width, height, 'F');

    // Border
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(1);
    this.doc.rect(x, y, width, height, 'S');

    // Title
    this.doc.setFontSize(12);
    this.doc.setTextColor(17, 24, 39);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, x + 10, y + 20);

    // Items
    this.doc.setFontSize(10);
    this.doc.setTextColor(55, 65, 81);
    this.doc.setFont('helvetica', 'normal');

    items.forEach((item, index) => {
      this.doc.text(item, x + 10, y + 40 + index * 15);
    });
  }

  private generateInspectionDetails(data: PdfData) {
    const { margin, contentWidth } = this.config;

    // Section title
    this.doc.setFontSize(14);
    this.doc.setTextColor(17, 24, 39);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Inspection Details', margin, this.currentY);
    this.currentY += 25;

    // Create inspection details table
    const tableData = [
      [
        'Equipment ID',
        'Inspection Date',
        'Leak Check',
        'Visual Check',
        'Technician',
        'Notes',
      ],
      [
        data.log.tank_id,
        format(parseISO(data.log.occurred_at), 'MMM dd, yyyy'),
        data.log.leak_check ? 'PASS' : 'FAIL',
        data.log.visual_ok !== null
          ? data.log.visual_ok
            ? 'PASS'
            : 'FAIL'
          : 'N/A',
        data.profile.name || data.profile.email,
        data.log.notes || 'None',
      ],
    ];

    this.doc.autoTable({
      startY: this.currentY,
      margin: { left: margin, right: margin },
      head: [tableData[0]],
      body: [tableData[1]],
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [17, 24, 39],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 80 },
        2: { cellWidth: 60 },
        3: { cellWidth: 60 },
        4: { cellWidth: 100 },
        5: { cellWidth: 120 },
      },
      didDrawPage: (data: any) => {
        this.currentY = data.cursor.y + 20;
      },
    });

    this.currentY += 20;
  }

  private generateFooter(data: PdfData) {
    const { margin, pageWidth, pageHeight } = this.config;
    const footerY = pageHeight - margin - 60;

    // Divider line
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(1);
    this.doc.line(margin, footerY - 20, pageWidth - margin, footerY - 20);

    // Generated by text
    this.doc.setFontSize(8);
    this.doc.setTextColor(107, 114, 128);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Generated by TankLog.co', margin, footerY);
    this.doc.text(
      format(new Date(), 'yyyy-MM-dd HH:mm:ss UTC'),
      margin,
      footerY + 12
    );

    // Digital signature area
    this.doc.setFontSize(8);
    this.doc.setTextColor(55, 65, 81);
    this.doc.text('Authorized Signature:', pageWidth - margin - 150, footerY);
    this.doc.setDrawColor(209, 213, 219);
    this.doc.setLineWidth(1);
    this.doc.rect(pageWidth - margin - 150, footerY + 5, 140, 30, 'S');

    // Contact information
    this.doc.setFontSize(8);
    this.doc.setTextColor(107, 114, 128);
    this.doc.text('For verification: support@tanklog.co', margin, footerY + 30);

    // Disclaimer
    this.doc.setFontSize(7);
    this.doc.setTextColor(156, 163, 175);
    this.doc.text(
      'This report is generated automatically and contains confidential information.',
      margin,
      footerY + 45
    );
  }

  private addNewPage() {
    this.doc.addPage();
    this.pageNumber++;
    this.currentY = this.config.margin;
  }
}

export async function generateProfessionalLogPdf(data: PdfData): Promise<{
  pdfBuffer: Uint8Array;
  filename: string;
  pdfUrl: string;
  storagePath: string;
}> {
  const generator = new ProfessionalPdfGenerator();
  return await generator.generatePdf(data);
}
