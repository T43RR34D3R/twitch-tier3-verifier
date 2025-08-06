-- Create subathon_timer table for persistent timer state
CREATE TABLE IF NOT EXISTS public.subathon_timer (
    id SERIAL PRIMARY KEY,
    end_time BIGINT DEFAULT 0,
    is_running BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'Timer Ready - Set time to begin!',
    pending_duration INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial timer state
INSERT INTO public.subathon_timer (end_time, is_running, status, pending_duration) 
VALUES (0, false, 'Timer Ready - Set time to begin!', 0)
ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subathon_timer_updated_at
    BEFORE UPDATE ON public.subathon_timer
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.subathon_timer ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is a single-row table)
CREATE POLICY "Allow all operations on subathon_timer" ON public.subathon_timer
    FOR ALL USING (true);
