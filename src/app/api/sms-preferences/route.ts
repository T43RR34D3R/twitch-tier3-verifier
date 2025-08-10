import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { queryRow } from '../../../lib/railway-db';
import { sendVerificationSMS, generateVerificationCode, isValidPhoneNumber } from '../../../lib/twilio';

// Get SMS preferences for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await queryRow(
      'SELECT * FROM user_sms_preferences WHERE user_id = $1',
      [session.user.id]
    );

    if (!preferences) {
      // Return default preferences if none exist
      return NextResponse.json({
        preferences: {
          phone_number: null,
          is_enabled: false,
          country_code: '+46',
          verified: false
        }
      });
    }

    // Don't send verification code in response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { verification_code: _, ...safePreferences } = preferences;
    
    return NextResponse.json({ preferences: safePreferences });
  } catch (error) {
    console.error('Error fetching SMS preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS preferences' },
      { status: 500 }
    );
  }
}

// Update SMS preferences
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone_number, is_enabled, country_code } = await request.json();

    // Format the full phone number (country code + number)
    let formattedPhone = null;
    if (phone_number && country_code) {
      // Remove any non-digits from phone number
      const cleanNumber = phone_number.replace(/\D/g, '');
      // Combine country code with clean number
      formattedPhone = country_code + cleanNumber;
    }

    // Validate the formatted phone number if provided
    if (formattedPhone && !isValidPhoneNumber(formattedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Check if preferences already exist
    const existing = await queryRow(
      'SELECT id, phone_number FROM user_sms_preferences WHERE user_id = $1',
      [session.user.id]
    );

    let result;
    const phoneChanged = existing && existing.phone_number !== formattedPhone;

    if (existing) {
      // Update existing preferences
      result = await queryRow(
        `UPDATE user_sms_preferences SET 
          phone_number = $1, 
          is_enabled = $2, 
          country_code = $3,
          verified = $4,
          updated_at = NOW()
        WHERE user_id = $5 
        RETURNING *`,
        [
          formattedPhone,
          is_enabled || false,
          country_code || '+46',

          phoneChanged ? false : existing.verified, // Reset verification if phone changed
          session.user.id
        ]
      );
    } else {
      // Create new preferences
      result = await queryRow(
        `INSERT INTO user_sms_preferences (
          user_id, phone_number, is_enabled, country_code, verified
        ) VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`,
        [
          session.user.id,
          formattedPhone,
          is_enabled || false,
          country_code || '+46',
          false
        ]
      );
    }

    // Don't send verification code in response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { verification_code: __, ...safeResult } = result;

    return NextResponse.json({ 
      preferences: safeResult,
      phoneChanged: phoneChanged || false
    });
  } catch (error) {
    console.error('Error updating SMS preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update SMS preferences' },
      { status: 500 }
    );
  }
}

// Send verification code
export async function PUT() {
  console.log('📱 [SMS API Debug] PUT /api/sms-preferences called');
  console.log('📱 [SMS API Debug] Environment variables:');
  console.log('- TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'NOT SET');
  console.log('- TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET');
  console.log('- TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'SET' : 'NOT SET');
  
  try {
    const session = await getServerSession(authOptions);
    console.log('📱 [SMS API Debug] Session user:', session?.user?.id || 'NO SESSION');
    
    if (!session?.user) {
      console.log('📱 [SMS API Debug] No session, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await queryRow(
      'SELECT phone_number FROM user_sms_preferences WHERE user_id = $1',
      [session.user.id]
    );
    
    console.log('📱 [SMS API Debug] User preferences:', preferences);

    if (!preferences?.phone_number) {
      console.log('📱 [SMS API Debug] No phone number found for user');
      return NextResponse.json(
        { error: 'No phone number found. Please save your phone number first.' },
        { status: 400 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save verification code
    await queryRow(
      `UPDATE user_sms_preferences SET 
        verification_code = $1, 
        verification_expires = $2,
        updated_at = NOW()
      WHERE user_id = $3`,
      [code, expiresAt, session.user.id]
    );

    // Send SMS
    console.log('📱 [SMS API Debug] Attempting to send SMS to:', preferences.phone_number);
    console.log('📱 [SMS API Debug] Generated code:', code);
    const smsResult = await sendVerificationSMS(preferences.phone_number, code);
    console.log('📱 [SMS API Debug] SMS Result:', smsResult);
    
    if (!smsResult.success) {
      console.log('📱 [SMS API Debug] SMS send failed:', smsResult.error);
      return NextResponse.json(
        { error: `Failed to send verification SMS: ${smsResult.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Verification code sent successfully'
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}

// Verify phone number with code
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    const preferences = await queryRow(
      `SELECT verification_code, verification_expires 
       FROM user_sms_preferences 
       WHERE user_id = $1`,
      [session.user.id]
    );

    if (!preferences) {
      return NextResponse.json(
        { error: 'No SMS preferences found' },
        { status: 404 }
      );
    }

    // Check if code is valid and not expired
    if (preferences.verification_code !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(preferences.verification_expires)) {
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      );
    }

    // Mark as verified and clear verification code
    const result = await queryRow(
      `UPDATE user_sms_preferences SET 
        verified = true,
        verification_code = NULL,
        verification_expires = NULL,
        updated_at = NOW()
      WHERE user_id = $1 
      RETURNING *`,
      [session.user.id]
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { verification_code: ___, ...safeResult } = result;

    return NextResponse.json({ 
      success: true,
      preferences: safeResult,
      message: 'Phone number verified successfully'
    });
  } catch (error) {
    console.error('Error verifying phone number:', error);
    return NextResponse.json(
      { error: 'Failed to verify phone number' },
      { status: 500 }
    );
  }
}
