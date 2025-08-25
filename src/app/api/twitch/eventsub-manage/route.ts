import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

interface EventSubSubscription {
  id: string;
  status: string;
  type: string;
  version: string;
  condition: Record<string, unknown>;
  transport: {
    method: string;
    callback: string;
  };
  created_at: string;
}

// Get current EventSub subscriptions
async function getEventSubSubscriptions(accessToken: string): Promise<EventSubSubscription[]> {
  try {
    const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch EventSub subscriptions:', response.status);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching EventSub subscriptions:', error);
    return [];
  }
}

// Create EventSub subscription
async function createEventSubSubscription(
  accessToken: string,
  type: string,
  version: string,
  condition: Record<string, unknown>,
  callbackUrl: string,
  secret: string
): Promise<{ success: boolean; subscription?: EventSubSubscription; error?: string }> {
  try {
    const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        version,
        condition,
        transport: {
          method: 'webhook',
          callback: callbackUrl,
          secret
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to create EventSub subscription:', data);
      return { success: false, error: data.message || 'Unknown error' };
    }

    return { success: true, subscription: data.data[0] };
  } catch (error) {
    console.error('Error creating EventSub subscription:', error);
    return { success: false, error: 'Network error' };
  }
}

// Delete EventSub subscription
async function deleteEventSubSubscription(accessToken: string, subscriptionId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting EventSub subscription:', error);
    return false;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const subscriptions = await getEventSubSubscriptions(session.accessToken);
    
    return NextResponse.json({
      success: true,
      subscriptions
    });
  } catch (error) {
    console.error('GET EventSub subscriptions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch EventSub subscriptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { action, subscriptionId } = await request.json();

    if (action === 'setup') {
      // Setup all required EventSub subscriptions for subathon
      const broadcasterUserId = session.user.id;
      const callbackUrl = `${process.env.NEXTAUTH_URL}/api/twitch/eventsub`;
      const secret = process.env.TWITCH_WEBHOOK_SECRET || 'your-webhook-secret';

      const subscriptionTypes = [
        {
          type: 'channel.subscribe',
          version: '1',
          condition: { broadcaster_user_id: broadcasterUserId }
        },
        {
          type: 'channel.subscription.gift',
          version: '1',
          condition: { broadcaster_user_id: broadcasterUserId }
        },
        {
          type: 'channel.subscription.message',
          version: '1',
          condition: { broadcaster_user_id: broadcasterUserId }
        },
        {
          type: 'channel.follow',
          version: '2',
          condition: { 
            broadcaster_user_id: broadcasterUserId,
            moderator_user_id: broadcasterUserId
          }
        },
        {
          type: 'channel.cheer',
          version: '1',
          condition: { broadcaster_user_id: broadcasterUserId }
        },
        {
          type: 'channel.raid',
          version: '1',
          condition: { to_broadcaster_user_id: broadcasterUserId }
        }
      ];

      const results = [];
      
      for (const subType of subscriptionTypes) {
        const result = await createEventSubSubscription(
          session.accessToken,
          subType.type,
          subType.version,
          subType.condition,
          callbackUrl,
          secret
        );
        
        results.push({
          type: subType.type,
          ...result
        });
      }

      return NextResponse.json({
        success: true,
        results
      });

    } else if (action === 'delete' && subscriptionId) {
      // Delete specific subscription
      const success = await deleteEventSubSubscription(session.accessToken, subscriptionId);
      
      return NextResponse.json({
        success,
        message: success ? 'Subscription deleted' : 'Failed to delete subscription'
      });

    } else if (action === 'cleanup') {
      // Delete all existing subscriptions
      const subscriptions = await getEventSubSubscriptions(session.accessToken);
      
      const results = [];
      for (const sub of subscriptions) {
        const success = await deleteEventSubSubscription(session.accessToken, sub.id);
        results.push({
          id: sub.id,
          type: sub.type,
          success
        });
      }
      
      return NextResponse.json({
        success: true,
        results
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('POST EventSub manage error:', error);
    return NextResponse.json(
      { error: 'Failed to manage EventSub subscriptions' },
      { status: 500 }
    );
  }
}
