/**
 * Client-side Corrective Actions API
 *
 * This provides client-side functions for corrective actions that don't
 * import server-side dependencies.
 */

// Re-export types from the main service
export type {
  SeverityLevel,
  CorrectiveActionStatus,
  ReminderType,
  ReminderStatus,
  CorrectiveAction,
  FollowUpReminder,
  CorrectiveActionWithDetails,
  CreateCorrectiveActionParams,
  FailureDetails,
  MarkCompletedParams,
} from './corrective-actions';

/**
 * Create a corrective action via API
 */
export async function createCorrectiveAction(params: {
  inspectionId: string;
  itemId: string;
  failureDetails: {
    itemId: string;
    description: string;
    requiredAction: string;
    assignedTo: string;
    customSeverity: string;
  };
}) {
  const response = await fetch('/api/corrective-actions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to create corrective action');
  }

  return response.json();
}

/**
 * Get open corrective actions via API
 */
export async function getOpenActions(
  locationId?: string,
  technicianId?: string
) {
  const params = new URLSearchParams();
  if (locationId) params.append('locationId', locationId);
  if (technicianId) params.append('technicianId', technicianId);

  const response = await fetch(`/api/corrective-actions?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch corrective actions');
  }

  return response.json();
}

/**
 * Mark a corrective action as completed via API
 */
export async function markActionCompleted(params: {
  actionId: string;
  resolutionNotes: string;
  photoEvidence?: string;
}) {
  const response = await fetch(`/api/corrective-actions/${params.actionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'completed',
      resolutionNotes: params.resolutionNotes,
      photoEvidence: params.photoEvidence,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to complete corrective action');
  }

  return response.json();
}

/**
 * Get overdue corrective actions via API
 */
export async function getOverdueActions() {
  const response = await fetch('/api/corrective-actions?overdue=true');

  if (!response.ok) {
    throw new Error('Failed to fetch overdue actions');
  }

  return response.json();
}

/**
 * Update corrective action status via API
 */
export async function updateActionStatus(actionId: string, status: string) {
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

  return response.json();
}
