'use client';

import { useState } from 'react';
import { downloadLogPdf, downloadPdfFromUrl, LogData } from '@/lib/pdf-utils';

interface PDFDownloadButtonProps {
  log: LogData;
  pdfUrl?: string;
  className?: string;
  children?: React.ReactNode;
  variant?: 'button' | 'link' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

export default function PDFDownloadButton({
  log,
  pdfUrl,
  className = '',
  children = 'Download PDF',
  variant = 'button',
  size = 'md',
}: PDFDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (e: React.MouseEvent) => {
    console.log('🔍 PDF Button Debug: Download button clicked');
    console.log('🔍 PDF Button Debug: Event details:', {
      type: e.type,
      target: e.target,
      currentTarget: e.currentTarget,
    });
    console.log('🔍 PDF Button Debug: Log data:', log);
    console.log('🔍 PDF Button Debug: PDF URL:', pdfUrl);

    // Prevent default behavior and event propagation
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔍 PDF Button Debug: Prevented default behavior');

    // Clear previous error
    setError(null);

    try {
      console.log('🔍 PDF Button Debug: Starting download process...');
      console.log('🔍 PDF Button Debug: Log data:', {
        id: log.id,
        site: log.site,
        tank_id: log.tank_id,
        hasPdfUrl: !!pdfUrl,
        pdfUrl: pdfUrl,
      });

      // If we have a PDF URL, try downloading from URL first
      if (pdfUrl) {
        console.log('🔍 PDF Button Debug: Using PDF URL method');
        const filename = `TankLog_Report_${log.tank_id}_${new Date(log.occurred_at)
          .toISOString()
          .replace('T', '_')
          .replace(/\.\d{3}Z$/, '')
          .replace(/:/g, '-')}.pdf`;
        
        await downloadPdfFromUrl(pdfUrl, filename);
      } else {
        console.log('🔍 PDF Button Debug: Using client-side PDF generation');
        // Generate PDF client-side
        await downloadLogPdf(log, {
          onLoading: setIsLoading,
          onError: setError,
          onSuccess: () => {
            console.log('✅ PDF Button Debug: PDF generated successfully');
          },
        });
      }
    } catch (error) {
      console.error('❌ PDF Button Debug: Download failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-2 text-base',
    };

    const variantClasses = {
      button: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary rounded-md',
      link: 'text-primary hover:text-primary-dark underline bg-transparent',
      icon: 'p-2 text-primary hover:text-primary-dark rounded-md hover:bg-gray-100',
    };

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Generating...
        </>
      );
    }

    if (error) {
      return (
        <>
          <span className="text-red-500 mr-2">⚠️</span>
          Error
        </>
      );
    }

    return children;
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isLoading}
      className={getButtonClasses()}
      title={error ? `Error: ${error}` : 'Download PDF report'}
    >
      {getButtonContent()}
    </button>
  );
}
