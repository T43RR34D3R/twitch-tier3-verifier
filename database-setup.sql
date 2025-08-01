-- Create verification_logs table
CREATE TABLE IF NOT EXISTS verification_logs (
  id BIGSERIAL PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON verification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_logs_user_id ON verification_logs(user_id);

-- Create page_settings table
CREATE TABLE IF NOT EXISTS page_settings (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  sign_in_text TEXT NOT NULL,
  steps JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_page_settings_updated_at BEFORE UPDATE ON page_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert default page settings if none exist
INSERT INTO page_settings (title, subtitle, sign_in_text, steps)
SELECT 
  'Tier 3 Verification',
  'Verify your Tier 3 subscription to submit info for your custom T3 cheer!',
  'Please sign in with your Twitch account to verify your subscription status.',
  '["Signed In", "Checking Follow", "Checking Tier 3", "Verified"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM page_settings);

-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  broadcaster_id TEXT NOT NULL,
  broadcaster_name TEXT NOT NULL,
  tier TEXT NOT NULL,
  is_gift BOOLEAN DEFAULT FALSE,
  gifter_id TEXT,
  gifter_name TEXT,
  plan_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for subscribers table
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_broadcaster_id ON subscribers(broadcaster_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_tier ON subscribers(tier);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON subscribers(created_at DESC);

-- Create unique constraint to prevent duplicates
ALTER TABLE subscribers ADD CONSTRAINT unique_subscriber UNIQUE (user_id, broadcaster_id);

-- Create trigger to automatically update updated_at for subscribers
CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON subscribers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
