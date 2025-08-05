import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Testing TwitchTracker database connection...');

    // Test database connection and table existence
    const tests = [];

    // Test 1: Check if channel data table exists and has data
    const { data: channelData, error: channelError } = await supabase
      .from('twitchtracker_channel_data')
      .select('*')
      .limit(5);

    tests.push({
      test: 'twitchtracker_channel_data',
      success: !channelError,
      error: channelError?.message,
      count: channelData?.length || 0,
      sample: channelData?.[0] || null
    });

    // Test 2: Check game stats table
    const { data: gameData, error: gameError } = await supabase
      .from('twitchtracker_game_stats')
      .select('*')  
      .limit(5);

    tests.push({
      test: 'twitchtracker_game_stats',
      success: !gameError,
      error: gameError?.message,
      count: gameData?.length || 0,
      sample: gameData?.[0] || null
    });

    // Test 3: Check subscriber breakdown table
    const { data: subData, error: subError } = await supabase
      .from('twitchtracker_sub_breakdown')
      .select('*')
      .limit(5);

    tests.push({
      test: 'twitchtracker_sub_breakdown',
      success: !subError,
      error: subError?.message,
      count: subData?.length || 0,
      sample: subData?.[0] || null
    });

    // Test 4: Check stream history table
    const { data: streamData, error: streamError } = await supabase
      .from('twitchtracker_stream_history')
      .select('*')
      .limit(5);

    tests.push({
      test: 'twitchtracker_stream_history',
      success: !streamError,
      error: streamError?.message,
      count: streamData?.length || 0,
      sample: streamData?.[0] || null
    });

    // Summary
    const totalRecords = tests.reduce((sum, test) => sum + test.count, 0);
    const failedTests = tests.filter(test => !test.success);

    return NextResponse.json({
      success: failedTests.length === 0,
      summary: {
        totalTables: tests.length,
        failedTables: failedTests.length,
        totalRecords,
        hasData: totalRecords > 0
      },
      tests,
      message: totalRecords === 0 
        ? 'Database tables exist but are empty. Run data collection first.' 
        : `Found ${totalRecords} records across ${tests.length} tables.`
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test database connection'
    }, { status: 500 });
  }
}
