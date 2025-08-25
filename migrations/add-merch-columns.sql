-- Migration to add merch-related columns to subathon_settings table

-- Add merch_enabled column (default to true to enable merch rewards)
ALTER TABLE subathon_settings 
ADD COLUMN IF NOT EXISTS merch_enabled BOOLEAN DEFAULT true;

-- Add merch_base_reward_minutes column (default to 5 minutes)
ALTER TABLE subathon_settings 
ADD COLUMN IF NOT EXISTS merch_base_reward_minutes INTEGER DEFAULT 5;

-- Add merch_price_threshold column (default to $10 threshold)
ALTER TABLE subathon_settings 
ADD COLUMN IF NOT EXISTS merch_price_threshold INTEGER DEFAULT 10;

-- Add merch_bonus_50_minutes column (default to 10 minutes bonus for $50+)
ALTER TABLE subathon_settings 
ADD COLUMN IF NOT EXISTS merch_bonus_50_minutes INTEGER DEFAULT 10;

-- Add merch_bonus_100_minutes column (default to 30 minutes bonus for $100+)
ALTER TABLE subathon_settings 
ADD COLUMN IF NOT EXISTS merch_bonus_100_minutes INTEGER DEFAULT 30;

-- Update existing record to have the default values if it exists
UPDATE subathon_settings 
SET 
    merch_enabled = COALESCE(merch_enabled, true),
    merch_base_reward_minutes = COALESCE(merch_base_reward_minutes, 5),
    merch_price_threshold = COALESCE(merch_price_threshold, 10),
    merch_bonus_50_minutes = COALESCE(merch_bonus_50_minutes, 10),
    merch_bonus_100_minutes = COALESCE(merch_bonus_100_minutes, 30),
    updated_at = NOW()
WHERE id = 1;
