import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { validateTwitchToken } from '@/lib/twitch'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Validate the Twitch token
    const twitchUser = await validateTwitchToken(token)
    if (!twitchUser) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Check if user has analytics access
    const { data: accessData, error: accessError } = await supabase
      .from('analytics_access')
      .select('*')
      .eq('user_id', twitchUser.id)
      .eq('enabled', true)
      .single()

    if (accessError || !accessData) {
      return res.status(403).json({ 
        error: 'Analytics access not granted',
        hasAccess: false
      })
    }

    return res.status(200).json({
      hasAccess: true,
      accessDetails: {
        user_id: accessData.user_id,
        user_name: accessData.user_name,
        granted_by: accessData.granted_by,
        granted_at: accessData.granted_at
      }
    })

  } catch (error) {
    console.error('Analytics access check error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
