'use client';

import { memo } from 'react';
import { useAuth } from '@/lib/auth';
import { DesktopHeader, MobileHeader, BottomNav } from './navigation';

interface AppShellProps {
  children: React.ReactNode;
  showSignIn?: boolean;
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

const AppShell = memo(function AppShell({
  children,
  showSignIn = false,
  title,
  showBackButton = false,
  onBackClick,
  breadcrumbs,
}: AppShellProps) {
  const { user, profile } = useAuth();

  // Don't show navigation for sign-in pages
  if (showSignIn || !user) {
    return (
      <div className="min-h-screen bg-white">
        <main className="px-4 py-6">
          <div className="max-w-md mx-auto">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Header */}
      <DesktopHeader breadcrumbs={breadcrumbs} />

      {/* Mobile Header */}
      <MobileHeader
        title={title}
        showBackButton={showBackButton}
        onBackClick={onBackClick}
      />

      {/* Main content */}
      <main className="pb-20">
        <div className="px-4 py-6 md:px-6 md:py-8">
          <div className="max-w-md mx-auto md:max-w-none">{children}</div>
        </div>
      </main>

      {/* Bottom Navigation - Now works on all screen sizes */}
      <BottomNav />
    </div>
  );
});

export default AppShell;
