'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBackButton = false,
  onBackClick,
}) => {
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  const getPageTitle = () => {
    if (title) return title;

    const pathSegments = pathname.split('/').filter(Boolean);
    const titleMap: Record<string, string> = {
      dashboard: 'Dashboard',
      logs: 'Inspections',
      'logs/new': 'New Inspection',
      'corrective-actions': 'Corrective Actions',
      settings: 'Settings',
      'settings/compliance': 'Compliance Settings',
      profile: 'Profile',
    };

    const lastSegment = pathSegments[pathSegments.length - 1];
    return titleMap[lastSegment] || 'TankLog';
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      window.history.back();
    }
  };

  return (
    <header className="md:hidden h-16 bg-white border-b border-gray-200 safe-area-inset-top">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left: Back button or Logo */}
        <div className="flex items-center">
          {showBackButton ? (
            <button
              onClick={handleBackClick}
              className="p-2 -ml-2 text-gray-500 hover:text-primary-blue transition-colors duration-200"
              aria-label="Go back"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          ) : (
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Image
                src="/logo.svg"
                alt="TankLog"
                width={24}
                height={24}
                className="h-6 w-auto"
              />
              <span className="text-lg font-bold text-gray-700">TankLog</span>
            </Link>
          )}
        </div>

        {/* Center: Page Title */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-700 truncate">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right: Menu Button */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <button
            className="p-2 text-gray-500 hover:text-primary-blue transition-colors duration-200"
            aria-label="Notifications"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-danger rounded-full"></span>
          </button>

          {/* Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-500 hover:text-primary-blue transition-colors duration-200"
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMenu(false)}
          />
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl">
            <div className="h-full flex flex-col">
              {/* Menu Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-700">Menu</h2>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="p-2 text-gray-500 hover:text-primary-blue transition-colors duration-200"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* User Info */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-blue rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {profile?.name?.charAt(0) ||
                        user?.email?.charAt(0) ||
                        'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {profile?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile?.email || user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex-1 px-6 py-4">
                <nav className="space-y-2">
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    onClick={() => setShowMenu(false)}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                      />
                    </svg>
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/logs"
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    onClick={() => setShowMenu(false)}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                    <span>Inspections</span>
                  </Link>
                  <Link
                    href="/corrective-actions"
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    onClick={() => setShowMenu(false)}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <span>Corrective Actions</span>
                  </Link>
                  <Link
                    href="/reports"
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    onClick={() => setShowMenu(false)}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <span>Reports</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    onClick={() => setShowMenu(false)}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>Settings</span>
                  </Link>
                </nav>
              </div>

              {/* Sign Out */}
              <div className="px-6 py-4 border-t border-gray-200">
                <Link
                  href="/api/auth/signout"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  onClick={() => setShowMenu(false)}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Sign Out</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default MobileHeader;
