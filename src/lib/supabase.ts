import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface VerificationLog {
  id?: number
  user_name: string
  user_id: string
  timestamp?: string
  success: boolean
  message: string
  created_at?: string
}

export interface PageSettings {
  id?: number
  title: string
  subtitle: string
  sign_in_text: string
  steps: string[]
  updated_at?: string
}
