import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * Clean up expired Minecraft authorization records
 * POST /api/minecraft/auth/cleanup
 * This endpoint can be called periodically to clean up old records
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Check for a simple auth header to prevent unauthorized cleanup
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.CLEANUP_AUTH_TOKEN;
    
    if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Clean up expired pending authorizations (older than 1 hour)
    const pendingResult = await sql`
      DELETE FROM minecraft_auth_pending 
      WHERE expires_at < NOW() - INTERVAL '1 hour'
    `;

    // Clean up old completed authorizations (older than 24 hours)
    // These are only needed temporarily for the plugin to poll
    const completedResult = await sql`
      DELETE FROM minecraft_auth_completed 
      WHERE completed_at < NOW() - INTERVAL '24 hours'
    `;

    return NextResponse.json({
      success: true,
      deletedPending: pendingResult.rowCount || 0,
      deletedCompleted: completedResult.rowCount || 0,
      message: 'Cleanup completed successfully'
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get cleanup statistics
 * GET /api/minecraft/auth/cleanup
 */
export async function GET() {
  try {
    // Get counts of records that would be cleaned up
    const pendingExpiredResult = await sql`
      SELECT COUNT(*) as count
      FROM minecraft_auth_pending 
      WHERE expires_at < NOW() - INTERVAL '1 hour'
    `;

    const completedOldResult = await sql`
      SELECT COUNT(*) as count
      FROM minecraft_auth_completed 
      WHERE completed_at < NOW() - INTERVAL '24 hours'
    `;

    const totalPendingResult = await sql`
      SELECT COUNT(*) as count
      FROM minecraft_auth_pending
    `;

    const totalCompletedResult = await sql`
      SELECT COUNT(*) as count
      FROM minecraft_auth_completed
    `;

    const totalLinksResult = await sql`
      SELECT COUNT(*) as count
      FROM minecraft_twitch_links
    `;

    return NextResponse.json({
      pending: {
        total: parseInt(totalPendingResult.rows[0].count),
        expired: parseInt(pendingExpiredResult.rows[0].count)
      },
      completed: {
        total: parseInt(totalCompletedResult.rows[0].count),
        old: parseInt(completedOldResult.rows[0].count)
      },
      links: {
        total: parseInt(totalLinksResult.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
