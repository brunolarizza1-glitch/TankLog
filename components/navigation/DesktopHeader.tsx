'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DesktopHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({ breadcrumbs = [] }) => {
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate breadcrumbs based on current path if not provided
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (breadcrumbs.length > 0) return breadcrumbs;

    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbMap: Record<string, string> = {
      dashboard: 'Dashboard',
      logs: 'Inspections',
      'logs/new': 'New Inspection',
      'corrective-actions': 'Corrective Actions',
      settings: 'Settings',
      'settings/compliance': 'Compliance Settings',
      profile: 'Profile',
    };

    return pathSegments.map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      return {
        label: breadcrumbMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: index === pathSegments.length - 1 ? undefined : href,
      };
    });
  };

  const currentBreadcrumbs = getBreadcrumbs();

  return (
    <header className="hidden md:block h-16 bg-white border-b border-gray-200">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <Image
              src="/logo.svg"
              alt="TankLog"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-gray-700">TankLog</span>
          </Link>
        </div>

        {/* Center: Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1">
          {currentBreadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <svg
                  className="w-4 h-4 text-gray-400 mx-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-sm font-medium text-gray-500 hover:text-primary-blue transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Right: User Menu & Notifications */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-500 hover:text-primary-blue transition-colors duration-200"
            aria-label="Notifications"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-danger rounded-full"></span>
          </button>

          {/* User Avatar & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <svg
                className="w-4 h-4 text-gray-500"
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

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-md border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-700">{profile?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{profile?.email || user?.email}</p>
                </div>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Profile Settings
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  App Settings
                </Link>
                <div className="border-t border-gray-100">
                  <Link
                    href="/api/auth/signout"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Sign Out
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-6 top-16 w-80 bg-white rounded-lg shadow-md border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
          </div>
          <div className="px-4 py-3 text-sm text-gray-500">
            No new notifications
          </div>
        </div>
      )}
    </header>
  );
};

export default DesktopHeader;
