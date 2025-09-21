/**
 * Example usage of the CorrectiveActionService
 *
 * This file demonstrates how to use the CorrectiveActionService class
 * for managing failed inspection tracking in TankLog.
 */

import {
  correctiveActionService,
  type FailureDetails,
} from '@/lib/corrective-actions';

/**
 * Example: Creating a corrective action for a failed leak check
 */
export async function handleLeakCheckFailure(
  inspectionId: string,
  technicianId: string
) {
  try {
    const failureDetails: FailureDetails = {
      itemId: 'leak_check',
      description: 'Leak detected at valve connection #3',
      requiredAction: 'Replace valve connection gasket and re-test for leaks',
      assignedTo: technicianId,
      customSeverity: 'immediate' as const,
    };

    const action = await correctiveActionService.createCorrectiveAction({
      inspectionId,
      itemId: 'leak_check',
      failureDetails,
    });

    console.log('Created corrective action:', action);
    return action;
  } catch (error) {
    console.error('Failed to create corrective action:', error);
    throw error;
  }
}

/**
 * Example: Getting all open actions for a technician
 */
export async function getTechnicianOpenActions(technicianId: string) {
  try {
    const actions = await correctiveActionService.getOpenActions(
      undefined,
      technicianId
    );

    console.log(`Found ${actions.length} open actions for technician`);

    // Group by severity for priority display
    const bySeverity = {
      immediate: actions.filter((a) => a.severity_level === 'immediate'),
      '24hr': actions.filter((a) => a.severity_level === '24hr'),
      '7day': actions.filter((a) => a.severity_level === '7day'),
    };

    console.log('Actions by severity:', {
      immediate: bySeverity.immediate.length,
      '24hr': bySeverity['24hr'].length,
      '7day': bySeverity['7day'].length,
    });

    return actions;
  } catch (error) {
    console.error('Failed to fetch open actions:', error);
    throw error;
  }
}

/**
 * Example: Getting open actions for a specific location
 */
export async function getLocationOpenActions(site: string) {
  try {
    const actions = await correctiveActionService.getOpenActions(site);

    console.log(`Found ${actions.length} open actions for site: ${site}`);
    return actions;
  } catch (error) {
    console.error('Failed to fetch location actions:', error);
    throw error;
  }
}

/**
 * Example: Completing a corrective action
 */
export async function completeCorrectiveAction(
  actionId: string,
  resolutionNotes: string,
  photoUrl?: string
) {
  try {
    const completedAction = await correctiveActionService.markActionCompleted({
      actionId,
      resolutionNotes,
      photoEvidence: photoUrl,
    });

    console.log('Completed corrective action:', completedAction.id);
    return completedAction;
  } catch (error) {
    console.error('Failed to complete corrective action:', error);
    throw error;
  }
}

/**
 * Example: Daily automated check for overdue actions
 */
export async function runDailyOverdueCheck() {
  try {
    const overdueActions = await correctiveActionService.getOverdueActions();

    if (overdueActions.length === 0) {
      console.log('No overdue actions found');
      return [];
    }

    console.log(`Found ${overdueActions.length} overdue actions`);

    // Process each overdue action
    for (const action of overdueActions) {
      console.log(`Overdue action ${action.id}:`, {
        description: action.description,
        dueDate: action.due_date,
        assignedTo: action.technician?.name || 'Unassigned',
        severity: action.severity_level,
        site: action.inspection?.site,
      });

      // Here you could trigger alerts, emails, etc.
      // await sendOverdueAlert(action);
    }

    return overdueActions;
  } catch (error) {
    console.error('Failed to check overdue actions:', error);
    throw error;
  }
}

/**
 * Example: Updating action status (e.g., when technician starts work)
 */
export async function startWorkOnAction(actionId: string) {
  try {
    const updatedAction = await correctiveActionService.updateActionStatus(
      actionId,
      'in_progress'
    );

    console.log('Action status updated to in_progress:', updatedAction.id);
    return updatedAction;
  } catch (error) {
    console.error('Failed to update action status:', error);
    throw error;
  }
}

/**
 * Example: Multiple failure types from a single inspection
 */
export async function handleMultipleFailures(inspectionId: string) {
  try {
    const failures: FailureDetails[] = [
      {
        itemId: 'leak_check',
        description: 'Small leak detected at connection point',
        requiredAction: 'Tighten connection and re-test',
        assignedTo: 'tech-123',
        customSeverity: 'immediate' as const,
      },
      {
        itemId: 'visual_inspection',
        description: 'Rust visible on tank exterior',
        requiredAction: 'Clean rust and apply protective coating',
        assignedTo: 'tech-456',
        customSeverity: '7day' as const,
      },
      {
        itemId: 'documentation',
        description: 'Missing maintenance log entries for last 3 days',
        requiredAction: 'Complete missing log entries and update records',
        assignedTo: 'admin-789',
        customSeverity: '24hr' as const,
      },
    ];

    const actions = [];
    for (const failure of failures) {
      const action = await correctiveActionService.createCorrectiveAction({
        inspectionId,
        itemId: failure.itemId,
        failureDetails: failure,
      });
      actions.push(action);
    }

    console.log(
      `Created ${actions.length} corrective actions for inspection ${inspectionId}`
    );
    return actions;
  } catch (error) {
    console.error('Failed to handle multiple failures:', error);
    throw error;
  }
}
