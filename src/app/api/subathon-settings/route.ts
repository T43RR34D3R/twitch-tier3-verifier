import { NextRequest, NextResponse } from 'next/server';
import { queryRow } from '@/lib/railway-db';

export interface SubathonSettings {
  id: number;
  // Subscription settings (in seconds)
  tier1_sub_time: number;
  tier2_sub_time: number;
  tier3_sub_time: number;
  // Gift subscription settings
  tier1_gift_time: number;
  tier2_gift_time: number;
  tier3_gift_time: number;
  // Resubscription settings
  tier1_resub_time: number;
  tier2_resub_time: number;
  tier3_resub_time: number;
  // Other events
  follow_time: number;
  bits_per_second: number;
  min_bits_time: number;
  max_bits_time: number;
  raid_time_per_viewer: number;
  min_raid_time: number;
  max_raid_time: number;
  host_time: number;
  // General
  enabled: boolean;
  webhook_secret?: string;
  created_at: string;
  updated_at: string;
}

async function getSubathonSettings(): Promise<SubathonSettings> {
  try {
    const settings = await queryRow(
      'SELECT * FROM subathon_settings ORDER BY id LIMIT 1'
    );

    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = {
        tier1_sub_time: 300,        // 5 minutes
        tier2_sub_time: 600,        // 10 minutes
        tier3_sub_time: 1200,       // 20 minutes
        tier1_gift_time: 300,       // 5 minutes per gift
        tier2_gift_time: 600,       // 10 minutes per gift
        tier3_gift_time: 1200,      // 20 minutes per gift
        tier1_resub_time: 180,      // 3 minutes
        tier2_resub_time: 360,      // 6 minutes
        tier3_resub_time: 720,      // 12 minutes
        follow_time: 30,            // 30 seconds
        bits_per_second: 0.1,       // 0.1 seconds per bit
        min_bits_time: 10,          // 10 seconds minimum
        max_bits_time: 1800,        // 30 minutes maximum
        raid_time_per_viewer: 1.0,  // 1 second per raider
        min_raid_time: 60,          // 1 minute minimum
        max_raid_time: 1800,        // 30 minutes maximum
        host_time: 120,             // 2 minutes
        enabled: true
      };

      const newSettings = await queryRow(`
        INSERT INTO subathon_settings (
          tier1_sub_time, tier2_sub_time, tier3_sub_time,
          tier1_gift_time, tier2_gift_time, tier3_gift_time,
          tier1_resub_time, tier2_resub_time, tier3_resub_time,
          follow_time, bits_per_second, min_bits_time, max_bits_time,
          raid_time_per_viewer, min_raid_time, max_raid_time,
          host_time, enabled
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING *
      `, [
        defaultSettings.tier1_sub_time, defaultSettings.tier2_sub_time, defaultSettings.tier3_sub_time,
        defaultSettings.tier1_gift_time, defaultSettings.tier2_gift_time, defaultSettings.tier3_gift_time,
        defaultSettings.tier1_resub_time, defaultSettings.tier2_resub_time, defaultSettings.tier3_resub_time,
        defaultSettings.follow_time, defaultSettings.bits_per_second, defaultSettings.min_bits_time, defaultSettings.max_bits_time,
        defaultSettings.raid_time_per_viewer, defaultSettings.min_raid_time, defaultSettings.max_raid_time,
        defaultSettings.host_time, defaultSettings.enabled
      ]);

      return newSettings || { id: 1, ...defaultSettings, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    }

    return settings;
  } catch (error) {
    console.error('Error getting subathon settings:', error);
    throw error;
  }
}

async function updateSubathonSettings(updates: Partial<SubathonSettings>): Promise<SubathonSettings> {
  try {
    const currentSettings = await getSubathonSettings();
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (updateFields.length === 0) {
      return currentSettings;
    }
    
    // Add updated_at
    updateFields.push(`updated_at = NOW()`);
    
    // Add settings ID for WHERE clause
    values.push(currentSettings.id);
    
    const updateQuery = `
      UPDATE subathon_settings 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    
    const updatedSettings = await queryRow(updateQuery, values);
    
    if (!updatedSettings) {
      throw new Error('Failed to update subathon settings');
    }
    
    return updatedSettings;
  } catch (error) {
    console.error('Failed to update subathon settings:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const settings = await getSubathonSettings();
    
    // Remove sensitive data from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { webhook_secret, ...publicSettings } = settings;
    
    return NextResponse.json(publicSettings);
  } catch (error) {
    console.error('GET subathon settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subathon settings' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const updates = await request.json();
    console.log('Updating subathon settings:', updates);
    
    // Validate numeric values
    const numericFields = [
      'tier1_sub_time', 'tier2_sub_time', 'tier3_sub_time',
      'tier1_gift_time', 'tier2_gift_time', 'tier3_gift_time',
      'tier1_resub_time', 'tier2_resub_time', 'tier3_resub_time',
      'follow_time', 'min_bits_time', 'max_bits_time',
      'min_raid_time', 'max_raid_time', 'host_time'
    ];
    
    const decimalFields = ['bits_per_second', 'raid_time_per_viewer'];
    
    for (const field of numericFields) {
      if (updates[field] !== undefined) {
        const value = parseInt(updates[field]);
        if (isNaN(value) || value < 0) {
          return NextResponse.json(
            { error: `${field} must be a valid non-negative number` },
            { status: 400 }
          );
        }
        updates[field] = value;
      }
    }
    
    for (const field of decimalFields) {
      if (updates[field] !== undefined) {
        const value = parseFloat(updates[field]);
        if (isNaN(value) || value < 0) {
          return NextResponse.json(
            { error: `${field} must be a valid non-negative decimal` },
            { status: 400 }
          );
        }
        updates[field] = value;
      }
    }
    
    const updatedSettings = await updateSubathonSettings(updates);
    
    // Remove sensitive data from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { webhook_secret, ...publicSettings } = updatedSettings;
    
    return NextResponse.json({
      success: true,
      settings: publicSettings
    });
  } catch (error) {
    console.error('POST subathon settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update subathon settings' }, 
      { status: 500 }
    );
  }
}
