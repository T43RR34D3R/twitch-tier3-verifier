import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabase } from '../../../../lib/supabase'
import { authOptions } from '../../../../lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('users')
      .select('is_admin')
      .eq('twitch_user_id', session.user.id)
      .single()
    
    if (!adminCheck?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all analytics access entries
    const { data: accessList, error } = await supabase
      .from('analytics_access')
      .select('user_id, user_name, enabled, granted_by, granted_at, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ accessList })
  } catch (error) {
    console.error('Error fetching analytics access list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('users')
      .select('is_admin')
      .eq('twitch_user_id', session.user.id)
      .single()
    
    if (!adminCheck?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action, userId, userName } = await request.json()

    switch (action) {
      case 'add':
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        // Check if user already has access
        const { data: existingAccess } = await supabase
          .from('analytics_access')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (existingAccess) {
          return NextResponse.json({ error: 'User already has analytics access' }, { status: 400 })
        }

        // Use provided username or default to 'Unknown User'
        const displayName = userName || 'Unknown User'

        // Add user to analytics access
        const { error: insertError } = await supabase
          .from('analytics_access')
          .insert({
            user_id: userId,
            user_name: displayName,
            enabled: true,
            granted_by: session.user.id
          })

        if (insertError) {
          throw insertError
        }

        return NextResponse.json({ message: 'User added to analytics access' })

      case 'remove':
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        const { error: deleteError } = await supabase
          .from('analytics_access')
          .delete()
          .eq('user_id', userId)

        if (deleteError) {
          throw deleteError
        }

        return NextResponse.json({ message: 'User removed from analytics access' })

      case 'toggle':
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        // First get current enabled state
        const { data: currentAccess } = await supabase
          .from('analytics_access')
          .select('enabled')
          .eq('user_id', userId)
          .single()

        if (!currentAccess) {
          return NextResponse.json({ error: 'User access not found' }, { status: 404 })
        }

        // Toggle the enabled state
        const { error: updateError } = await supabase
          .from('analytics_access')
          .update({ enabled: !currentAccess.enabled })
          .eq('user_id', userId)

        if (updateError) {
          throw updateError
        }

        return NextResponse.json({ message: 'User access toggled' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error managing analytics access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
