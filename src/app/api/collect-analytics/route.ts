import { NextResponse } from 'next/server'
import { collectDailyAnalyticsForAllUsers } from '@/lib/data-collector'

export async function POST() {
  try {
    // You might want to add authentication here to prevent unauthorized access
    // const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    console.log('Manual analytics collection triggered')
    
    await collectDailyAnalyticsForAllUsers()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Daily analytics collection completed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in manual analytics collection:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to collect analytics',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET endpoint for testing/status
export async function GET() {
  return NextResponse.json({
    endpoint: 'Analytics Collection API',
    description: 'POST to trigger daily analytics collection',
    timestamp: new Date().toISOString()
  })
}
