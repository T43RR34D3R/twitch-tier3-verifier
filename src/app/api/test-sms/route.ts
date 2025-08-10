import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '../../../lib/twilio';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 SMS Test endpoint called');
    console.log('🔍 Environment variables check:');
    console.log('- TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'NOT SET');
    console.log('- TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET');
    console.log('- TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'SET' : 'NOT SET');
    
    const { phone_number } = await request.json();
    
    if (!phone_number) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing SMS to:', phone_number);
    
    const message = '🧪 Test SMS from your calendar app! If you receive this, SMS notifications are working correctly.';
    const result = await sendSMS(phone_number, message);
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'Test SMS sent successfully!' 
        : `Failed to send SMS: ${result.error}`,
      twilioSid: result.sid,
      error: result.error
    });
    
  } catch (error: unknown) {
    console.error('Test SMS error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test SMS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Allow GET for easy testing
export async function GET() {
  return NextResponse.json({
    message: 'SMS Test Endpoint',
    usage: 'Send POST request with { "phone_number": "+13139233844" }'
  });
}
