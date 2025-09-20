'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }

    // Load organization data
    loadOrganizationData();
  }, [user, router]);

  const loadOrganizationData = useCallback(async () => {
    if (!profile?.org_id) return;

    try {
      const response = await fetch(`/api/organizations/${profile.org_id}`);
      if (response.ok) {
        const org = await response.json();
        setCompanyName(org.name || '');
        setLogoUrl(org.logo_url || '');
      }
    } catch (error) {}
  }, [profile?.org_id]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.org_id) return;

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/organizations/${profile.org_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyName,
          logo_url: logoUrl,
        }),
      });

      if (response.ok) {
        setMessage('Company settings saved successfully!');
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to save settings');
      }
    } catch (error) {
      setMessage('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.org_id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orgId', profile.org_id);

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        setLogoUrl(url);
        setMessage('Logo uploaded successfully!');
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to upload logo');
      }
    } catch (error) {
      setMessage('Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to signin
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-brand-dark">Settings</h1>
          <p className="text-gray-600">Manage your company settings</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg text-sm ${
              message.includes('success')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* Company Settings */}
        <form onSubmit={handleSaveCompany} className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-brand-dark">Company</h2>

            {/* Company Name */}
            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>

              {/* Current Logo */}
              {logoUrl && (
                <div className="mb-4">
                  <Image
                    src={logoUrl}
                    alt="Company logo"
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}

              {/* Upload Input */}
              <div className="flex items-center space-x-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <div className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 transition-colors">
                    {isUploading ? (
                      <span className="text-gray-500">Uploading...</span>
                    ) : (
                      <span className="text-gray-600">
                        {logoUrl ? 'Change Logo' : 'Upload Logo'}
                      </span>
                    )}
                  </div>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                JPEG, PNG, or GIF. Max 5MB.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isLoading || isUploading}
            className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>

        {/* Compliance Settings */}
        {profile?.role === 'admin' && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-brand-dark mb-4">
              Compliance
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Manage compliance standards and form validation rules for your
              organization.
            </p>
            <a
              href="/settings/compliance"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Manage Compliance Settings
              <svg
                className="ml-2 h-4 w-4"
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
            </a>
          </div>
        )}

        {/* Back to home */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-primary text-sm font-medium hover:underline"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </AppShell>
  );
}
