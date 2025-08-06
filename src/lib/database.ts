import { queryRows, queryRow } from './railway-db'

// Types
export interface VerificationLog {
  id?: number;
  user_name: string;
  user_id: string;
  success: boolean;
  message: string;
  created_at?: string;
}

export interface PageSettings {
  id?: number;
  title: string;
  subtitle: string;
  sign_in_text: string;
  steps: string[];
  redirect_url_1?: string;
  redirect_url_2?: string;
  redirect_label_1?: string;
  redirect_label_2?: string;
  enable_dual_choice?: boolean;
  success_message?: string;
  updated_at?: string;
}

// Verification Logs
export async function getVerificationLogs(): Promise<VerificationLog[]> {
  try {
    const logs = await queryRows(
      'SELECT * FROM verification_logs ORDER BY created_at DESC LIMIT 100'
    );
    return logs || [];
  } catch (error) {
    console.error('Error fetching verification logs:', error)
    return []
  }
}

export async function addVerificationLog(log: Omit<VerificationLog, 'id' | 'created_at'>): Promise<VerificationLog | null> {
  try {
    // Use DEFAULT for id to let the database auto-increment
    const result = await queryRow(
      'INSERT INTO verification_logs (user_name, user_id, success, message, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [log.user_name, log.user_id, log.success, log.message]
    );
    return result;
  } catch (error) {
    console.error('Error adding verification log:', error)
    return null
  }
}

// Page Settings
export async function getPageSettings(): Promise<PageSettings | null> {
  try {
    const settings = await queryRow(
      'SELECT * FROM page_settings ORDER BY updated_at DESC LIMIT 1'
    );
    return settings || getDefaultPageSettings();
  } catch (error) {
    console.error('Error fetching page settings:', error)
    return getDefaultPageSettings()
  }
}

export async function savePageSettings(settings: Omit<PageSettings, 'id' | 'updated_at'>): Promise<boolean> {
  try {
    // First, try to get existing settings
    const existing = await queryRow('SELECT id FROM page_settings LIMIT 1');
    
    if (existing) {
      // Update existing settings
      await queryRow(
        `UPDATE page_settings SET 
         title = $1, 
         subtitle = $2, 
         sign_in_text = $3, 
         steps = $4, 
         redirect_url_1 = $5, 
         redirect_url_2 = $6, 
         redirect_label_1 = $7, 
         redirect_label_2 = $8, 
         enable_dual_choice = $9, 
         success_message = $10,
         updated_at = NOW() 
         WHERE id = $11`,
        [
          settings.title,
          settings.subtitle, 
          settings.sign_in_text,
          JSON.stringify(settings.steps),
          settings.redirect_url_1,
          settings.redirect_url_2,
          settings.redirect_label_1,
          settings.redirect_label_2,
          settings.enable_dual_choice,
          settings.success_message,
          existing.id
        ]
      );
    } else {
      // Insert new settings
      await queryRow(
        `INSERT INTO page_settings 
         (title, subtitle, sign_in_text, steps, redirect_url_1, redirect_url_2, redirect_label_1, redirect_label_2, enable_dual_choice, success_message) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          settings.title,
          settings.subtitle,
          settings.sign_in_text, 
          JSON.stringify(settings.steps),
          settings.redirect_url_1,
          settings.redirect_url_2,
          settings.redirect_label_1,
          settings.redirect_label_2,
          settings.enable_dual_choice,
          settings.success_message
        ]
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error saving page settings:', error)
    return false
  }
}

function getDefaultPageSettings(): PageSettings {
  return {
    title: "Tier 3 Toolkit",
    subtitle: "Verify your Tier 3 subscription to submit info for your custom T3 cheer!",
    sign_in_text: "Please sign in with your Twitch account to verify your subscription status.",
    steps: ["Signed In", "Verifying Account", "Checking Tier 3", "Verified"]
  }
}
