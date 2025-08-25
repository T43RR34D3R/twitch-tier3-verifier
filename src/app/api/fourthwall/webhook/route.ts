import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { queryRow } from '@/lib/railway-db';

interface FourthwallWebhookOrder {
  id: string;
  customer: {
    name: string;
    email?: string;
  };
  items: {
    id: string;
    name: string;
    quantity: number;
    price: {
      amount: number;
      currency: string;
    };
    total: {
      amount: number;
      currency: string;
    };
  }[];
  total: {
    amount: number;
    currency: string;
  };
  status: string;
  created_at: string;
}

interface FourthwallWebhookPayload {
  event: string;
  data: {
    order: FourthwallWebhookOrder;
  };
}

interface MerchSettings {
  merch_enabled: boolean;
  merch_base_reward_minutes: number;
  merch_price_threshold: number;
  merch_bonus_50_minutes: number;
  merch_bonus_100_minutes: number;
}

async function getMerchSettings(): Promise<MerchSettings> {
  try {
    // Try to get settings from database, but handle missing columns gracefully
    await queryRow(
      'SELECT * FROM subathon_settings ORDER BY id LIMIT 1'
    );

    // For now, return hardcoded enabled settings since the database columns don't exist yet
    return {
      merch_enabled: true,  // Enable merch rewards
      merch_base_reward_minutes: 5,  // 5 minutes per $10 spent
      merch_price_threshold: 10,     // $10 minimum threshold
      merch_bonus_50_minutes: 10,    // 10 minute bonus for $50+
      merch_bonus_100_minutes: 30    // 30 minute bonus for $100+
    };
  } catch (error) {
    console.error('Error getting merch settings:', error);
    // Return enabled default values on error
    return {
      merch_enabled: true,  // Enable merch rewards by default
      merch_base_reward_minutes: 5,
      merch_price_threshold: 10,
      merch_bonus_50_minutes: 10,
      merch_bonus_100_minutes: 30
    };
  }
}

function verifyFourthwallSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Fourthwall typically uses HMAC-SHA256 for webhook signatures
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('hex');

    // Signature might come as 'sha256=...' format
    const receivedSignature = signature.startsWith('sha256=') 
      ? signature.slice(7) 
      : signature;

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

function calculateRewardTime(purchaseAmount: number, settings: MerchSettings): number {
  let totalMinutes = 0;

  // Base reward: configurable minutes for every $ threshold
  const baseReward = Math.floor(purchaseAmount / settings.merch_price_threshold) * settings.merch_base_reward_minutes;
  totalMinutes += baseReward;

  // Bonus rewards
  if (purchaseAmount >= 50) {
    totalMinutes += settings.merch_bonus_50_minutes;
  }
  if (purchaseAmount >= 100) {
    totalMinutes += settings.merch_bonus_100_minutes;
  }

  return totalMinutes * 60; // Convert to seconds
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-fourthwall-signature') || 
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
    let payload: FourthwallWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('Invalid JSON payload:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('Fourthwall webhook received:', payload.event, payload.data?.order?.id);

    // Only process order and gift purchase events
    const validEvents = ['order.completed', 'order.paid', 'order.placed', 'gift.purchase'];
    if (!validEvents.includes(payload.event)) {
      console.log('Ignoring event type:', payload.event);
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    const order = payload.data?.order;
    if (!order) {
      console.error('No order data in webhook payload');
      return NextResponse.json({ error: 'No order data' }, { status: 400 });
    }

    // Get merch settings from database
    const merchSettings = await getMerchSettings();
    
    // Check if merch rewards are enabled
    if (!merchSettings.merch_enabled) {
      console.log('Merch rewards are disabled');
      return NextResponse.json({ success: true, message: 'Merch rewards disabled' });
    }

    // Calculate reward time based on purchase amount
    const purchaseAmount = order.total.amount;
    const rewardSeconds = calculateRewardTime(purchaseAmount, merchSettings);

    if (rewardSeconds <= 0) {
      console.log('No reward time for purchase amount:', purchaseAmount);
      return NextResponse.json({ success: true, message: 'No reward time calculated' });
    }

    // Format customer name (fallback to "Someone" if no name)
    const customerName = order.customer?.name || 'Someone';
    
    // Create a summary of purchased items
    const itemsSummary = order.items.length === 1 
      ? order.items[0].name
      : `${order.items.length} items`;

    // Format the reward message
    const rewardMinutes = Math.floor(rewardSeconds / 60);
    const rewardSecondsRemainder = rewardSeconds % 60;
    const timeDisplay = rewardSecondsRemainder > 0 
      ? `${rewardMinutes}:${rewardSecondsRemainder.toString().padStart(2, '0')}`
      : `${rewardMinutes} minutes`;

    const customMessage = `🛒 ${customerName} bought ${itemsSummary} ($${purchaseAmount})! Added ${timeDisplay}!`;

    // Add time to the subathon timer
    const timerResponse = await fetch(`${request.nextUrl.origin}/api/subathon-timer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'addCustomTime',
        time: rewardSeconds,
        customMessage
      }),
    });

    if (!timerResponse.ok) {
      console.error('Failed to add time to timer:', await timerResponse.text());
      return NextResponse.json({ error: 'Failed to add time to timer' }, { status: 500 });
    }

    const timerResult = await timerResponse.json();
    console.log('Successfully added time to timer:', timerResult);

    return NextResponse.json({
      success: true,
      message: `Added ${timeDisplay} for merch purchase`,
      order_id: order.id,
      customer: customerName,
      amount: purchaseAmount,
      time_added_seconds: rewardSeconds
    });

  } catch (error) {
    console.error('Fourthwall webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
