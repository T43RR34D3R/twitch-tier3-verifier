-- Migration: Add user_tokens table for daily analytics collection
-- Run this in Supabase SQL Editor

-- User Tokens for Background Data Collection
CREATE TABLE IF NOT EXISTS user_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add index for user lookup
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to manage their own tokens (this is for admin access only)
CREATE POLICY "Allow service role to manage user tokens" ON user_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Add update trigger for user_tokens
CREATE TRIGGER update_user_tokens_updated_at 
  BEFORE UPDATE ON user_tokens 
  FOR EACH ROW EXECUTE PROCEDURE update_analytics_updated_at_column();

-- Insert Buckfoozle's analytics access if it doesn't exist
INSERT INTO analytics_access (user_id, user_name, enabled, granted_by)
VALUES ('1205951397', 'Buckfoozle', true, 'system')
ON CONFLICT (user_id) DO UPDATE SET enabled = true;
