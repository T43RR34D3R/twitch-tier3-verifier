import { NextRequest, NextResponse } from 'next/server';

// Simulate Twitch events by calling our EventSub webhook directly
async function simulateEvent(eventType: string, eventData: Record<string, unknown>) {
  try {
    // Create a mock EventSub notification payload
    const mockEvent = {
      subscription: {
        id: `sim-${Date.now()}`,
        status: 'enabled',
        type: eventType,
        version: '1',
        condition: { broadcaster_user_id: '269187200' }, // BuckFoozle's ID
        transport: {
          method: 'webhook',
          callback: `${process.env.NEXTAUTH_URL}/api/twitch/eventsub`
        },
        created_at: new Date().toISOString()
      },
      event: eventData
    };

    // Call our EventSub webhook handler directly
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/twitch/eventsub`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'twitch-eventsub-message-type': 'notification',
        'twitch-eventsub-message-id': `sim-${Date.now()}`,
        'twitch-eventsub-message-timestamp': new Date().toISOString(),
        // Skip signature verification for simulation
      },
      body: JSON.stringify(mockEvent),
    });

    if (response.ok) {
      console.log(`✅ Simulated ${eventType} event successfully`);
      return { success: true };
    } else {
      console.error(`❌ Failed to simulate ${eventType} event:`, response.status);
      return { success: false, error: 'Webhook call failed' };
    }
  } catch (error) {
    console.error(`Error simulating ${eventType} event:`, error);
    return { success: false, error: 'Network error' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { eventType, ...eventData } = await request.json();
    console.log('Simulating event:', { eventType, eventData });

    let simulationData: Record<string, unknown> = {};

    switch (eventType) {
      case 'subscription':
        simulationData = {
          user_id: '12345678',
          user_login: 'testuser',
          user_name: 'TestUser',
          broadcaster_user_id: '269187200',
          broadcaster_user_login: 'buckfoozle',
          broadcaster_user_name: 'BuckFoozle',
          tier: eventData.tier || '1000',
          is_gift: false,
          ...eventData
        };
        break;

      case 'gift_subscription':
        simulationData = {
          user_id: eventData.user_id || '12345678',
          user_login: eventData.user_login || 'testgifter',
          user_name: eventData.user_name || 'TestGifter',
          broadcaster_user_id: '269187200',
          broadcaster_user_login: 'buckfoozle',
          broadcaster_user_name: 'BuckFoozle',
          tier: eventData.tier || '1000',
          total: eventData.total || 1,
          is_anonymous: eventData.is_anonymous || false,
          ...eventData
        };
        break;

      case 'resubscription':
        simulationData = {
          user_id: '12345678',
          user_login: 'testresub',
          user_name: 'TestResub',
          broadcaster_user_id: '269187200',
          broadcaster_user_login: 'buckfoozle',
          broadcaster_user_name: 'BuckFoozle',
          tier: eventData.tier || '1000',
          message: eventData.message || 'Love the stream!',
          cumulative_months: eventData.cumulative_months || 12,
          streak_months: eventData.streak_months || 6,
          duration_months: eventData.duration_months || 1,
          ...eventData
        };
        break;

      case 'follow':
        simulationData = {
          user_id: '12345678',
          user_login: 'testfollower',
          user_name: 'TestFollower',
          broadcaster_user_id: '269187200',
          broadcaster_user_login: 'buckfoozle',
          broadcaster_user_name: 'BuckFoozle',
          followed_at: new Date().toISOString(),
          ...eventData
        };
        break;

      case 'cheer':
        simulationData = {
          user_id: '12345678',
          user_login: 'testcheerer',
          user_name: 'TestCheerer',
          broadcaster_user_id: '269187200',
          broadcaster_user_login: 'buckfoozle',
          broadcaster_user_name: 'BuckFoozle',
          is_anonymous: false,
          message: eventData.message || `cheer${eventData.bits || 100} Great stream!`,
          bits: eventData.bits || 100,
          ...eventData
        };
        break;

      case 'raid':
        simulationData = {
          from_broadcaster_user_id: '87654321',
          from_broadcaster_user_login: 'testraider',
          from_broadcaster_user_name: 'TestRaider',
          to_broadcaster_user_id: '269187200',
          to_broadcaster_user_login: 'buckfoozle',
          to_broadcaster_user_name: 'BuckFoozle',
          viewers: eventData.viewers || 25,
          ...eventData
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        );
    }

    // Map event types to EventSub subscription types
    const eventTypeMap: Record<string, string> = {
      'subscription': 'channel.subscribe',
      'gift_subscription': 'channel.subscription.gift',
      'resubscription': 'channel.subscription.message',
      'follow': 'channel.follow',
      'cheer': 'channel.cheer',
      'raid': 'channel.raid'
    };

    const subscriptionType = eventTypeMap[eventType];
    if (!subscriptionType) {
      return NextResponse.json(
        { error: 'Unknown event type mapping' },
        { status: 400 }
      );
    }

    const result = await simulateEvent(subscriptionType, simulationData);

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Successfully simulated ${eventType} event` 
        : `Failed to simulate ${eventType} event`,
      error: result.error,
      simulatedData: simulationData
    });

  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { error: 'Failed to simulate event' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Event simulation endpoint',
    supportedEvents: [
      'subscription',
      'gift_subscription', 
      'resubscription',
      'follow',
      'cheer',
      'raid'
    ],
    examples: {
      subscription: {
        eventType: 'subscription',
        tier: '1000', // '1000', '2000', or '3000'
        user_name: 'TestUser'
      },
      gift_subscription: {
        eventType: 'gift_subscription',
        tier: '1000',
        total: 5,
        user_name: 'TestGifter'
      },
      cheer: {
        eventType: 'cheer',
        bits: 500,
        user_name: 'TestCheerer'
      },
      raid: {
        eventType: 'raid',
        viewers: 50
      }
    }
  });
}
