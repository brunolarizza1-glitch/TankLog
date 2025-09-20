'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SignInPage() {
  const { signInWithGoogle, signInWithMagicLink, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isMagicLinkMode, setIsMagicLinkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Check for error parameters in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error === 'auth_error') {
      setMessage('Authentication failed. Please try again.');
    } else if (error === 'bootstrap_error') {
      setMessage('Failed to set up your account. Please contact support.');
    } else if (error === 'oauth_error') {
      setMessage('Google sign-in failed. Please try again.');
    }
  }, []);

  // Redirect if already signed in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setMessage('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setMessage('');
    try {
      await signInWithMagicLink(email);
      setMessage(
        'Magic link sent! Check your email and click the link to sign in.'
      );
    } catch (error) {
      setMessage('Failed to send magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <Image
            src="/logo-square.png"
            alt="TankLog"
            width={80}
            height={80}
            className="brand-img h-20 w-20 mx-auto"
            style={{
              minHeight: '80px',
              minWidth: '80px',
              backgroundColor: 'transparent',
              background: 'transparent',
            }}
            onError={(e) => {
              e.currentTarget.src = '/logo.png';
            }}
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-brand-dark">
              Sign in to TankLog
            </h1>
            <p className="text-gray-600">
              Choose your preferred sign-in method
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.includes('sent') || message.includes('success')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-3 hover:border-gray-400"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {!isMagicLinkMode ? (
            <button
              onClick={() => setIsMagicLinkMode(true)}
              className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl text-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Email (Magic Link)
            </button>
          ) : (
            <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your email address"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send Magic Link
                </button>
                <button
                  type="button"
                  onClick={() => setIsMagicLinkMode(false)}
                  className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        <div className="text-center">
          <a
            href="/"
            className="text-brand-blue text-sm font-medium hover:underline"
          >
            ← Back to home
          </a>
        </div>
      </div>
    </AppShell>
  );
}
