/**
 * Offline Support for Corrective Actions
 *
 * Provides offline functionality for corrective actions management,
 * including local storage, sync queue, and conflict resolution.
 */

import { CorrectiveActionWithDetails } from '@/lib/corrective-actions';

export interface OfflineActionCompletion {
  id: string;
  actionId: string;
  resolutionNotes: string;
  photoEvidence?: string;
  timestamp: number;
  synced: boolean;
}

export interface OfflineActionUpdate {
  id: string;
  actionId: string;
  status: string;
  timestamp: number;
  synced: boolean;
}

export interface OfflineActionCreate {
  id: string;
  inspectionId: string;
  itemId: string;
  failureDetails: any;
  timestamp: number;
  synced: boolean;
}

class OfflineCorrectiveActionsService {
  private readonly STORAGE_KEYS = {
    COMPLETIONS: 'tanklog_offline_completions',
    UPDATES: 'tanklog_offline_updates',
    CREATES: 'tanklog_offline_creates',
    ACTIONS_CACHE: 'tanklog_actions_cache',
  };

  /**
   * Queue action completion for offline sync
   */
  async queueActionCompletion(
    actionId: string,
    resolutionNotes: string,
    photoEvidence?: string
  ): Promise<void> {
    const completion: OfflineActionCompletion = {
      id: crypto.randomUUID(),
      actionId,
      resolutionNotes,
      photoEvidence,
      timestamp: Date.now(),
      synced: false,
    };

    const completions = this.getOfflineCompletions();
    completions.push(completion);
    this.saveOfflineCompletions(completions);

    // Update local cache
    await this.updateLocalActionStatus(actionId, 'completed');
  }

  /**
   * Queue action status update for offline sync
   */
  async queueActionUpdate(actionId: string, status: string): Promise<void> {
    const update: OfflineActionUpdate = {
      id: crypto.randomUUID(),
      actionId,
      status,
      timestamp: Date.now(),
      synced: false,
    };

    const updates = this.getOfflineUpdates();
    updates.push(update);
    this.saveOfflineUpdates(updates);

    // Update local cache
    await this.updateLocalActionStatus(actionId, status);
  }

  /**
   * Queue action creation for offline sync
   */
  async queueActionCreate(
    inspectionId: string,
    itemId: string,
    failureDetails: any
  ): Promise<void> {
    const create: OfflineActionCreate = {
      id: crypto.randomUUID(),
      inspectionId,
      itemId,
      failureDetails,
      timestamp: Date.now(),
      synced: false,
    };

    const creates = this.getOfflineCreates();
    creates.push(create);
    this.saveOfflineCreates(creates);
  }

  /**
   * Get actions with offline updates applied
   */
  async getActionsWithOfflineUpdates(): Promise<CorrectiveActionWithDetails[]> {
    try {
      // Get cached actions
      const cachedActions = this.getCachedActions();
      if (cachedActions.length === 0) {
        return [];
      }

      // Apply offline updates
      const updates = this.getOfflineUpdates();
      const completions = this.getOfflineCompletions();

      return cachedActions.map((action) => {
        // Apply status updates
        const statusUpdate = updates.find(
          (u) => u.actionId === action.id && !u.synced
        );
        if (statusUpdate) {
          action.status = statusUpdate.status as any;
        }

        // Apply completion updates
        const completion = completions.find(
          (c) => c.actionId === action.id && !c.synced
        );
        if (completion) {
          action.status = 'completed';
          action.resolution_notes = completion.resolutionNotes;
          action.resolution_photo_url = completion.photoEvidence;
          action.completed_at = new Date(completion.timestamp).toISOString();
        }

        return action;
      });
    } catch (error) {
      console.error('Error getting actions with offline updates:', error);
      return [];
    }
  }

  /**
   * Sync offline changes when online
   */
  async syncOfflineChanges(): Promise<{
    completions: number;
    updates: number;
    creates: number;
    errors: number;
  }> {
    const stats = { completions: 0, updates: 0, creates: 0, errors: 0 };

    try {
      // Sync completions
      const completions = this.getOfflineCompletions().filter((c) => !c.synced);
      for (const completion of completions) {
        try {
          await this.syncCompletion(completion);
          completion.synced = true;
          stats.completions++;
        } catch (error) {
          console.error('Failed to sync completion:', error);
          stats.errors++;
        }
      }

      // Sync updates
      const updates = this.getOfflineUpdates().filter((u) => !u.synced);
      for (const update of updates) {
        try {
          await this.syncUpdate(update);
          update.synced = true;
          stats.updates++;
        } catch (error) {
          console.error('Failed to sync update:', error);
          stats.errors++;
        }
      }

      // Sync creates
      const creates = this.getOfflineCreates().filter((c) => !c.synced);
      for (const create of creates) {
        try {
          await this.syncCreate(create);
          create.synced = true;
          stats.creates++;
        } catch (error) {
          console.error('Failed to sync create:', error);
          stats.errors++;
        }
      }

      // Save updated sync status
      this.saveOfflineCompletions(completions);
      this.saveOfflineUpdates(updates);
      this.saveOfflineCreates(creates);

      // Clean up synced items
      this.cleanupSyncedItems();

      // Refresh cache
      await this.refreshActionsCache();
    } catch (error) {
      console.error('Error syncing offline changes:', error);
    }

    return stats;
  }

  /**
   * Cache actions for offline use
   */
  async cacheActions(actions: CorrectiveActionWithDetails[]): Promise<void> {
    try {
      const cacheData = {
        actions,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        this.STORAGE_KEYS.ACTIONS_CACHE,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error('Error caching actions:', error);
    }
  }

  /**
   * Get pending offline changes count
   */
  getPendingChangesCount(): number {
    const completions = this.getOfflineCompletions().filter(
      (c) => !c.synced
    ).length;
    const updates = this.getOfflineUpdates().filter((u) => !u.synced).length;
    const creates = this.getOfflineCreates().filter((c) => !c.synced).length;
    return completions + updates + creates;
  }

  /**
   * Clear all offline data
   */
  clearOfflineData(): void {
    localStorage.removeItem(this.STORAGE_KEYS.COMPLETIONS);
    localStorage.removeItem(this.STORAGE_KEYS.UPDATES);
    localStorage.removeItem(this.STORAGE_KEYS.CREATES);
    localStorage.removeItem(this.STORAGE_KEYS.ACTIONS_CACHE);
  }

  // Private methods

  private getOfflineCompletions(): OfflineActionCompletion[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.COMPLETIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveOfflineCompletions(completions: OfflineActionCompletion[]): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEYS.COMPLETIONS,
        JSON.stringify(completions)
      );
    } catch (error) {
      console.error('Error saving offline completions:', error);
    }
  }

  private getOfflineUpdates(): OfflineActionUpdate[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.UPDATES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveOfflineUpdates(updates: OfflineActionUpdate[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.UPDATES, JSON.stringify(updates));
    } catch (error) {
      console.error('Error saving offline updates:', error);
    }
  }

  private getOfflineCreates(): OfflineActionCreate[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.CREATES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveOfflineCreates(creates: OfflineActionCreate[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.CREATES, JSON.stringify(creates));
    } catch (error) {
      console.error('Error saving offline creates:', error);
    }
  }

  private getCachedActions(): CorrectiveActionWithDetails[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.ACTIONS_CACHE);
      if (!data) return [];

      const cache = JSON.parse(data);
      // Check if cache is older than 1 hour
      if (Date.now() - cache.timestamp > 60 * 60 * 1000) {
        return [];
      }

      return cache.actions || [];
    } catch {
      return [];
    }
  }

  private async updateLocalActionStatus(
    actionId: string,
    status: string
  ): Promise<void> {
    try {
      const cachedActions = this.getCachedActions();
      const updatedActions = cachedActions.map((action) =>
        action.id === actionId ? { ...action, status: status as any } : action
      );
      await this.cacheActions(updatedActions);
    } catch (error) {
      console.error('Error updating local action status:', error);
    }
  }

  private async syncCompletion(
    completion: OfflineActionCompletion
  ): Promise<void> {
    const response = await fetch(
      `/api/corrective-actions/${completion.actionId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
          resolutionNotes: completion.resolutionNotes,
          photoEvidence: completion.photoEvidence,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to sync completion');
    }
  }

  private async syncUpdate(update: OfflineActionUpdate): Promise<void> {
    const response = await fetch(`/api/corrective-actions/${update.actionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: update.status,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync update');
    }
  }

  private async syncCreate(create: OfflineActionCreate): Promise<void> {
    const response = await fetch('/api/corrective-actions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inspectionId: create.inspectionId,
        itemId: create.itemId,
        failureDetails: create.failureDetails,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync create');
    }
  }

  private async refreshActionsCache(): Promise<void> {
    try {
      const response = await fetch('/api/corrective-actions');
      if (response.ok) {
        const data = await response.json();
        await this.cacheActions(data.actions || []);
      }
    } catch (error) {
      console.error('Error refreshing actions cache:', error);
    }
  }

  private cleanupSyncedItems(): void {
    const completions = this.getOfflineCompletions().filter((c) => c.synced);
    const updates = this.getOfflineUpdates().filter((u) => u.synced);
    const creates = this.getOfflineCreates().filter((c) => c.synced);

    this.saveOfflineCompletions(completions);
    this.saveOfflineUpdates(updates);
    this.saveOfflineCreates(creates);
  }
}

// Export singleton instance
export const offlineCorrectiveActionsService =
  new OfflineCorrectiveActionsService();
