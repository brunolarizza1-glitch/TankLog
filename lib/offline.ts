// Offline storage utilities for TankLog

export interface DraftLog {
  id: string;
  fields: {
    site: string;
    vehicle_id: string;
    tank_id: string;
    pressure: string;
    leak_check: boolean | null;
    visual_ok: boolean | null;
    notes: string;
    corrective_action: string;
    customer_email: string;
    initials: string;
  };
  photos: Array<{
    id: string;
    dataUrl: string;
    originalName: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface QueuedLog {
  id: string;
  fields: DraftLog['fields'];
  photos: Array<{
    id: string;
    blob: Blob;
    originalName: string;
  }>;
  createdAt: string;
  retryCount: number;
}

const DRAFT_KEY_PREFIX = 'draft:new-log:';
const QUEUE_KEY_PREFIX = 'queue:submit-log:';

// Draft management
export function saveDraft(
  userId: string,
  draft: Omit<DraftLog, 'id' | 'createdAt' | 'updatedAt'>
): void {
  try {
    const draftWithMeta: DraftLog = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      `${DRAFT_KEY_PREFIX}${userId}`,
      JSON.stringify(draftWithMeta)
    );
  } catch (error) {
    console.error('Failed to save draft:', error);
  }
}

export function loadDraft(userId: string): DraftLog | null {
  try {
    const stored = localStorage.getItem(`${DRAFT_KEY_PREFIX}${userId}`);
    if (!stored) return null;

    const draft = JSON.parse(stored) as DraftLog;

    // Check if draft is not too old (7 days)
    const draftAge = Date.now() - new Date(draft.createdAt).getTime();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

    if (draftAge > maxAge) {
      clearDraft(userId);
      return null;
    }

    return draft;
  } catch (error) {
    console.error('Failed to load draft:', error);
    return null;
  }
}

export function clearDraft(userId: string): void {
  try {
    localStorage.removeItem(`${DRAFT_KEY_PREFIX}${userId}`);
  } catch (error) {
    console.error('Failed to clear draft:', error);
  }
}

// Queue management
export function queueLogSubmission(
  log: Omit<QueuedLog, 'id' | 'createdAt' | 'retryCount'>
): string {
  try {
    const queuedLog: QueuedLog = {
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    localStorage.setItem(
      `${QUEUE_KEY_PREFIX}${queuedLog.id}`,
      JSON.stringify(queuedLog)
    );

    return queuedLog.id;
  } catch (error) {
    console.error('Failed to queue log submission:', error);
    throw error;
  }
}

export function loadQueuedSubmissions(): QueuedLog[] {
  try {
    const queuedLogs: QueuedLog[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(QUEUE_KEY_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const queuedLog = JSON.parse(stored) as QueuedLog;
          queuedLogs.push(queuedLog);
        }
      }
    }

    return queuedLogs.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  } catch (error) {
    console.error('Failed to load queued submissions:', error);
    return [];
  }
}

export function removeQueuedSubmission(logId: string): void {
  try {
    localStorage.removeItem(`${QUEUE_KEY_PREFIX}${logId}`);
  } catch (error) {
    console.error('Failed to remove queued submission:', error);
  }
}

// User preferences (for autofill)
export function saveUserPreference(
  userId: string,
  key: string,
  value: string
): void {
  try {
    localStorage.setItem(`pref:${userId}:${key}`, value);
  } catch (error) {
    console.error('Failed to save user preference:', error);
  }
}

export function loadUserPreference(userId: string, key: string): string | null {
  try {
    return localStorage.getItem(`pref:${userId}:${key}`);
  } catch (error) {
    console.error('Failed to load user preference:', error);
    return null;
  }
}

// Network status
export function isOnline(): boolean {
  if (typeof window === 'undefined') {
    return true; // Assume online during SSR
  }
  return navigator.onLine;
}

export function onNetworkChange(
  callback: (online: boolean) => void
): () => void {
  // Check if we're in the browser
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
