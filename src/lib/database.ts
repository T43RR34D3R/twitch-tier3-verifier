import { supabase, VerificationLog, PageSettings } from './supabase'

// Verification Logs
export async function getVerificationLogs(): Promise<VerificationLog[]> {
  try {
    const { data, error } = await supabase
      .from('verification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching verification logs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching verification logs:', error)
    return []
  }
}

export async function addVerificationLog(log: Omit<VerificationLog, 'id' | 'created_at'>): Promise<VerificationLog | null> {
  try {
    const { data, error } = await supabase
      .from('verification_logs')
      .insert([log])
      .select()
      .single()

    if (error) {
      console.error('Error adding verification log:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error adding verification log:', error)
    return null
  }
}

// Page Settings
export async function getPageSettings(): Promise<PageSettings | null> {
  try {
    const { data, error } = await supabase
      .from('page_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching page settings:', error)
      return null
    }

    return data || getDefaultPageSettings()
  } catch (error) {
    console.error('Error fetching page settings:', error)
    return getDefaultPageSettings()
  }
}

export async function savePageSettings(settings: Omit<PageSettings, 'id' | 'updated_at'>): Promise<boolean> {
  try {
    // First, try to get existing settings
    const { data: existing } = await supabase
      .from('page_settings')
      .select('id')
      .limit(1)
      .single()

    let result
    if (existing) {
      // Update existing settings
      result = await supabase
        .from('page_settings')
        .update(settings)
        .eq('id', existing.id)
    } else {
      // Insert new settings
      result = await supabase
        .from('page_settings')
        .insert([settings])
    }

    if (result.error) {
      console.error('Error saving page settings:', result.error)
      return false
    }

    return true
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
