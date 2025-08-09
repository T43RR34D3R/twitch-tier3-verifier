import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { queryRows, queryRow } from '../../../../lib/railway-db';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is a hardcoded admin (can add other admins)
    const hardcodedAdminIds = ['441862265', '269187200'];
    const isHardcodedAdmin = hardcodedAdminIds.includes(session.user.id || '');
    
    if (!isHardcodedAdmin) {
      return NextResponse.json({ error: 'Only hardcoded admins can add new admin users' }, { status: 403 });
    }

    // Add buckfoozle as admin user
    const userId = '269187200';
    const username = 'buckfoozle';
    const displayName = 'BuckFoozle';
    
    // Check if user already exists
    const existingUser = await queryRows(
      'SELECT id, user_id, username, is_active FROM admin_users WHERE user_id = $1',
      [userId]
    );

    let result;
    if (existingUser && existingUser.length > 0) {
      // Update existing user to ensure they're active
      result = await queryRow(
        `UPDATE admin_users SET 
          username = $1, 
          display_name = $2, 
          is_active = true, 
          role = 'super_admin',
          updated_at = NOW()
        WHERE user_id = $3 
        RETURNING *`,
        [username, displayName, userId]
      );
    } else {
      // Insert new admin user
      result = await queryRow(
        `INSERT INTO admin_users (user_id, username, display_name, role, is_active, created_by)
        VALUES ($1, $2, $3, 'super_admin', true, $4)
        RETURNING *`,
        [userId, username, displayName, session.user.id]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'BuckFoozle has been added as calendar admin successfully!',
      admin: {
        user_id: result.user_id,
        username: result.username,
        display_name: result.display_name,
        role: result.role,
        is_active: result.is_active
      }
    });

  } catch (error) {
    console.error('Error adding calendar admin:', error);
    return NextResponse.json(
      { error: 'Failed to add admin user' },
      { status: 500 }
    );
  }
}

// GET endpoint to check current admin users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is a hardcoded admin
    const hardcodedAdminIds = ['441862265', '269187200'];
    const isHardcodedAdmin = hardcodedAdminIds.includes(session.user.id || '');
    
    if (!isHardcodedAdmin) {
      return NextResponse.json({ error: 'Only hardcoded admins can view admin users' }, { status: 403 });
    }

    const admins = await queryRows(
      'SELECT user_id, username, display_name, role, is_active, created_at FROM admin_users ORDER BY created_at',
      []
    );

    return NextResponse.json({ admins });

  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin users' },
      { status: 500 }
    );
  }
}
