'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AppShell from '@/components/AppShell';

export default function HomePage() {
  const { user, profile, loading, signInWithDemo, isDemo } = useAuth();
  const router = useRouter();

  console.log(
    '🏠 HomePage: loading:',
    loading,
    'user:',
    user?.id || 'none',
    'profile:',
    profile?.id || 'none'
  );

  useEffect(() => {
    console.log(
      '🏠 HomePage: useEffect triggered - loading:',
      loading,
      'user:',
      !!user,
      'profile:',
      !!profile
    );
    if (!loading && user && profile?.org_id) {
      console.log('🏠 HomePage: Redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, loading, profile, router]);

  const handleDemoLogin = async () => {
    try {
      await signInWithDemo();
    } catch (error) {
      console.error('Demo login failed:', error);
      alert('Demo login failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  if (user) {
    return (
      <AppShell>
        <div className="space-y-6">
          {/* Welcome message */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark">
              Welcome back, {profile?.name || user.email}!
            </h2>
            <p className="text-gray-600">
              Ready to log your next propane inspection?
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-4">
            <a
              href="/logs/new"
              className="block w-full bg-primary text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors text-center"
            >
              New Log
            </a>

            <a
              href="/logs"
              className="block w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl text-lg font-semibold hover:bg-gray-200 transition-colors text-center"
            >
              View Logs
            </a>
          </div>

          {/* Quick stats placeholder */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-brand-dark mb-4">
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-gray-600">Logs This Month</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-gray-600">Tanks Monitored</div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showSignIn={true}>
      <div className="space-y-6">
        {/* Hero section */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-brand-dark">
            Welcome to TankLog
          </h2>
          <p className="text-gray-600">
            Track your propane usage with ease. No more paper logbooks.
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <a
            href="/logs/new"
            className="block w-full bg-primary text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors text-center"
          >
            New Log
          </a>

          <a
            href="/logs"
            className="block w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl text-lg font-semibold hover:bg-gray-200 transition-colors text-center"
          >
            View Logs
          </a>
        </div>

        {/* Demo and Sign in CTAs */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Try TankLog with sample data or sign in to use your own
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleDemoLogin}
                className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Demo
              </button>
              <a
                href="/signin"
                className="inline-block bg-accent text-brand-dark py-3 px-6 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
              >
                Sign in to get started
              </a>
            </div>
          </div>
        </div>

        {/* Features preview */}
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-brand-dark">Features</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-sm text-gray-600">
                Propane tank inspection logging
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-sm text-gray-600">
                Leak detection and visual inspections
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-sm text-gray-600">
                Professional PDF reports for compliance
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-sm text-gray-600">
                Corrective action tracking
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-sm text-gray-600">
                Regulatory compliance monitoring
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
