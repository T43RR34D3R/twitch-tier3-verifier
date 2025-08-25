import { NextRequest, NextResponse } from 'next/server';
import { queryRow } from '@/lib/railway-db';

export async function POST(request: NextRequest) {
  try {
    // Simple security check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'migrate-token-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('Resetting timer to clean state...');

    // Reset the timer to a clean state
    const resetResult = await queryRow(`
      UPDATE subathon_timer 
      SET 
        end_time = '0',
        is_running = false,
        status = 'Timer Ready - Set time to begin!',
        pending_duration = 0,
        updated_at = NOW()
      WHERE id = 1
      RETURNING *
    `);

    if (!resetResult) {
      // If no timer exists, create a new one
      const createResult = await queryRow(`
        INSERT INTO subathon_timer (end_time, is_running, status, pending_duration)
        VALUES ('0', false, 'Timer Ready - Set time to begin!', 0)
        RETURNING *
      `);
      
      return NextResponse.json({
        success: true,
        message: 'Timer created with clean state',
        timer: createResult
      });
    }

    console.log('✅ Timer reset successfully:', resetResult);

    return NextResponse.json({
      success: true,
      message: 'Timer reset to clean state',
      timer: resetResult
    });

  } catch (error) {
    console.error('Timer reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset timer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
