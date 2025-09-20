'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useSyncStatus } from '@/lib/sync';
import AppShell from '@/components/AppShell';
import CorrectiveActionsList from '@/components/corrective-actions/CorrectiveActionsList';
import ActionCompletionModal from '@/components/corrective-actions/ActionCompletionModal';
import { CorrectiveActionWithDetails } from '@/lib/corrective-actions-client';
import { useRouter } from 'next/navigation';

export default function MobileCorrectiveActionsPage() {
  const { user } = useAuth();
  const { isOnline, isSyncing } = useSyncStatus();
  const router = useRouter();
  const [selectedAction, setSelectedAction] =
    useState<CorrectiveActionWithDetails | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [filter, setFilter] = useState<
    'all' | 'overdue' | 'due_soon' | 'on_track'
  >('all');

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }
  }, [user, router]);

  const handleActionClick = (action: CorrectiveActionWithDetails) => {
    setSelectedAction(action);
    setShowCompletionModal(true);
  };

  const handleMarkCompleted = (actionId: string) => {
    // This will be handled by the CorrectiveActionsList component
    setShowCompletionModal(true);
  };

  const handleCompleteAction = async (
    actionId: string,
    resolutionNotes: string,
    photoEvidence?: string
  ) => {
    try {
      const response = await fetch(`/api/corrective-actions/${actionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
          resolutionNotes,
          photoEvidence,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete action');
      }

      // Refresh the list
      window.location.reload();
    } catch (error) {
      console.error('Failed to complete action:', error);
      alert('Failed to complete action. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowCompletionModal(false);
    setSelectedAction(null);
  };

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
      <div className="min-h-screen pb-20">
        {/* Mobile Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-primary text-sm font-medium"
            >
              ← Back
            </button>
            <h1 className="text-lg font-semibold text-brand-dark">
              Corrective Actions
            </h1>
            <div className="w-16"></div>
          </div>
        </div>

        {/* Sync Status */}
        {!isOnline && (
          <div className="bg-orange-50 border-b border-orange-200 px-4 py-2">
            <p className="text-sm text-orange-800">
              Offline mode - Changes will sync when online
            </p>
          </div>
        )}

        {isSyncing && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
            <p className="text-sm text-blue-800">Syncing changes...</p>
          </div>
        )}

        {/* Mobile Filters */}
        <div className="px-4 py-3 bg-gray-50 border-b">
          <div className="flex space-x-2 overflow-x-auto">
            {[
              { key: 'all', label: 'All', icon: '📋' },
              { key: 'overdue', label: 'Overdue', icon: '🚨' },
              { key: 'due_soon', label: 'Due Soon', icon: '⚠️' },
              { key: 'on_track', label: 'On Track', icon: '✅' },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-2 rounded-full text-sm whitespace-nowrap flex items-center space-x-1 ${
                  filter === key
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions List */}
        <div className="px-4 py-4">
          <CorrectiveActionsList
            onActionClick={handleActionClick}
            onMarkCompleted={handleMarkCompleted}
            filter={filter}
            showFilters={false}
            compact={false}
          />
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-20 right-4 z-20">
          <button
            onClick={() => router.push('/logs/new')}
            className="w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        {/* Completion Modal */}
        {selectedAction && (
          <ActionCompletionModal
            isOpen={showCompletionModal}
            onClose={handleCloseModal}
            action={selectedAction}
            onComplete={handleCompleteAction}
          />
        )}
      </div>
    </AppShell>
  );
}
