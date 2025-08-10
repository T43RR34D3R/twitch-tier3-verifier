-- SMS Notifications Setup for Calendar System
-- Run this to add SMS notification capabilities

-- Add SMS notification fields to calendar_events table
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT false;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMP WITH TIME ZONE;

-- Create user_sms_preferences table for storing user phone numbers and preferences
CREATE TABLE IF NOT EXISTS user_sms_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    is_enabled BOOLEAN DEFAULT true,
    country_code VARCHAR(5) DEFAULT '+1',
    verified BOOLEAN DEFAULT false,
    verification_code VARCHAR(10),
    verification_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create sms_notifications_log table for tracking sent notifications
CREATE TABLE IF NOT EXISTS sms_notifications_log (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES calendar_events(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'sent', -- sent, failed, delivered
    twilio_sid VARCHAR(50),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    error_message TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sms_preferences_user_id ON user_sms_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sms_preferences_enabled ON user_sms_preferences(is_enabled, verified);
CREATE INDEX IF NOT EXISTS idx_calendar_events_sms ON calendar_events(sms_enabled, sms_sent, date);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_log_event_id ON sms_notifications_log(event_id);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_log_user_id ON sms_notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_log_sent_at ON sms_notifications_log(sent_at DESC);

-- Create update triggers
DROP TRIGGER IF EXISTS update_user_sms_preferences_updated_at ON user_sms_preferences;
CREATE TRIGGER update_user_sms_preferences_updated_at 
  BEFORE UPDATE ON user_sms_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'SMS notification system database setup completed successfully!' as status;
