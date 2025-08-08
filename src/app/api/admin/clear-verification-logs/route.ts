import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/railway-db';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admin users
    if (!session?.user?.id || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 });
    }

    console.log('Clearing verification logs table...');

    // Get count before clearing
    const countBeforeResult = await query('SELECT COUNT(*) as count FROM verification_logs');
    const countBefore = countBeforeResult.rows[0]?.count || 0;

    // Clear all verification logs
    await query('DELETE FROM verification_logs');
    
    // Reset the auto-increment sequence
    await query('ALTER SEQUENCE verification_logs_id_seq RESTART WITH 1');

    console.log(`Cleared ${countBefore} verification log entries`);

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${countBefore} verification log entries`,
      deletedCount: countBefore
    });

  } catch (error) {
    console.error('Clear verification logs error:', error);
    return NextResponse.json(
      { error: 'Failed to clear verification logs: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
