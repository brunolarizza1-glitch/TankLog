/**
 * ReminderService - Automated reminder system for corrective actions
 *
 * This service handles the creation, scheduling, and sending of reminders
 * for corrective actions based on severity levels and due dates.
 */

import { createAdminClient } from '@/lib/supabase/server';
import {
  correctiveActionService,
  type CorrectiveActionWithDetails,
} from '@/lib/corrective-actions';
import { sendEmail } from '@/lib/postmark';
import { DatabaseError } from '@/lib/errors';
import { rateLimitingService, RATE_LIMITS } from '@/lib/rate-limiting';

export type ReminderType = 'initial' | 'due_soon' | 'overdue' | 'escalation';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface ReminderTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface ReminderCommonData {
  actionId: string;
  itemName: string;
  site: string;
  tankId: string;
  description: string;
  requiredAction: string;
  dueDate: string;
  dueTime: string;
  actionUrl: string;
  unsubscribeUrl: string;
}

export interface ReminderWithAction {
  id: string;
  reminder_type: ReminderType;
  corrective_action: CorrectiveActionWithDetails;
}

export interface ReminderSchedule {
  severity: 'immediate' | '24hr' | '7day';
  reminders: {
    type: ReminderType;
    hoursBeforeDue: number;
    template: string;
  }[];
}

// Reminder scheduling configuration
const REMINDER_SCHEDULES: Record<string, ReminderSchedule> = {
  immediate: {
    severity: 'immediate',
    reminders: [
      { type: 'initial', hoursBeforeDue: 0, template: 'initial_notification' },
      { type: 'due_soon', hoursBeforeDue: 2, template: 'due_soon_immediate' },
      { type: 'due_soon', hoursBeforeDue: 1, template: 'due_soon_immediate' },
      { type: 'overdue', hoursBeforeDue: -1, template: 'overdue_alert' },
    ],
  },
  '24hr': {
    severity: '24hr',
    reminders: [
      { type: 'initial', hoursBeforeDue: 0, template: 'initial_notification' },
      { type: 'due_soon', hoursBeforeDue: 12, template: 'due_soon_24hr' },
      { type: 'due_soon', hoursBeforeDue: 2, template: 'due_soon_24hr' },
      { type: 'overdue', hoursBeforeDue: -1, template: 'overdue_alert' },
    ],
  },
  '7day': {
    severity: '7day',
    reminders: [
      { type: 'initial', hoursBeforeDue: 0, template: 'initial_notification' },
      { type: 'due_soon', hoursBeforeDue: 84, template: 'due_soon_7day' }, // 3.5 days
      { type: 'due_soon', hoursBeforeDue: 42, template: 'due_soon_7day' }, // 1.75 days
      { type: 'due_soon', hoursBeforeDue: 17, template: 'due_soon_7day' }, // 17 hours
      { type: 'overdue', hoursBeforeDue: -1, template: 'overdue_alert' },
    ],
  },
};

export class ReminderService {
  private supabase = createAdminClient();

  /**
   * Process all due reminders (called by cron job)
   */
  async processDueReminders(): Promise<{
    processed: number;
    sent: number;
    failed: number;
    escalated: number;
  }> {
    const stats = { processed: 0, sent: 0, failed: 0, escalated: 0 };

    try {
      // Get all pending reminders that are due
      const { data: dueReminders, error: fetchError } = await this.supabase
        .from('follow_up_reminders')
        .select(
          `
          *,
          corrective_action:corrective_actions!follow_up_reminders_corrective_action_id_fkey(
            *,
            technician:profiles!corrective_actions_assigned_to_fkey(id, name, email),
            inspection:logs!corrective_actions_inspection_id_fkey(id, site, tank_id, occurred_at)
          )
        `
        )
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString());

      if (fetchError) {
        throw new DatabaseError(
          `Failed to fetch due reminders: ${fetchError.message}`,
          { error: fetchError }
        );
      }

      if (!dueReminders || dueReminders.length === 0) {
        console.log('No due reminders to process');
        return stats;
      }

      console.log(`Processing ${dueReminders.length} due reminders`);

      // Process each reminder
      for (const reminder of dueReminders) {
        stats.processed++;

        try {
          await this.sendReminder(reminder);
          stats.sent++;
        } catch (error) {
          console.error(`Failed to send reminder ${reminder.id}:`, error);
          stats.failed++;

          // Mark as failed
          await this.markReminderAsFailed(reminder.id);
        }
      }

      // Check for escalation needs
      const escalationCount = await this.checkAndCreateEscalations();
      stats.escalated = escalationCount;

      console.log('Reminder processing complete:', stats);
      return stats;
    } catch (error) {
      console.error('Error processing due reminders:', error);
      throw error;
    }
  }

  /**
   * Send a specific reminder
   */
  private async sendReminder(reminder: ReminderWithAction): Promise<void> {
    const action = reminder.corrective_action;
    if (!action) {
      throw new Error('Corrective action not found for reminder');
    }

    const recipientId = action.assigned_to || action.technician?.id;
    if (!recipientId) {
      throw new Error('No recipient found for reminder');
    }

    // Check rate limiting for reminder emails
    const rateLimitResult = await rateLimitingService.checkRateLimit(
      recipientId,
      RATE_LIMITS.reminderEmails
    );

    if (!rateLimitResult.allowed) {
      console.warn(
        `Rate limit exceeded for user ${recipientId}, skipping reminder ${reminder.id}`
      );
      await this.markReminderAsFailed(reminder.id);
      return;
    }

    // Get email template
    const template = this.getEmailTemplate(reminder.reminder_type, action);

    // Send email
    const emailData = {
      to:
        action.technician?.email || action.assigned_to || 'unknown@example.com',
      subject: template.subject,
      htmlBody: template.html,
      textBody: template.text,
      tag: 'corrective-action-reminder',
      metadata: {
        reminder_id: reminder.id,
        action_id: action.id,
        reminder_type: reminder.reminder_type,
        rate_limit_remaining: rateLimitResult.remaining,
      },
    };

    await sendEmail(emailData);

    // Mark reminder as sent
    await this.markReminderAsSent(reminder.id);
  }

  /**
   * Create initial reminders for a corrective action
   */
  async createInitialReminders(
    actionId: string,
    severity: 'immediate' | '24hr' | '7day'
  ): Promise<void> {
    const schedule = REMINDER_SCHEDULES[severity];
    if (!schedule) {
      throw new Error(`Unknown severity level: ${severity}`);
    }

    // Get the corrective action to calculate due dates
    const actions = await correctiveActionService.getOpenActions();
    const action = actions.find((a) => a.id === actionId);
    if (!action) {
      throw new Error('Corrective action not found');
    }

    const dueDate = new Date(action.due_date);
    const reminders = [];

    for (const reminderConfig of schedule.reminders) {
      const scheduledFor = new Date(
        dueDate.getTime() - reminderConfig.hoursBeforeDue * 60 * 60 * 1000
      );

      // Only schedule future reminders
      if (scheduledFor > new Date()) {
        reminders.push({
          corrective_action_id: actionId,
          reminder_type: reminderConfig.type,
          scheduled_for: scheduledFor.toISOString(),
          status: 'pending' as ReminderStatus,
        });
      }
    }

    if (reminders.length > 0) {
      const { error } = await this.supabase
        .from('follow_up_reminders')
        .insert(reminders);

      if (error) {
        throw new DatabaseError(
          `Failed to create initial reminders: ${error.message}`,
          { error }
        );
      }
    }
  }

  /**
   * Check for escalation needs and create escalation reminders
   */
  private async checkAndCreateEscalations(): Promise<number> {
    try {
      // Get overdue actions
      const overdueActions = await correctiveActionService.getOverdueActions();

      if (overdueActions.length === 0) {
        return 0;
      }

      // Group by organization
      const orgOverdueCounts = new Map<string, number>();
      const orgActions = new Map<string, CorrectiveActionWithDetails[]>();

      for (const action of overdueActions) {
        const orgId = (action.inspection as any)?.org_id || 'unknown';
        orgOverdueCounts.set(orgId, (orgOverdueCounts.get(orgId) || 0) + 1);

        if (!orgActions.has(orgId)) {
          orgActions.set(orgId, []);
        }
        orgActions.get(orgId)!.push(action);
      }

      let escalationCount = 0;

      // Create escalation reminders for orgs with multiple overdue actions
      for (const [orgId, count] of Array.from(orgOverdueCounts.entries())) {
        if (count >= 3) {
          // Escalate if 3+ overdue actions
          const actions = orgActions.get(orgId) || [];
          await this.createEscalationReminder(orgId, actions);
          escalationCount++;
        }
      }

      return escalationCount;
    } catch (error) {
      console.error('Error checking escalations:', error);
      return 0;
    }
  }

  /**
   * Create escalation reminder for management
   */
  private async createEscalationReminder(
    orgId: string,
    overdueActions: CorrectiveActionWithDetails[]
  ): Promise<void> {
    // Get organization details and management contacts
    const { data: org } = await this.supabase
      .from('organizations')
      .select('name, owner_id')
      .eq('id', orgId)
      .single();

    if (!org) return;

    // Get management contacts (org owner and admins)
    const { data: management } = await this.supabase
      .from('profiles')
      .select('email, name')
      .eq('org_id', orgId)
      .in('role', ['admin']);

    if (!management || management.length === 0) return;

    const template = this.getEscalationTemplate(org.name, overdueActions);

    // Send to all management contacts
    for (const contact of management) {
      try {
        await sendEmail({
          to: contact.email,
          subject: template.subject,
          htmlBody: template.html,
          textBody: template.text,
        });
      } catch (error) {
        console.error(
          `Failed to send escalation email to ${contact.email}:`,
          error
        );
      }
    }
  }

  /**
   * Get email template based on reminder type
   */
  private getEmailTemplate(
    reminderType: string,
    action: CorrectiveActionWithDetails
  ): ReminderTemplate {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const actionUrl = `${baseUrl}/corrective-actions`;
    const unsubscribeUrl = `${baseUrl}/api/reminders/unsubscribe?token=${action.id}`;

    const commonData = {
      actionId: action.id,
      itemName: action.inspection_item_id.replace('_', ' ').toUpperCase(),
      site: action.inspection?.site || 'Unknown Site',
      tankId: action.inspection?.tank_id || 'Unknown Tank',
      description: action.description,
      requiredAction: action.required_action,
      dueDate: new Date(action.due_date).toLocaleDateString(),
      dueTime: new Date(action.due_date).toLocaleTimeString(),
      actionUrl,
      unsubscribeUrl,
    };

    switch (reminderType) {
      case 'initial':
        return this.getInitialNotificationTemplate(commonData);
      case 'due_soon':
        return this.getDueSoonTemplate(commonData, action.severity_level);
      case 'overdue':
        return this.getOverdueTemplate(commonData);
      case 'escalation':
        return this.getEscalationTemplate('Organization', [action]);
      default:
        return this.getInitialNotificationTemplate(commonData);
    }
  }

  /**
   * Get escalation template
   */
  private getEscalationTemplate(
    orgName: string,
    overdueActions: CorrectiveActionWithDetails[]
  ): ReminderTemplate {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const actionUrl = `${baseUrl}/corrective-actions`;

    const subject = `URGENT: ${overdueActions.length} Overdue Corrective Actions in ${orgName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">⚠️ URGENT ATTENTION REQUIRED</h1>
        </div>
        
        <div style="padding: 20px; background-color: #fef2f2; border-left: 4px solid #dc2626;">
          <h2 style="color: #dc2626; margin-top: 0;">Multiple Overdue Corrective Actions</h2>
          <p style="font-size: 16px; margin-bottom: 20px;">
            <strong>${orgName}</strong> has <strong>${overdueActions.length} overdue corrective actions</strong> that require immediate attention.
          </p>
          
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #374151;">Overdue Actions Summary:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${overdueActions
                .map(
                  (action) => `
                <li style="margin-bottom: 8px;">
                  <strong>${action.inspection_item_id.replace('_', ' ').toUpperCase()}</strong> - 
                  ${action.inspection?.site} (${action.inspection?.tank_id})<br>
                  <small style="color: #6b7280;">Due: ${new Date(action.due_date).toLocaleDateString()}</small>
                </li>
              `
                )
                .join('')}
            </ul>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${actionUrl}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View All Corrective Actions
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; background-color: #f9fafb; font-size: 14px; color: #6b7280;">
          <p style="margin: 0;">
            This is an automated escalation notification. Please ensure all overdue corrective actions are addressed promptly to maintain safety compliance.
          </p>
        </div>
      </div>
    `;

    const text = `
URGENT: ${overdueActions.length} Overdue Corrective Actions in ${orgName}

${orgName} has ${overdueActions.length} overdue corrective actions that require immediate attention.

Overdue Actions:
${overdueActions
  .map(
    (action) =>
      `- ${action.inspection_item_id.replace('_', ' ').toUpperCase()} - ${action.inspection?.site} (${action.inspection?.tank_id}) - Due: ${new Date(action.due_date).toLocaleDateString()}`
  )
  .join('\n')}

View all corrective actions: ${actionUrl}

This is an automated escalation notification. Please ensure all overdue corrective actions are addressed promptly.
    `;

    return { subject, html, text };
  }

  /**
   * Get initial notification template
   */
  private getInitialNotificationTemplate(
    data: ReminderCommonData
  ): ReminderTemplate {
    const subject = `Corrective Action Required: ${data.itemName} - ${data.site}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🔧 Corrective Action Required</h1>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #374151; margin-top: 0;">New Corrective Action Assigned</h2>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Site:</strong> ${data.site}</p>
            <p style="margin: 0 0 10px 0;"><strong>Tank ID:</strong> ${data.tankId}</p>
            <p style="margin: 0 0 10px 0;"><strong>Item:</strong> ${data.itemName}</p>
            <p style="margin: 0;"><strong>Due Date:</strong> ${data.dueDate} at ${data.dueTime}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; margin-bottom: 10px;">Issue Description:</h3>
            <p style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 0;">
              ${data.description}
            </p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; margin-bottom: 10px;">Required Action:</h3>
            <p style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 0;">
              ${data.requiredAction}
            </p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.actionUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Corrective Action
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; background-color: #f9fafb; font-size: 14px; color: #6b7280;">
          <p style="margin: 0;">
            You received this notification because you are assigned to this corrective action. 
            <a href="${data.unsubscribeUrl}" style="color: #6b7280;">Unsubscribe from reminders</a>
          </p>
        </div>
      </div>
    `;

    const text = `
Corrective Action Required: ${data.itemName} - ${data.site}

New Corrective Action Assigned:
Site: ${data.site}
Tank ID: ${data.tankId}
Item: ${data.itemName}
Due Date: ${data.dueDate} at ${data.dueTime}

Issue Description:
${data.description}

Required Action:
${data.requiredAction}

View Corrective Action: ${data.actionUrl}

You received this notification because you are assigned to this corrective action.
Unsubscribe: ${data.unsubscribeUrl}
    `;

    return { subject, html, text };
  }

  /**
   * Get due soon template
   */
  private getDueSoonTemplate(
    data: ReminderCommonData,
    severity: string
  ): ReminderTemplate {
    const hoursLeft = Math.ceil(
      (new Date(data.dueDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60)
    );
    const subject = `Reminder: Corrective Action Due in ${hoursLeft} Hours - ${data.itemName}`;

    const urgencyColor =
      severity === 'immediate'
        ? '#dc2626'
        : severity === '24hr'
          ? '#f59e0b'
          : '#3b82f6';
    const urgencyText =
      severity === 'immediate'
        ? 'URGENT'
        : severity === '24hr'
          ? 'HIGH PRIORITY'
          : 'STANDARD';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${urgencyColor}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">⏰ Action Due Soon</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">${urgencyText}</p>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #374151; margin-top: 0;">Corrective Action Reminder</h2>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${urgencyColor};">
            <p style="margin: 0; font-weight: bold; color: #92400e;">
              ⚠️ This corrective action is due in approximately ${hoursLeft} hours
            </p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Site:</strong> ${data.site}</p>
            <p style="margin: 0 0 10px 0;"><strong>Tank ID:</strong> ${data.tankId}</p>
            <p style="margin: 0 0 10px 0;"><strong>Item:</strong> ${data.itemName}</p>
            <p style="margin: 0;"><strong>Due Date:</strong> ${data.dueDate} at ${data.dueTime}</p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.actionUrl}" 
               style="background-color: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View & Update Action
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; background-color: #f9fafb; font-size: 14px; color: #6b7280;">
          <p style="margin: 0;">
            <a href="${data.unsubscribeUrl}" style="color: #6b7280;">Unsubscribe from reminders</a>
          </p>
        </div>
      </div>
    `;

    const text = `
Reminder: Corrective Action Due in ${hoursLeft} Hours - ${data.itemName}

${urgencyText}: This corrective action is due in approximately ${hoursLeft} hours

Site: ${data.site}
Tank ID: ${data.tankId}
Item: ${data.itemName}
Due Date: ${data.dueDate} at ${data.dueTime}

View & Update Action: ${data.actionUrl}

Unsubscribe: ${data.unsubscribeUrl}
    `;

    return { subject, html, text };
  }

  /**
   * Get overdue template
   */
  private getOverdueTemplate(data: ReminderCommonData): ReminderTemplate {
    const subject = `URGENT: Corrective Action OVERDUE - ${data.itemName} - ${data.site}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🚨 OVERDUE ACTION</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">IMMEDIATE ATTENTION REQUIRED</p>
        </div>
        
        <div style="padding: 20px; background-color: #fef2f2; border-left: 4px solid #dc2626;">
          <h2 style="color: #dc2626; margin-top: 0;">Corrective Action is Overdue</h2>
          
          <div style="background-color: #fecaca; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-weight: bold; color: #991b1b;">
              ⚠️ This corrective action was due on ${data.dueDate} and is now overdue
            </p>
          </div>
          
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Site:</strong> ${data.site}</p>
            <p style="margin: 0 0 10px 0;"><strong>Tank ID:</strong> ${data.tankId}</p>
            <p style="margin: 0 0 10px 0;"><strong>Item:</strong> ${data.itemName}</p>
            <p style="margin: 0 0 10px 0;"><strong>Due Date:</strong> ${data.dueDate} at ${data.dueTime}</p>
            <p style="margin: 0;"><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">OVERDUE</span></p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.actionUrl}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Complete Action Now
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; background-color: #f9fafb; font-size: 14px; color: #6b7280;">
          <p style="margin: 0;">
            This action is now overdue and requires immediate attention. Please complete it as soon as possible.
            <a href="${data.unsubscribeUrl}" style="color: #6b7280;">Unsubscribe from reminders</a>
          </p>
        </div>
      </div>
    `;

    const text = `
URGENT: Corrective Action OVERDUE - ${data.itemName} - ${data.site}

This corrective action was due on ${data.dueDate} and is now overdue.

Site: ${data.site}
Tank ID: ${data.tankId}
Item: ${data.itemName}
Due Date: ${data.dueDate} at ${data.dueTime}
Status: OVERDUE

Complete Action Now: ${data.actionUrl}

This action is now overdue and requires immediate attention.
Unsubscribe: ${data.unsubscribeUrl}
    `;

    return { subject, html, text };
  }

  /**
   * Mark reminder as sent
   */
  private async markReminderAsSent(reminderId: string): Promise<void> {
    const { error } = await this.supabase
      .from('follow_up_reminders')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', reminderId);

    if (error) {
      throw new DatabaseError(
        `Failed to mark reminder as sent: ${error.message}`,
        { error }
      );
    }
  }

  /**
   * Mark reminder as failed
   */
  private async markReminderAsFailed(reminderId: string): Promise<void> {
    const { error } = await this.supabase
      .from('follow_up_reminders')
      .update({ status: 'failed' })
      .eq('id', reminderId);

    if (error) {
      console.error(`Failed to mark reminder as failed: ${error.message}`);
    }
  }

  /**
   * Cancel all pending reminders for a corrective action
   */
  async cancelRemindersForAction(actionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('follow_up_reminders')
      .update({ status: 'cancelled' })
      .eq('corrective_action_id', actionId)
      .eq('status', 'pending');

    if (error) {
      throw new DatabaseError(`Failed to cancel reminders: ${error.message}`, {
        error,
      });
    }
  }
}

// Export singleton instance
export const reminderService = new ReminderService();
