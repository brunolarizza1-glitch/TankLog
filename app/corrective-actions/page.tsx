'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import CorrectiveActionsList from '@/components/corrective-actions/CorrectiveActionsList';
import ActionCompletionModal from '@/components/corrective-actions/ActionCompletionModal';
import { useOfflineCorrectiveActions } from '@/lib/hooks/useOfflineCorrectiveActions';
import { useRouter } from 'next/navigation';
import { CorrectiveActionWithDetails } from '@/lib/corrective-actions-client';

export default function CorrectiveActionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedAction, setSelectedAction] =
    useState<CorrectiveActionWithDetails | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [filter, setFilter] = useState<
    'all' | 'overdue' | 'due_soon' | 'on_track'
  >('all');

  const {
    actions,
    loading,
    pendingChanges,
    completeAction,
    updateActionStatus,
  } = useOfflineCorrectiveActions();

  const handleActionClick = (action: CorrectiveActionWithDetails) => {
    setSelectedAction(action);
    setShowCompletionModal(true);
  };

  const handleMarkCompleted = (actionId: string) => {
    const action = actions.find((a) => a.id === actionId);
    if (action) {
      setSelectedAction(action);
      setShowCompletionModal(true);
    }
  };

  const handleCompleteAction = async (
    actionId: string,
    resolutionNotes: string,
    photoEvidence?: string
  ) => {
    try {
      await completeAction(actionId, resolutionNotes, photoEvidence);
      setShowCompletionModal(false);
      setSelectedAction(null);
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
      <AppShell
        title="Corrective Actions"
        breadcrumbs={[{ label: 'Corrective Actions' }]}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Corrective Actions"
      breadcrumbs={[{ label: 'Corrective Actions' }]}
    >
      <div className="min-h-screen pb-20">
        {/* Header */}
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

          {/* Pending Changes Indicator */}
          {pendingChanges > 0 && (
            <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-2">
              <div className="flex items-center">
                <span className="text-orange-500 mr-2">📡</span>
                <span className="text-sm text-orange-800">
                  {pendingChanges} change{pendingChanges !== 1 ? 's' : ''}{' '}
                  pending sync
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions List */}
        <div className="px-4 py-4">
          <CorrectiveActionsList
            onActionClick={handleActionClick}
            onMarkCompleted={handleMarkCompleted}
            filter={filter}
            showFilters={true}
            compact={false}
          />
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
