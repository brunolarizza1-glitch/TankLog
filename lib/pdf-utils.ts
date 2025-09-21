'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface LogData {
  id: string;
  site: string;
  tank_id: string;
  occurred_at: string;
  leak_check: boolean;
  visual_ok?: boolean;
  pressure?: string;
  notes?: string;
  corrective_action?: string;
  compliance_mode: string;
  user: {
    name: string;
    email: string;
  };
}

export interface PdfDownloadOptions {
  log: LogData;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onLoading?: (loading: boolean) => void;
}

export class PdfDownloadError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PdfDownloadError';
  }
}

/**
 * Comprehensive PDF download utility with debugging
 */
export class PdfDownloader {
  private static instance: PdfDownloader;
  private isGenerating = false;

  static getInstance(): PdfDownloader {
    if (!PdfDownloader.instance) {
      PdfDownloader.instance = new PdfDownloader();
    }
    return PdfDownloader.instance;
  }

  /**
   * Check if jsPDF is properly loaded
   */
  private checkJsPdfAvailability(): boolean {
    try {
      console.log('🔍 PDF Debug: Checking jsPDF availability...');
      
      if (typeof window === 'undefined') {
        console.error('❌ PDF Debug: jsPDF not available - running on server side');
        return false;
      }

      if (!jsPDF) {
        console.error('❌ PDF Debug: jsPDF is not imported or undefined');
        return false;
      }

      console.log('✅ PDF Debug: jsPDF is available');
      return true;
    } catch (error) {
      console.error('❌ PDF Debug: Error checking jsPDF availability:', error);
      return false;
    }
  }

  /**
   * Generate a basic PDF for testing
   */
  private generateBasicPdf(log: LogData): jsPDF {
    console.log('🔍 PDF Debug: Generating basic PDF...');
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('TankLog Inspection Report', 20, 20);
    
    // Add basic info
    doc.setFontSize(12);
    doc.text(`Site: ${log.site}`, 20, 40);
    doc.text(`Tank ID: ${log.tank_id}`, 20, 50);
    doc.text(`Date: ${new Date(log.occurred_at).toLocaleDateString()}`, 20, 60);
    doc.text(`Inspector: ${log.user.name}`, 20, 70);
    doc.text(`Status: ${log.leak_check ? 'PASS' : 'FAIL'}`, 20, 80);
    
    console.log('✅ PDF Debug: Basic PDF generated successfully');
    return doc;
  }

  /**
   * Generate a comprehensive PDF with table
   */
  private generateComprehensivePdf(log: LogData): jsPDF {
    console.log('🔍 PDF Debug: Generating comprehensive PDF...');
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('TankLog Inspection Report', 20, 20);
    
    // Basic info section
    doc.setFontSize(12);
    const basicInfo = [
      ['Site/Facility', log.site],
      ['Tank/Cylinder ID', log.tank_id],
      ['Date', new Date(log.occurred_at).toLocaleDateString()],
      ['Time', new Date(log.occurred_at).toLocaleTimeString()],
      ['Inspector', log.user.name],
      ['Email', log.user.email],
    ];
    
    if (log.pressure) {
      basicInfo.push(['Pressure', log.pressure]);
    }
    
    // Add basic info table
    (doc as any).autoTable({
      startY: 40,
      head: [['Field', 'Value']],
      body: basicInfo,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Inspection results section
    const inspectionResults = [
      ['Leak Check', log.leak_check ? '✓ PASS' : '✗ FAIL'],
    ];
    
    if (log.visual_ok !== undefined) {
      inspectionResults.push(['Visual Inspection', log.visual_ok ? '✓ All OK' : '✗ Issues Found']);
    }
    
    inspectionResults.push(['Compliance Mode', log.compliance_mode]);
    
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Inspection Result', 'Status']],
      body: inspectionResults,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Notes section
    if (log.notes) {
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Notes']],
        body: [[log.notes]],
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
      });
    }

    // Corrective action section
    if (log.corrective_action) {
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Corrective Action Required']],
        body: [[log.corrective_action]],
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] },
        bodyStyles: { textColor: [220, 38, 38] },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generated by TankLog at ${new Date().toISOString()}`,
        20,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 40,
        doc.internal.pageSize.height - 10
      );
    }

    console.log('✅ PDF Debug: Comprehensive PDF generated successfully');
    return doc;
  }

  /**
   * Download PDF with proper error handling
   */
  async downloadPdf(options: PdfDownloadOptions): Promise<void> {
    const { log, onSuccess, onError, onLoading } = options;

    console.log('🔍 PDF Debug: Starting PDF download process...');
    console.log('🔍 PDF Debug: Log data:', {
      id: log.id,
      site: log.site,
      tank_id: log.tank_id,
      hasUser: !!log.user,
      userName: log.user?.name,
    });

    // Prevent multiple simultaneous downloads
    if (this.isGenerating) {
      console.warn('⚠️ PDF Debug: PDF generation already in progress, skipping...');
      onError?.('PDF generation already in progress');
      return;
    }

    try {
      this.isGenerating = true;
      onLoading?.(true);

      // Check jsPDF availability
      if (!this.checkJsPdfAvailability()) {
        throw new PdfDownloadError('jsPDF library not available', 'JSPDF_UNAVAILABLE');
      }

      // Validate log data
      if (!log || !log.id) {
        throw new PdfDownloadError('Invalid log data provided', 'INVALID_LOG_DATA');
      }

      console.log('🔍 PDF Debug: Generating PDF...');
      
      // Generate PDF (start with basic, then comprehensive)
      let doc: jsPDF;
      try {
        doc = this.generateComprehensivePdf(log);
      } catch (error) {
        console.warn('⚠️ PDF Debug: Comprehensive PDF failed, falling back to basic PDF:', error);
        doc = this.generateBasicPdf(log);
      }

      // Generate filename
      const filename = `TankLog_Report_${log.tank_id}_${new Date(log.occurred_at)
        .toISOString()
        .replace('T', '_')
        .replace(/\.\d{3}Z$/, '')
        .replace(/:/g, '-')}.pdf`;

      console.log('🔍 PDF Debug: Generated filename:', filename);

      // Save PDF
      console.log('🔍 PDF Debug: Saving PDF...');
      doc.save(filename);
      
      console.log('✅ PDF Debug: PDF download completed successfully');
      onSuccess?.();
      
    } catch (error) {
      console.error('❌ PDF Debug: PDF generation failed:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred during PDF generation';
      
      onError?.(errorMessage);
      
      // Show user-friendly error message
      alert(`Failed to generate PDF: ${errorMessage}`);
      
    } finally {
      this.isGenerating = false;
      onLoading?.(false);
      console.log('🔍 PDF Debug: PDF generation process completed');
    }
  }

  /**
   * Download PDF from URL (fallback method)
   */
  async downloadPdfFromUrl(url: string, filename: string): Promise<void> {
    console.log('🔍 PDF Debug: Downloading PDF from URL:', url);
    
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Add to DOM, click, then remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ PDF Debug: PDF downloaded from URL successfully');
    } catch (error) {
      console.error('❌ PDF Debug: Failed to download PDF from URL:', error);
      throw new PdfDownloadError('Failed to download PDF from URL', 'DOWNLOAD_FAILED');
    }
  }
}

/**
 * Convenience function for PDF download
 */
export async function downloadLogPdf(
  log: LogData,
  options?: Partial<PdfDownloadOptions>
): Promise<void> {
  const downloader = PdfDownloader.getInstance();
  await downloader.downloadPdf({
    log,
    ...options,
  });
}

/**
 * Convenience function for PDF download from URL
 */
export async function downloadPdfFromUrl(
  url: string,
  filename: string
): Promise<void> {
  const downloader = PdfDownloader.getInstance();
  await downloader.downloadPdfFromUrl(url, filename);
}
