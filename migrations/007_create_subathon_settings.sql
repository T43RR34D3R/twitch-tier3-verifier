-- Create subathon_settings table for configurable timer additions
CREATE TABLE IF NOT EXISTS public.subathon_settings (
    id SERIAL PRIMARY KEY,
    
    -- Subscription settings (in seconds)
    tier1_sub_time INTEGER DEFAULT 300,        -- 5 minutes
    tier2_sub_time INTEGER DEFAULT 600,        -- 10 minutes  
    tier3_sub_time INTEGER DEFAULT 1200,       -- 20 minutes
    
    -- Gift subscription settings (in seconds)
    tier1_gift_time INTEGER DEFAULT 300,       -- 5 minutes per gift
    tier2_gift_time INTEGER DEFAULT 600,       -- 10 minutes per gift
    tier3_gift_time INTEGER DEFAULT 1200,      -- 20 minutes per gift
    
    -- Resubscription settings (in seconds)
    tier1_resub_time INTEGER DEFAULT 180,      -- 3 minutes
    tier2_resub_time INTEGER DEFAULT 360,      -- 6 minutes
    tier3_resub_time INTEGER DEFAULT 720,      -- 12 minutes
    
    -- Follow settings
    follow_time INTEGER DEFAULT 30,            -- 30 seconds
    
    -- Bits/Cheer settings
    bits_per_second DECIMAL(10,4) DEFAULT 0.1, -- 0.1 seconds per bit (100 bits = 10 seconds)
    min_bits_time INTEGER DEFAULT 10,          -- Minimum 10 seconds for any bits donation
    max_bits_time INTEGER DEFAULT 1800,        -- Maximum 30 minutes for bits
    
    -- Raid settings
    raid_time_per_viewer DECIMAL(10,4) DEFAULT 1.0,  -- 1 second per raider
    min_raid_time INTEGER DEFAULT 60,          -- Minimum 1 minute
    max_raid_time INTEGER DEFAULT 1800,        -- Maximum 30 minutes
    
    -- Host settings
    host_time INTEGER DEFAULT 120,             -- 2 minutes
    
    -- General settings
    enabled BOOLEAN DEFAULT true,              -- Master enable/disable
    webhook_secret TEXT,                       -- Twitch webhook secret
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.subathon_settings (
    tier1_sub_time, tier2_sub_time, tier3_sub_time,
    tier1_gift_time, tier2_gift_time, tier3_gift_time,
    tier1_resub_time, tier2_resub_time, tier3_resub_time,
    follow_time, bits_per_second, min_bits_time, max_bits_time,
    raid_time_per_viewer, min_raid_time, max_raid_time,
    host_time, enabled
) VALUES (
    300, 600, 1200,     -- Sub times: 5min, 10min, 20min
    300, 600, 1200,     -- Gift times: 5min, 10min, 20min  
    180, 360, 720,      -- Resub times: 3min, 6min, 12min
    30, 0.1, 10, 1800,  -- Follow: 30s, Bits: 0.1s per bit, min 10s, max 30min
    1.0, 60, 1800,      -- Raid: 1s per viewer, min 1min, max 30min
    120, true           -- Host: 2min, enabled
) ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at automatically
CREATE TRIGGER update_subathon_settings_updated_at
    BEFORE UPDATE ON public.subathon_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.subathon_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (admin-only table)
CREATE POLICY "Allow all operations on subathon_settings" ON public.subathon_settings
    FOR ALL USING (true);
