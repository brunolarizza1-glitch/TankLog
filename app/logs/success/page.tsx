'use client';

import { useAuth } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LogSuccessPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }
  }, [user, router]);

  if (!user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-brand-dark">
              Log Created Successfully!
            </h1>
            <p className="text-gray-600">
              Your log has been saved and a PDF will be generated and sent to
              your email shortly.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/logs/new')}
              className="w-full bg-primary text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Another Log
            </button>

            <button
              onClick={() => router.push('/logs')}
              className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl text-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              View All Logs
            </button>
          </div>

          {/* Back to home */}
          <div className="pt-4">
            <button
              onClick={() => router.push('/')}
              className="text-primary text-sm font-medium hover:underline"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
