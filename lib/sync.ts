// Background sync manager for TankLog

import {
  QueuedLog,
  loadQueuedSubmissions,
  removeQueuedSubmission,
} from './offline';
import { onNetworkChange } from './offline';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  queuedCount: number;
  lastSyncAt: string | null;
}

class SyncManager {
  private isOnline = navigator.onLine;
  private isSyncing = false;
  private queuedCount = 0;
  private lastSyncAt: string | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private unsubscribeNetwork?: () => void;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Listen for network changes
    this.unsubscribeNetwork = onNetworkChange((online) => {
      this.isOnline = online;
      this.notifyListeners();

      if (online) {
        this.syncQueuedSubmissions();
      }
    });

    // Initial sync if online
    if (this.isOnline) {
      this.syncQueuedSubmissions();
    }

    // Update queued count
    this.updateQueuedCount();
  }

  private updateQueuedCount() {
    this.queuedCount = loadQueuedSubmissions().length;
    this.notifyListeners();
  }

  private notifyListeners() {
    const status: SyncStatus = {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queuedCount: this.queuedCount,
      lastSyncAt: this.lastSyncAt,
    };

    this.listeners.forEach((listener) => listener(status));
  }

  public subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);

    // Immediately notify with current status
    listener({
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queuedCount: this.queuedCount,
      lastSyncAt: this.lastSyncAt,
    });

    return () => {
      this.listeners.delete(listener);
    };
  }

  public async syncQueuedSubmissions(): Promise<void> {
    if (!this.isOnline || this.isSyncing) return;

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const queuedLogs = loadQueuedSubmissions();

      for (const queuedLog of queuedLogs) {
        try {
          await this.processQueuedLog(queuedLog);
          removeQueuedSubmission(queuedLog.id);
        } catch (error) {
          console.error(`Failed to process queued log ${queuedLog.id}:`, error);

          // Increment retry count
          const updatedLog = {
            ...queuedLog,
            retryCount: queuedLog.retryCount + 1,
          };

          // Remove from queue if too many retries
          if (updatedLog.retryCount >= 3) {
            console.error(
              `Max retries reached for log ${queuedLog.id}, removing from queue`
            );
            removeQueuedSubmission(queuedLog.id);
          } else {
            // Update retry count in storage
            if (typeof window !== 'undefined') {
              localStorage.setItem(
                `queue:submit-log:${queuedLog.id}`,
                JSON.stringify(updatedLog)
              );
            }
          }
        }
      }

      this.lastSyncAt = new Date().toISOString();
    } finally {
      this.isSyncing = false;
      this.updateQueuedCount();
      this.notifyListeners();
    }
  }

  private async processQueuedLog(queuedLog: QueuedLog): Promise<void> {
    // Upload photos first
    const photoUrls: string[] = [];

    for (const photo of queuedLog.photos) {
      try {
        const formData = new FormData();
        formData.append('file', photo.blob, photo.originalName);
        formData.append('logId', queuedLog.id);

        const response = await fetch('/api/upload/photo', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload photo: ${response.statusText}`);
        }

        const { url } = await response.json();
        photoUrls.push(url);
      } catch (error) {
        console.error('Failed to upload photo:', error);
        throw error;
      }
    }

    // Submit the log
    const response = await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...queuedLog.fields,
        photo_urls: photoUrls,
        compliance_mode: 'US_NFPA58', // This should be determined from the queued log
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit log');
    }
  }

  public async forceSync(): Promise<void> {
    await this.syncQueuedSubmissions();
  }

  public destroy(): void {
    this.unsubscribeNetwork?.();
    this.listeners.clear();
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

// Hook for React components
export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    queuedCount: 0,
    lastSyncAt: null,
  });

  useEffect(() => {
    const unsubscribe = syncManager.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return status;
}

// Import useState and useEffect for the hook
import { useState, useEffect } from 'react';
