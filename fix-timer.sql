-- Quick fix for the broken timer
UPDATE subathon_timer 
SET 
  end_time = '0',
  is_running = false,
  status = 'Timer Ready - Set time to begin!',
  pending_duration = 0,
  updated_at = NOW()
WHERE id = 1;
