'use client';

import { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

interface AppShellProps {
  children: React.ReactNode;
  showSignIn?: boolean;
}

const AppShell = memo(function AppShell({
  children,
  showSignIn = false,
}: AppShellProps) {
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setIsMenuOpen(false);
  }, [signOut]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center">
              <img
                src="/logo-horizontal.png"
                alt="TankLog"
                className="brand-img h-12 w-auto max-h-12 sm:max-h-16 hover:opacity-80 transition-opacity cursor-pointer"
                style={{ minHeight: '48px', minWidth: '150px' }}
                onError={(e) => {
                  e.currentTarget.src = '/logo.png';
                }}
              />
            </Link>
            <div>
              <p className="text-sm text-gray-600">
                Replace your propane logbook in 60 seconds.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {user && profile ? (
              <div className="relative">
                {/* User Avatar/Menu */}
                <button
                  onClick={toggleMenu}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                    {(profile?.name || user.email || 'U')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <span className="hidden sm:block">
                    {profile?.name || user.email}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isMenuOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={closeMenu}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : showSignIn ? (
              <Link
                href="/signin"
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-6">
        <div className="max-w-md mx-auto">{children}</div>
      </main>

      {/* Click outside to close menu */}
      {isMenuOpen && <div className="fixed inset-0 z-40" onClick={closeMenu} />}
    </div>
  );
});

export default AppShell;
