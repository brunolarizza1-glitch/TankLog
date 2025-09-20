-- Migration 007: Failed Inspection Tracking
-- Add tables for tracking failed inspections, corrective actions, and follow-up reminders

-- Add has_failures field to logs table
ALTER TABLE logs ADD COLUMN IF NOT EXISTS has_failures boolean DEFAULT false;

-- Create corrective_actions table
CREATE TABLE corrective_actions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id uuid NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  inspection_item_id text NOT NULL, -- which specific item failed (e.g., 'leak_check', 'visual_inspection', 'pressure_test')
  severity_level text NOT NULL CHECK (severity_level IN ('immediate', '24hr', '7day')),
  description text NOT NULL, -- what failed
  required_action text NOT NULL, -- what needs to be done
  assigned_to uuid REFERENCES profiles(id), -- technician responsible
  due_date timestamptz NOT NULL, -- when it must be completed
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'overdue')),
  resolution_notes text,
  resolution_photo_url text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create follow_up_reminders table
CREATE TABLE follow_up_reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  corrective_action_id uuid NOT NULL REFERENCES corrective_actions(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('email', 'push', 'sms')),
  scheduled_for timestamptz NOT NULL, -- when to send
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_corrective_actions_inspection_id ON corrective_actions(inspection_id);
CREATE INDEX idx_corrective_actions_assigned_to ON corrective_actions(assigned_to);
CREATE INDEX idx_corrective_actions_status ON corrective_actions(status);
CREATE INDEX idx_corrective_actions_due_date ON corrective_actions(due_date);
CREATE INDEX idx_corrective_actions_severity_level ON corrective_actions(severity_level);
CREATE INDEX idx_follow_up_reminders_corrective_action_id ON follow_up_reminders(corrective_action_id);
CREATE INDEX idx_follow_up_reminders_scheduled_for ON follow_up_reminders(scheduled_for);
CREATE INDEX idx_follow_up_reminders_status ON follow_up_reminders(status);
CREATE INDEX idx_logs_has_failures ON logs(has_failures);

-- Add comments for documentation
COMMENT ON TABLE corrective_actions IS 'Tracks corrective actions required for failed inspection items';
COMMENT ON COLUMN corrective_actions.inspection_item_id IS 'Identifies which specific inspection item failed (e.g., leak_check, visual_inspection)';
COMMENT ON COLUMN corrective_actions.severity_level IS 'Urgency level: immediate (fix now), 24hr (within 24 hours), 7day (within 7 days)';
COMMENT ON COLUMN corrective_actions.status IS 'Current status: open (not started), in_progress (being worked on), completed (finished), overdue (past due date)';

COMMENT ON TABLE follow_up_reminders IS 'Automated reminders for overdue or upcoming corrective actions';
COMMENT ON COLUMN follow_up_reminders.reminder_type IS 'Type of reminder: email, push notification, or SMS';
COMMENT ON COLUMN follow_up_reminders.status IS 'Reminder status: pending (not sent), sent (successfully sent), failed (delivery failed)';

COMMENT ON COLUMN logs.has_failures IS 'Quick flag to indicate if this inspection log has any associated corrective actions';
