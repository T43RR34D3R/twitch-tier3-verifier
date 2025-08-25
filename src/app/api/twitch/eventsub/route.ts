import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { queryRow } from '@/lib/railway-db';

// Get subathon settings from database
async function getSubathonSettings() {
  try {
    const settings = await queryRow(
      'SELECT * FROM subathon_settings ORDER BY id LIMIT 1'
    );
    return settings;
  } catch (error) {
    console.error('Error fetching subathon settings:', error);
    return null;
  }
}

// Add time to timer using custom time addition
async function addTimeToTimer(seconds: number, message: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/subathon-timer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'addCustomTime', 
        time: seconds,
        customMessage: message 
      }),
    });
    
    if (!response.ok) {
      console.error('Failed to add time to timer:', response.status);
    } else {
      console.log(`✅ Added ${seconds} seconds to timer: ${message}`);
    }
  } catch (error) {
    console.error('Error adding time to timer:', error);
  }
}

// Verify Twitch signature
function verifyTwitchSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('twitch-eventsub-message-signature');
    const messageId = request.headers.get('twitch-eventsub-message-id');
    const messageType = request.headers.get('twitch-eventsub-message-type');

    // Verify webhook secret if configured (skip for simulated events)
    const isSimulated = messageId?.startsWith('sim-');
    const webhookSecret = process.env.TWITCH_WEBHOOK_SECRET;
    
    if (webhookSecret && signature && !isSimulated) {
      if (!verifyTwitchSignature(body, signature, webhookSecret)) {
        console.error('Invalid Twitch signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    const event = JSON.parse(body);

    // Handle webhook verification challenge
    if (messageType === 'webhook_callback_verification') {
      console.log('Twitch EventSub verification challenge received');
      return new NextResponse(event.challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Handle subscription events
    if (messageType === 'notification') {
      const { subscription, event: eventData } = event;
      
      console.log('Received Twitch event:', {
        type: subscription.type,
        event: eventData
      });

      // Get current settings from database
      const settings = await getSubathonSettings();
      if (!settings || !settings.enabled) {
        console.log('Subathon timer additions disabled or settings not found');
        return NextResponse.json({ success: true, message: 'Timer additions disabled' });
      }

      switch (subscription.type) {
        case 'channel.subscribe':
          // New subscription
          const tier = eventData.tier || '1000';
          let timeToAdd = 0;
          let message = '';

          switch (tier) {
            case '1000': // Tier 1
              timeToAdd = settings.tier1_sub_time;
              message = `🎉 ${eventData.user_name} subscribed! +${Math.floor(timeToAdd / 60)}:${(timeToAdd % 60).toString().padStart(2, '0')}!`;
              break;
            case '2000': // Tier 2
              timeToAdd = settings.tier2_sub_time;
              message = `🎉 ${eventData.user_name} subscribed (Tier 2)! +${Math.floor(timeToAdd / 60)}:${(timeToAdd % 60).toString().padStart(2, '0')}!`;
              break;
            case '3000': // Tier 3
              timeToAdd = settings.tier3_sub_time;
              message = `🎉 ${eventData.user_name} subscribed (Tier 3)! +${Math.floor(timeToAdd / 60)}:${(timeToAdd % 60).toString().padStart(2, '0')}!`;
              break;
          }

          if (timeToAdd > 0) {
            await addTimeToTimer(timeToAdd, message);
          }
          break;

        case 'channel.subscription.gift':
          // Gift subscription
          const giftTier = eventData.tier || '1000';
          const giftCount = eventData.total || 1;
          let giftTimePerSub = 0;
          
          switch (giftTier) {
            case '1000': giftTimePerSub = settings.tier1_gift_time; break;
            case '2000': giftTimePerSub = settings.tier2_gift_time; break;
            case '3000': giftTimePerSub = settings.tier3_gift_time; break;
          }

          const totalGiftTime = giftTimePerSub * giftCount;
          if (totalGiftTime > 0) {
            const giftMessage = `🎁 ${eventData.user_name || 'Anonymous'} gifted ${giftCount} sub${giftCount > 1 ? 's' : ''}! +${Math.floor(totalGiftTime / 60)} minutes!`;
            await addTimeToTimer(totalGiftTime, giftMessage);
          }
          break;

        case 'channel.subscription.message':
          // Resubscription with message
          const resubTier = eventData.tier || '1000';
          let resubTime = 0;

          switch (resubTier) {
            case '1000': resubTime = settings.tier1_resub_time; break;
            case '2000': resubTime = settings.tier2_resub_time; break;
            case '3000': resubTime = settings.tier3_resub_time; break;
          }

          if (resubTime > 0) {
            const months = eventData.cumulative_months || 1;
            const resubMessage = `🔄 ${eventData.user_name} resubscribed (${months} months)! +${Math.floor(resubTime / 60)}:${(resubTime % 60).toString().padStart(2, '0')}!`;
            await addTimeToTimer(resubTime, resubMessage);
          }
          break;

        case 'channel.follow':
          // New follow
          if (settings.follow_time > 0) {
            const followMessage = `👋 ${eventData.user_name} followed! +${settings.follow_time}s!`;
            await addTimeToTimer(settings.follow_time, followMessage);
          }
          break;

        case 'channel.cheer':
          // Bits/Cheers
          const bits = eventData.bits || 0;
          if (bits > 0 && settings.bits_per_second > 0) {
            let bitsTime = Math.floor(bits * settings.bits_per_second);
            bitsTime = Math.max(settings.min_bits_time, Math.min(settings.max_bits_time, bitsTime));
            
            if (bitsTime > 0) {
              const bitsMessage = `💎 ${eventData.user_name} cheered ${bits} bits! +${Math.floor(bitsTime / 60)}:${(bitsTime % 60).toString().padStart(2, '0')}!`;
              await addTimeToTimer(bitsTime, bitsMessage);
            }
          }
          break;

        case 'channel.raid':
          // Raid
          const viewers = eventData.viewers || 0;
          if (viewers > 0 && settings.raid_time_per_viewer > 0) {
            let raidTime = Math.floor(viewers * settings.raid_time_per_viewer);
            raidTime = Math.max(settings.min_raid_time, Math.min(settings.max_raid_time, raidTime));
            
            if (raidTime > 0) {
              const raidMessage = `🚀 ${eventData.from_broadcaster_user_name} raided with ${viewers} viewers! +${Math.floor(raidTime / 60)}:${(raidTime % 60).toString().padStart(2, '0')}!`;
              await addTimeToTimer(raidTime, raidMessage);
            }
          }
          break;

        default:
          console.log('Unhandled event type:', subscription.type);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('EventSub webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Twitch EventSub webhook endpoint',
    status: 'active'
  });
}
