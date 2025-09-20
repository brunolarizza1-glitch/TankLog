import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'TankLog - Replace your propane logbook in 60 seconds',
  description: 'Replace your propane logbook in 60 seconds.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TankLog',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/brand/icon-original.png',
    apple: '/brand/icon-original.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#114FB3',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA meta tags */}
        <meta name="application-name" content="TankLog" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TankLog" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#114FB3" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Favicon */}
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/brand/icon-original.png"
        />
        <link rel="apple-touch-icon" href="/brand/icon-original.png" />
      </head>
      <body className="bg-white text-brand-dark">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
