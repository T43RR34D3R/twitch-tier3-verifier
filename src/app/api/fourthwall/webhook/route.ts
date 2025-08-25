import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Interfaces will be defined once we understand Fourthwall's actual payload structure

// Temporarily commented out until we understand payload structure
// async function getMerchSettings(): Promise<MerchSettings> {
//   try {
//     // Try to get settings from database, but handle missing columns gracefully
//     await queryRow(
//       'SELECT * FROM subathon_settings ORDER BY id LIMIT 1'
//     );

//     // For now, return hardcoded enabled settings since the database columns don't exist yet
//     return {
//       merch_enabled: true,  // Enable merch rewards
//       merch_base_reward_minutes: 5,  // 5 minutes per $10 spent
//       merch_price_threshold: 10,     // $10 minimum threshold
//       merch_bonus_50_minutes: 10,    // 10 minute bonus for $50+
//       merch_bonus_100_minutes: 30    // 30 minute bonus for $100+
//     };
//   } catch (error) {
//     console.error('Error getting merch settings:', error);
//     // Return enabled default values on error
//     return {
//       merch_enabled: true,  // Enable merch rewards by default
//       merch_base_reward_minutes: 5,
//       merch_price_threshold: 10,
//       merch_bonus_50_minutes: 10,
//       merch_bonus_100_minutes: 30
//     };
//   }
// }

function verifyFourthwallSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Fourthwall uses HMAC-SHA256 and sends the signature as base64
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64');

    // Clean the received signature (remove any prefixes)
    let receivedSignature = signature;
    if (signature.startsWith('sha256=')) {
      receivedSignature = signature.slice(7);
    }

    console.log('Expected signature (base64):', expectedSignature);
    console.log('Received signature (base64):', receivedSignature);

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(receivedSignature, 'utf8')
    );
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

// Temporarily commented out until we understand payload structure
// function calculateRewardTime(purchaseAmount: number, settings: MerchSettings): number {
//   let totalMinutes = 0;

//   // Base reward: configurable minutes for every $ threshold
//   const baseReward = Math.floor(purchaseAmount / settings.merch_price_threshold) * settings.merch_base_reward_minutes;
//   totalMinutes += baseReward;

//   // Bonus rewards
//   if (purchaseAmount >= 50) {
//     totalMinutes += settings.merch_bonus_50_minutes;
//   }
//   if (purchaseAmount >= 100) {
//     totalMinutes += settings.merch_bonus_100_minutes;
//   }

//   return totalMinutes * 60; // Convert to seconds
// }

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-fourthwall-hmac-sha256') || 
                     request.headers.get('x-fourthwall-signature') || 
                     request.headers.get('x-signature') ||
                     request.headers.get('signature');

    // Debug logging
    console.log('=== FOURTHWALL WEBHOOK DEBUG ===');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log('Signature found:', signature);
    console.log('Webhook secret configured:', !!process.env.FOURTHWALL_WEBHOOK_SECRET);
    console.log('Raw body length:', rawBody.length);
    console.log('Raw body preview:', rawBody.substring(0, 200));

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.FOURTHWALL_WEBHOOK_SECRET;
    if (webhookSecret && !verifyFourthwallSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid Fourthwall webhook signature');
      console.log('Expected signature would be generated from body:', rawBody.substring(0, 100) + '...');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Parse the webhook payload
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
      console.log('🔍 FULL PAYLOAD STRUCTURE:', JSON.stringify(payload, null, 2));
    } catch (error) {
      console.error('Invalid JSON payload:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('Fourthwall webhook received. Type:', payload.type || payload.event);
    console.log('Payload keys:', Object.keys(payload));
    if (payload.order) console.log('Order found in payload.order');
    if (payload.data && typeof payload.data === 'object' && payload.data !== null) {
      console.log('Data found in payload.data, keys:', Object.keys(payload.data as Record<string, unknown>));
      if ((payload.data as Record<string, unknown>).order) console.log('Order found in payload.data.order');
    }

    // For now, just log and accept all webhook types to see the structure
    console.log('Webhook accepted for debugging - will process once we understand structure');
    
    return NextResponse.json({
      success: true,
      message: 'Webhook received and logged for analysis',
      type: payload.type || payload.event,
      hasOrder: !!payload.order,
      hasDataOrder: !!(payload.data && typeof payload.data === 'object' && (payload.data as Record<string, unknown>).order)
    });

  } catch (error) {
    console.error('Fourthwall webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
