import { NextResponse } from 'next/server';
import { query } from '../../../../lib/railway-db';

export async function POST() {
  try {
    console.log('🚀 Starting migration: Add message_html column to chat_highlights table...');
    
    // Check if column already exists
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'chat_highlights' 
      AND column_name = 'message_html'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Column message_html already exists, skipping migration');
      return NextResponse.json({ 
        success: true, 
        message: 'Column message_html already exists, skipping migration' 
      });
    }
    
    // Add the column
    await query(`
      ALTER TABLE chat_highlights 
      ADD COLUMN message_html TEXT
    `);
    
    // Add comment
    await query(`
      COMMENT ON COLUMN chat_highlights.message_html 
      IS 'HTML version of the message with emote images rendered as <img> tags'
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added message_html column to chat_highlights table');
    
    // Verify the column was added
    const verifyColumn = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'chat_highlights' 
      AND column_name = 'message_html'
    `);
    
    if (verifyColumn.rows.length > 0) {
      console.log('✅ Verification successful:', verifyColumn.rows[0]);
      return NextResponse.json({
        success: true,
        message: 'Migration completed successfully!',
        column_info: verifyColumn.rows[0]
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Column was not created successfully'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed: ' + (error as Error).message
    }, { status: 500 });
  }
}
