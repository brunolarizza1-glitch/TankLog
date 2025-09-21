/**
 * CorrectiveActionService - Manages failed inspection tracking and corrective actions
 *
 * This service handles the lifecycle of corrective actions from creation to completion,
 * including automatic severity determination, reminder scheduling, and status management.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { Database } from '@/server/db';
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/errors';
import { reminderService } from '@/lib/reminder-service';

// Types and Interfaces
export type SeverityLevel = 'immediate' | '24hr' | '7day';
export type CorrectiveActionStatus =
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'overdue';
export type ReminderType = 'email' | 'push' | 'sms';
export type ReminderStatus = 'pending' | 'sent' | 'failed';

export interface CorrectiveAction {
  id: string;
  inspection_id: string;
  inspection_item_id: string;
  severity_level: SeverityLevel;
  description: string;
  required_action: string;
  assigned_to?: string;
  due_date: string;
  status: CorrectiveActionStatus;
  resolution_notes?: string;
  resolution_photo_url?: string;
  created_at: string;
  completed_at?: string;
}

export interface FollowUpReminder {
  id: string;
  corrective_action_id: string;
  reminder_type: ReminderType;
  scheduled_for: string;
  sent_at?: string;
  status: ReminderStatus;
  created_at: string;
}

export interface CorrectiveActionWithDetails extends CorrectiveAction {
  technician?: {
    id: string;
    name?: string;
    email: string;
  };
  inspection?: {
    id: string;
    site: string;
    tank_id: string;
    occurred_at: string;
  };
  reminders?: FollowUpReminder[];
}

export interface FailureDetails {
  itemId: string;
  description: string;
  requiredAction: string;
  assignedTo?: string;
  customSeverity: SeverityLevel;
}

export interface CreateCorrectiveActionParams {
  inspectionId: string;
  itemId: string;
  failureDetails: FailureDetails;
}

export interface MarkCompletedParams {
  actionId: string;
  resolutionNotes: string;
  photoEvidence?: string;
}

// Due date calculation based on severity
const SEVERITY_DURATIONS: Record<SeverityLevel, number> = {
  immediate: 4, // 4 hours
  '24hr': 24, // 24 hours
  '7day': 168, // 7 days = 168 hours
};

/**
 * CorrectiveActionService - Main service class for managing corrective actions
 */
export class CorrectiveActionService {
  private supabase = createAdminClient();
  private db = new Database();

  /**
   * Creates a new corrective action with automatic severity determination
   */
  async createCorrectiveAction({
    inspectionId,
    itemId,
    failureDetails,
  }: CreateCorrectiveActionParams): Promise<CorrectiveAction> {
    try {
      // Validate inspection exists
      const inspection = await this.db.getLog(inspectionId);
      if (!inspection) {
        throw new NotFoundError('Inspection');
      }

      // Use client-selected severity level
      const severityLevel = failureDetails.customSeverity;

      if (!severityLevel) {
        throw new ValidationError('Severity level is required');
      }

      // Calculate due date
      const dueDate = this.calculateDueDate(severityLevel);

      // Create corrective action
      const actionData = {
        inspection_id: inspectionId,
        inspection_item_id: failureDetails.itemId,
        severity_level: severityLevel,
        description: failureDetails.description,
        required_action: failureDetails.requiredAction,
        assigned_to: failureDetails.assignedTo,
        due_date: dueDate.toISOString(),
        status: 'open' as CorrectiveActionStatus,
      };

      const { data: action, error: actionError } = await this.supabase
        .from('corrective_actions')
        .insert(actionData)
        .select()
        .single();

      if (actionError) {
        throw new DatabaseError(
          `Failed to create corrective action: ${actionError.message}`,
          { error: actionError }
        );
      }

      // Update inspection to mark it as having failures
      await this.db.updateLog(inspectionId, { has_failures: true });

      // Create initial follow-up reminders using the new reminder service
      await reminderService.createInitialReminders(action.id, severityLevel);

      return action;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error creating corrective action', {
        error,
      });
    }
  }

  /**
   * Gets all open corrective actions for a location or technician
   */
  async getOpenActions(
    locationId?: string,
    technicianId?: string
  ): Promise<CorrectiveActionWithDetails[]> {
    try {
      let query = this.supabase
        .from('corrective_actions')
        .select(
          `
          *,
          technician:profiles!corrective_actions_assigned_to_fkey(id, name, email),
          inspection:logs!corrective_actions_inspection_id_fkey(id, site, tank_id, occurred_at),
          reminders:follow_up_reminders(*)
        `
        )
        .neq('status', 'completed');

      // Filter by location (site) if provided
      if (locationId) {
        query = query.eq('inspection.site', locationId);
      }

      // Filter by technician if provided
      if (technicianId) {
        query = query.eq('assigned_to', technicianId);
      }

      const { data: actions, error } = await query;

      if (error) {
        throw new DatabaseError(
          `Failed to fetch open actions: ${error.message}`,
          { error }
        );
      }

      // Sort by priority: overdue first, then by due date
      const sortedActions = this.sortActionsByPriority(actions || []);

      return sortedActions;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error fetching open actions', {
        error,
      });
    }
  }

  /**
   * Marks a corrective action as completed
   */
  async markActionCompleted({
    actionId,
    resolutionNotes,
    photoEvidence,
  }: MarkCompletedParams): Promise<CorrectiveAction> {
    try {
      // Verify action exists and is not already completed
      const { data: existingAction, error: fetchError } = await this.supabase
        .from('corrective_actions')
        .select('*')
        .eq('id', actionId)
        .single();

      if (fetchError || !existingAction) {
        throw new NotFoundError('Corrective action');
      }

      if (existingAction.status === 'completed') {
        throw new ValidationError('Corrective action is already completed');
      }

      // Update action status
      const updates = {
        status: 'completed' as CorrectiveActionStatus,
        resolution_notes: resolutionNotes,
        resolution_photo_url: photoEvidence,
        completed_at: new Date().toISOString(),
      };

      const { data: updatedAction, error: updateError } = await this.supabase
        .from('corrective_actions')
        .update(updates)
        .eq('id', actionId)
        .select()
        .single();

      if (updateError) {
        throw new DatabaseError(
          `Failed to mark action completed: ${updateError.message}`,
          { error: updateError }
        );
      }

      // Cancel pending reminders using the new reminder service
      await reminderService.cancelRemindersForAction(actionId);

      // TODO: Trigger confirmation email
      // await this.sendConfirmationEmail(updatedAction);

      return updatedAction;
    } catch (error) {
      if (
        error instanceof DatabaseError ||
        error instanceof NotFoundError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      throw new DatabaseError('Unexpected error marking action completed', {
        error,
      });
    }
  }

  /**
   * Gets all overdue corrective actions for automated alerts
   */
  async getOverdueActions(): Promise<CorrectiveActionWithDetails[]> {
    try {
      const now = new Date().toISOString();

      const { data: actions, error } = await this.supabase
        .from('corrective_actions')
        .select(
          `
          *,
          technician:profiles!corrective_actions_assigned_to_fkey(id, name, email),
          inspection:logs!corrective_actions_inspection_id_fkey(id, site, tank_id, occurred_at),
          reminders:follow_up_reminders(*)
        `
        )
        .neq('status', 'completed')
        .lt('due_date', now);

      if (error) {
        throw new DatabaseError(
          `Failed to fetch overdue actions: ${error.message}`,
          { error }
        );
      }

      // Update status to overdue if not already set
      const overdueIds = (actions || [])
        .filter((action) => action.status !== 'overdue')
        .map((action) => action.id);

      if (overdueIds.length > 0) {
        await this.supabase
          .from('corrective_actions')
          .update({ status: 'overdue' })
          .in('id', overdueIds);
      }

      return actions || [];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error fetching overdue actions', {
        error,
      });
    }
  }

  /**
   * Updates the status of a corrective action
   */
  async updateActionStatus(
    actionId: string,
    status: CorrectiveActionStatus
  ): Promise<CorrectiveAction> {
    try {
      const { data: action, error } = await this.supabase
        .from('corrective_actions')
        .update({ status })
        .eq('id', actionId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(
          `Failed to update action status: ${error.message}`,
          { error }
        );
      }

      return action;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error updating action status', {
        error,
      });
    }
  }

  // Private helper methods

  /**
   * Calculates due date based on severity level
   */
  private calculateDueDate(severity: SeverityLevel): Date {
    const now = new Date();
    const hoursToAdd = SEVERITY_DURATIONS[severity];
    return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  }

  /**
   * Sorts actions by priority (overdue first, then by due date)
   */
  private sortActionsByPriority(
    actions: CorrectiveActionWithDetails[]
  ): CorrectiveActionWithDetails[] {
    const now = new Date();

    return actions.sort((a, b) => {
      const aOverdue = new Date(a.due_date) < now;
      const bOverdue = new Date(b.due_date) < now;

      // Overdue items first
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // Then by due date (earliest first)
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }
}

// Export singleton instance
export const correctiveActionService = new CorrectiveActionService();
