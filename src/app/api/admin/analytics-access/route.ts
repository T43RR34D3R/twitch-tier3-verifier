import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminCheck = await sql`
      SELECT is_admin FROM users WHERE twitch_user_id = ${session.user.id}
    `
    
    if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all analytics access entries
    const accessList = await sql`
      SELECT 
        user_id,
        user_name,
        enabled,
        granted_by,
        granted_at,
        created_at
      FROM analytics_access 
      ORDER BY created_at DESC
    `

    return NextResponse.json({ accessList: accessList.rows })
  } catch (error) {
    console.error('Error fetching analytics access list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminCheck = await sql`
      SELECT is_admin FROM users WHERE twitch_user_id = ${session.user.id}
    `
    
    if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action, userId, userName } = await request.json()

    switch (action) {
      case 'add':
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        // Check if user already has access
        const existingAccess = await sql`
          SELECT id FROM analytics_access WHERE user_id = ${userId}
        `

        if (existingAccess.rows.length > 0) {
          return NextResponse.json({ error: 'User already has analytics access' }, { status: 400 })
        }

        // Use provided username or default to 'Unknown User'
        const displayName = userName || 'Unknown User'

        // Add user to analytics access
        await sql`
          INSERT INTO analytics_access (user_id, user_name, enabled, granted_by)
          VALUES (${userId}, ${displayName}, true, ${session.user.id})
        `

        return NextResponse.json({ message: 'User added to analytics access' })

      case 'remove':
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        await sql`
          DELETE FROM analytics_access WHERE user_id = ${userId}
        `

        return NextResponse.json({ message: 'User removed from analytics access' })

      case 'toggle':
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        await sql`
          UPDATE analytics_access 
          SET enabled = NOT enabled
          WHERE user_id = ${userId}
        `

        return NextResponse.json({ message: 'User access toggled' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error managing analytics access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
