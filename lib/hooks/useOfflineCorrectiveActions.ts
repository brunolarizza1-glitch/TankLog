'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CorrectiveActionWithDetails,
  getOpenActions,
} from '@/lib/corrective-actions-client';
import { offlineCorrectiveActionsService } from '@/lib/offline-corrective-actions';
import { useSyncStatus } from '@/lib/sync';

export function useOfflineCorrectiveActions() {
  const { isOnline, isSyncing } = useSyncStatus();
  const [actions, setActions] = useState<CorrectiveActionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState(0);

  const loadActions = useCallback(async () => {
    setLoading(true);
    try {
      if (isOnline) {
        // Load from API when online
        const data = await getOpenActions();
        const apiActions = data.actions || [];
        setActions(apiActions);

        // Cache for offline use
        await offlineCorrectiveActionsService.cacheActions(apiActions);
      } else {
        // Load from cache when offline
        const cachedActions =
          await offlineCorrectiveActionsService.getActionsWithOfflineUpdates();
        setActions(cachedActions);
      }
    } catch (error) {
      console.error('Error loading corrective actions:', error);
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  const completeAction = useCallback(
    async (
      actionId: string,
      resolutionNotes: string,
      photoEvidence?: string
    ) => {
      try {
        if (isOnline) {
          // Complete directly when online
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

          // Refresh actions
          await loadActions();
        } else {
          // Queue for offline sync
          await offlineCorrectiveActionsService.queueActionCompletion(
            actionId,
            resolutionNotes,
            photoEvidence
          );

          // Update local state
          setActions((prev) =>
            prev.map((action) =>
              action.id === actionId
                ? {
                    ...action,
                    status: 'completed',
                    resolution_notes: resolutionNotes,
                    resolution_photo_url: photoEvidence,
                    completed_at: new Date().toISOString(),
                  }
                : action
            )
          );
        }
      } catch (error) {
        console.error('Error completing action:', error);
        throw error;
      }
    },
    [isOnline, loadActions]
  );

  const updateActionStatus = useCallback(
    async (actionId: string, status: string) => {
      try {
        if (isOnline) {
          // Update directly when online
          const response = await fetch(`/api/corrective-actions/${actionId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
          });

          if (!response.ok) {
            throw new Error('Failed to update action status');
          }

          // Refresh actions
          await loadActions();
        } else {
          // Queue for offline sync
          await offlineCorrectiveActionsService.queueActionUpdate(
            actionId,
            status
          );

          // Update local state
          setActions((prev) =>
            prev.map((action) =>
              action.id === actionId
                ? { ...action, status: status as any }
                : action
            )
          );
        }
      } catch (error) {
        console.error('Error updating action status:', error);
        throw error;
      }
    },
    [isOnline, loadActions]
  );

  const syncOfflineChanges = useCallback(async () => {
    if (!isOnline) return;

    try {
      const stats = await offlineCorrectiveActionsService.syncOfflineChanges();
      console.log('Synced offline changes:', stats);

      // Refresh actions after sync
      await loadActions();
    } catch (error) {
      console.error('Error syncing offline changes:', error);
    }
  }, [isOnline, loadActions]);

  // Load actions on mount and when online status changes
  useEffect(() => {
    loadActions();
  }, [loadActions]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && !isSyncing) {
      syncOfflineChanges();
    }
  }, [isOnline, isSyncing, syncOfflineChanges]);

  // Update pending changes count
  useEffect(() => {
    const updatePendingCount = () => {
      const count = offlineCorrectiveActionsService.getPendingChangesCount();
      setPendingChanges(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    actions,
    loading,
    pendingChanges,
    completeAction,
    updateActionStatus,
    syncOfflineChanges,
    refreshActions: loadActions,
  };
}
