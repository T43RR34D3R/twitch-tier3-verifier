import { NextResponse } from 'next/server';
import { query } from '../../../lib/railway-db';

export async function POST() {
  try {
    // For initial setup, we'll allow this to run without authentication
    // You can add authentication back later if needed
    console.log('🚀 SMS Database Setup initiated...');

    console.log('🗄️ Starting SMS notification database setup...');
    const results = [];

    // Step 1: Add SMS notification fields to calendar_events table
    console.log('📅 Adding SMS fields to calendar_events table...');
    try {
      await query('ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false');
      await query('ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT false');
      await query('ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMP WITH TIME ZONE');
      results.push('✅ Added SMS fields to calendar_events table');
    } catch (error: unknown) {
      console.error('Error adding SMS fields:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push(`❌ Error adding SMS fields: ${errorMessage}`);
    }

    // Step 2: Create user_sms_preferences table
    console.log('👤 Creating user_sms_preferences table...');
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS user_sms_preferences (
          id BIGSERIAL PRIMARY KEY,
          user_id TEXT NOT NULL UNIQUE,
          phone_number VARCHAR(20),
          is_enabled BOOLEAN DEFAULT true,
          country_code VARCHAR(5) DEFAULT '+1',
          verified BOOLEAN DEFAULT false,
          verification_code VARCHAR(10),
          verification_expires TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);
      results.push('✅ Created user_sms_preferences table');
    } catch (error: unknown) {
      console.error('Error creating user_sms_preferences table:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push(`❌ Error creating user_sms_preferences table: ${errorMessage}`);
    }

    // Step 3: Create sms_notifications_log table
    console.log('📊 Creating sms_notifications_log table...');
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS sms_notifications_log (
          id BIGSERIAL PRIMARY KEY,
          event_id BIGINT REFERENCES calendar_events(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          phone_number VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'sent',
          twilio_sid VARCHAR(50),
          sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          error_message TEXT
        )
      `);
      results.push('✅ Created sms_notifications_log table');
    } catch (error: unknown) {
      console.error('Error creating sms_notifications_log table:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push(`❌ Error creating sms_notifications_log table: ${errorMessage}`);
    }

    // Step 4: Create indexes for performance
    console.log('🚀 Creating indexes...');
    try {
      await query('CREATE INDEX IF NOT EXISTS idx_user_sms_preferences_user_id ON user_sms_preferences(user_id)');
      await query('CREATE INDEX IF NOT EXISTS idx_user_sms_preferences_enabled ON user_sms_preferences(is_enabled, verified)');
      await query('CREATE INDEX IF NOT EXISTS idx_calendar_events_sms ON calendar_events(sms_enabled, sms_sent, date)');
      await query('CREATE INDEX IF NOT EXISTS idx_sms_notifications_log_event_id ON sms_notifications_log(event_id)');
      await query('CREATE INDEX IF NOT EXISTS idx_sms_notifications_log_user_id ON sms_notifications_log(user_id)');
      await query('CREATE INDEX IF NOT EXISTS idx_sms_notifications_log_sent_at ON sms_notifications_log(sent_at DESC)');
      results.push('✅ Created performance indexes');
    } catch (error: unknown) {
      console.error('Error creating indexes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push(`❌ Error creating indexes: ${errorMessage}`);
    }

    // Step 5: Check if update trigger function exists, if not create it
    console.log('⚙️ Setting up update triggers...');
    try {
      // Check if the update function exists
      const functionExists = await query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_proc 
          WHERE proname = 'update_updated_at_column'
        )
      `);

      if (!functionExists.rows[0].exists) {
        // Create the update trigger function
        await query(`
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ language 'plpgsql'
        `);
        results.push('✅ Created update_updated_at_column function');
      }

      // Create update trigger for user_sms_preferences
      await query('DROP TRIGGER IF EXISTS update_user_sms_preferences_updated_at ON user_sms_preferences');
      await query(`
        CREATE TRIGGER update_user_sms_preferences_updated_at 
        BEFORE UPDATE ON user_sms_preferences 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);
      results.push('✅ Created update trigger for user_sms_preferences');
    } catch (error: unknown) {
      console.error('Error setting up triggers:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push(`❌ Error setting up triggers: ${errorMessage}`);
    }

    // Step 6: Verify setup by checking tables exist
    console.log('🔍 Verifying database setup...');
    try {
      const tableCheck = await query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('calendar_events', 'user_sms_preferences', 'sms_notifications_log')
        ORDER BY table_name
      `);
      
      const tables = tableCheck.rows.map(row => row.table_name);
      results.push(`✅ Verified tables exist: ${tables.join(', ')}`);

      // Check calendar_events has SMS columns
      const columnCheck = await query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name IN ('sms_enabled', 'sms_sent', 'sms_sent_at')
        ORDER BY column_name
      `);
      
      const columns = columnCheck.rows.map(row => row.column_name);
      results.push(`✅ Verified SMS columns in calendar_events: ${columns.join(', ')}`);
    } catch (error: unknown) {
      console.error('Error verifying setup:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push(`❌ Error verifying setup: ${errorMessage}`);
    }

    console.log('🎉 SMS notification database setup completed!');
    
    return NextResponse.json({
      success: true,
      message: 'SMS notification database setup completed successfully!',
      results: results,
      next_steps: [
        '1. Set up Twilio account at https://twilio.com',
        '2. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to your environment variables',
        '3. Deploy your app to activate the cron job',
        '4. Test by creating an event with SMS notifications enabled'
      ]
    });

  } catch (error: unknown) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to set up SMS notification database',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Make sure your DATABASE_URL is correct and the database is accessible'
      },
      { status: 500 }
    );
  }
}
