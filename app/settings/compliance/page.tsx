'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import { ComplianceMode, COMPLIANCE_MODES } from '@/lib/compliance';

export default function ComplianceSettingsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [complianceMode, setComplianceMode] =
    useState<ComplianceMode>('US_NFPA58');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  // Redirect if not admin
  useEffect(() => {
    if (!loading && user && profile && profile.role !== 'admin') {
      router.push('/settings');
    }
  }, [user, profile, loading, router]);

  const loadComplianceMode = useCallback(async () => {
    if (!profile?.org_id) return;

    try {
      const response = await fetch(
        `/api/organizations/${profile.org_id}/compliance-mode`
      );
      if (response.ok) {
        const data = await response.json();
        setComplianceMode(data.compliance_mode || 'US_NFPA58');
      }
    } catch (error) {}
  }, [profile?.org_id]);

  // Load compliance mode
  useEffect(() => {
    if (profile?.org_id) {
      loadComplianceMode();
    }
  }, [profile?.org_id, loadComplianceMode]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.org_id) return;

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        `/api/organizations/${profile.org_id}/compliance-mode`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ compliance_mode: complianceMode }),
        }
      );

      if (response.ok) {
        setMessage('Compliance mode updated successfully!');
      } else {
        const errorData = await response.json();
        setMessage(
          errorData.error ||
            `Failed to update compliance mode. Status: ${response.status}`
        );
      }
    } catch (error) {
      setMessage('Failed to save compliance mode.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (loading || !user || !profile) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  // Show access denied
  if (profile.role !== 'admin') {
    return (
      <AppShell>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-brand-dark mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            Only administrators can manage compliance settings.
          </p>
          <a href="/settings" className="text-brand-blue hover:underline">
            ← Back to Settings
          </a>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-dark">
            Compliance Settings
          </h1>
          <a
            href="/settings"
            className="text-primary text-sm font-medium hover:underline"
          >
            ← Back to Settings
          </a>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.includes('success')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-brand-dark mb-4">
              Select Compliance Mode
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Choose the compliance standard that applies to your organization.
              This will affect form labels, validation rules, and PDF generation
              for all new logs.
            </p>

            <div className="space-y-4">
              {Object.values(COMPLIANCE_MODES).map((mode) => (
                <div
                  key={mode.mode}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="complianceMode"
                      value={mode.mode}
                      checked={complianceMode === mode.mode}
                      onChange={(e) =>
                        setComplianceMode(e.target.value as ComplianceMode)
                      }
                      className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-brand-dark">
                          {mode.title}
                        </span>
                        {mode.mode === 'US_NFPA58' && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {mode.description}
                      </p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">Important Note</h3>
            <p className="text-sm text-yellow-700">
              Changing the compliance mode will only affect new logs created
              after this change. Existing logs will continue to use the
              compliance mode that was active when they were created.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-4 px-6 rounded-xl text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Compliance Mode'}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
