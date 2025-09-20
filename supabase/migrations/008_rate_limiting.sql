-- Migration 008: Rate Limiting
-- Add rate limiting table for API and email rate limiting

-- Create rate_limits table
CREATE TABLE rate_limits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text NOT NULL UNIQUE, -- Rate limit key (e.g., "reminder_emails:user123")
  request_count integer NOT NULL DEFAULT 0,
  window_start bigint NOT NULL, -- Timestamp when the window started
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_rate_limits_key ON rate_limits(key);
CREATE INDEX idx_rate_limits_window_start ON rate_limits(window_start);
CREATE INDEX idx_rate_limits_created_at ON rate_limits(created_at);

-- Add comments for documentation
COMMENT ON TABLE rate_limits IS 'Rate limiting data for API calls and email sending';
COMMENT ON COLUMN rate_limits.key IS 'Unique identifier for the rate limit (e.g., "reminder_emails:user123")';
COMMENT ON COLUMN rate_limits.request_count IS 'Number of requests made in the current window';
COMMENT ON COLUMN rate_limits.window_start IS 'Timestamp when the current rate limit window started';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_rate_limits_updated_at 
    BEFORE UPDATE ON rate_limits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
