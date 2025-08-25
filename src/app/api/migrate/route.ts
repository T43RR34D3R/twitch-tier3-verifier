import { NextRequest, NextResponse } from 'next/server';
import { queryRow } from '@/lib/railway-db';

export async function POST(request: NextRequest) {
  try {
    // Simple security check - only allow from localhost or if a specific header is present
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'migrate-token-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('Running database migration for merch columns...');

    // Add merch_enabled column
    await queryRow(`
      ALTER TABLE subathon_settings 
      ADD COLUMN IF NOT EXISTS merch_enabled BOOLEAN DEFAULT true
    `);
    console.log('✅ Added merch_enabled column');

    // Add merch_base_reward_minutes column
    await queryRow(`
      ALTER TABLE subathon_settings 
      ADD COLUMN IF NOT EXISTS merch_base_reward_minutes INTEGER DEFAULT 5
    `);
    console.log('✅ Added merch_base_reward_minutes column');

    // Add merch_price_threshold column
    await queryRow(`
      ALTER TABLE subathon_settings 
      ADD COLUMN IF NOT EXISTS merch_price_threshold INTEGER DEFAULT 10
    `);
    console.log('✅ Added merch_price_threshold column');

    // Add merch_bonus_50_minutes column
    await queryRow(`
      ALTER TABLE subathon_settings 
      ADD COLUMN IF NOT EXISTS merch_bonus_50_minutes INTEGER DEFAULT 10
    `);
    console.log('✅ Added merch_bonus_50_minutes column');

    // Add merch_bonus_100_minutes column
    await queryRow(`
      ALTER TABLE subathon_settings 
      ADD COLUMN IF NOT EXISTS merch_bonus_100_minutes INTEGER DEFAULT 30
    `);
    console.log('✅ Added merch_bonus_100_minutes column');

    // Update existing record with default values
    const updateResult = await queryRow(`
      UPDATE subathon_settings 
      SET 
          merch_enabled = COALESCE(merch_enabled, true),
          merch_base_reward_minutes = COALESCE(merch_base_reward_minutes, 5),
          merch_price_threshold = COALESCE(merch_price_threshold, 10),
          merch_bonus_50_minutes = COALESCE(merch_bonus_50_minutes, 10),
          merch_bonus_100_minutes = COALESCE(merch_bonus_100_minutes, 30),
          updated_at = NOW()
      WHERE id = 1
      RETURNING *
    `);
    console.log('✅ Updated existing settings record:', updateResult);

    // Verify the migration worked
    const settings = await queryRow('SELECT * FROM subathon_settings WHERE id = 1');
    console.log('✅ Current settings after migration:', settings);

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      settings: settings
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
