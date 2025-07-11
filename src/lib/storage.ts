import { promises as fs } from 'fs'
import path from 'path'

export interface VerificationLog {
  id: string
  userName: string
  userId: string
  timestamp: string
  success: boolean
  message: string
}

export interface PageTexts {
  title: string
  subtitle: string
  signInText: string
  steps: string[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const LOGS_FILE = path.join(DATA_DIR, 'verification-logs.json')
const SETTINGS_FILE = path.join(DATA_DIR, 'page-settings.json')

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// Verification Logs
export async function getVerificationLogs(): Promise<VerificationLog[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(LOGS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

export async function addVerificationLog(log: Omit<VerificationLog, 'id' | 'timestamp'>): Promise<VerificationLog> {
  const logs = await getVerificationLogs()
  
  const newLog: VerificationLog = {
    ...log,
    id: Date.now().toString(),
    timestamp: new Date().toISOString()
  }
  
  logs.push(newLog)
  
  // Keep only the last 100 logs
  const trimmedLogs = logs.slice(-100)
  
  await ensureDataDir()
  await fs.writeFile(LOGS_FILE, JSON.stringify(trimmedLogs, null, 2))
  
  return newLog
}

// Page Settings
export async function getPageSettings(): Promise<PageTexts> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    // Return default settings if file doesn't exist
    return {
      title: "Tier 3 Verification",
      subtitle: "Verify your Tier 3 subscription to submit info for your custom T3 cheer!",
      signInText: "Please sign in with your Twitch account to verify your subscription status.",
      steps: ["Signed In", "Checking Follow", "Checking Tier 3", "Verified"]
    }
  }
}

export async function savePageSettings(settings: PageTexts): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}
