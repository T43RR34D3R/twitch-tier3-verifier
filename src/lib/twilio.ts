import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Debug logging for environment variables
console.log('🔍 Twilio Environment Variables Debug:');
console.log('- TWILIO_ACCOUNT_SID:', accountSid ? `${accountSid.substring(0, 8)}...` : 'NOT SET');
console.log('- TWILIO_AUTH_TOKEN:', authToken ? `${authToken.substring(0, 8)}...` : 'NOT SET');
console.log('- TWILIO_PHONE_NUMBER:', fromNumber || 'NOT SET');
console.log('- All env vars present:', !!(accountSid && authToken && fromNumber));

if (!accountSid || !authToken || !fromNumber) {
  console.warn('❌ Twilio credentials not found. SMS notifications will not work.');
  console.warn('Missing variables:', {
    accountSid: !accountSid,
    authToken: !authToken,
    phoneNumber: !fromNumber
  });
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SMSResult {
  success: boolean;
  sid?: string;
  error?: string;
}

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  if (!client || !fromNumber) {
    return {
      success: false,
      error: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.'
    };
  }

  try {
    // Ensure phone number is in E.164 format
    const phoneNumber = formatPhoneNumber(to);
    
    const messageResult = await client.messages.create({
      body: message,
      from: fromNumber,
      to: phoneNumber,
    });

    console.log(`SMS sent successfully to ${phoneNumber}. SID: ${messageResult.sid}`);
    
    return {
      success: true,
      sid: messageResult.sid,
    };
  } catch (error: unknown) {
    console.error('Failed to send SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function sendVerificationSMS(to: string, code: string): Promise<SMSResult> {
  const message = `Your calendar notification verification code is: ${code}. This code expires in 10 minutes.`;
  return sendSMS(to, message);
}

export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 1 and has 11 digits, assume it's US/Canada
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it has 10 digits, assume it's US/Canada without country code
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it doesn't start with +, add it
  if (!phoneNumber.startsWith('+')) {
    return `+${digits}`;
  }
  
  return phoneNumber;
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Basic validation - at least 10 digits
  const digits = phoneNumber.replace(/\D/g, '');
  return digits.length >= 10;
}
