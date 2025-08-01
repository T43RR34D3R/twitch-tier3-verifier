import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserSubscriptions } from '../../../lib/twitch';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const broadcasterId = searchParams.get('broadcaster_id');

    // If requesting stored data, return from database
    if (type === 'list' && broadcasterId) {
      const { data: subscribers, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('broadcaster_id', broadcasterId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stored subscribers:', error);
        return NextResponse.json({ error: 'Failed to fetch stored subscribers' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        subscribers: subscribers || [] 
      });
    }

    // Otherwise, fetch fresh data from Twitch
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    // Hardcoded for BuckFoozle for now
    const targetChannelId = '269187200';
    const targetChannelName = 'BuckFoozle';

    console.log('Fetching subscriber data for channel:', targetChannelName);
    
    const subscriptions = await getUserSubscriptions(session.accessToken as string, targetChannelId);
    
    console.log(`Found ${subscriptions.length} subscribers`);

    if (subscriptions.length === 0) {
      // Check if this is a permissions issue by trying to get the current user's ID
      const userResponse = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID!,
        },
      });
      
      const userData = await userResponse.json();
      const currentUserId = userData.data?.[0]?.id;
      
      if (currentUserId !== targetChannelId) {
        return NextResponse.json({ 
          success: false, 
          error: 'The channel:read:subscriptions scope only works for your own channel. To access subscriber data for moderated channels, the channel owner (BuckFoozle) would need to authorize this app.',
          details: {
            yourUserId: currentUserId,
            targetChannelId: targetChannelId,
            explanation: 'Moderator permissions do not include access to subscriber data of other channels.'
          }
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'No subscribers found for your channel',
        count: 0 
      });
    }

    // Store subscribers in database
    let insertedCount = 0;

    for (const sub of subscriptions) {
      try {
        const { error } = await supabase
          .from('subscribers')
          .upsert({
            user_id: sub.user_id,
            user_name: sub.user_name,
            broadcaster_id: sub.broadcaster_id,
            broadcaster_name: sub.broadcaster_name,
            tier: sub.tier,
            is_gift: sub.is_gift,
            gifter_id: sub.gifter_id || null,
            gifter_name: sub.gifter_name || null,
            plan_name: sub.plan_name,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,broadcaster_id',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          console.error('Error upserting subscriber:', error);
        } else {
          insertedCount++;
        }
      } catch (err) {
        console.error('Error processing subscriber:', sub.user_name, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${insertedCount} subscribers`,
      totalFetched: subscriptions.length,
      processed: insertedCount
    });

  } catch (error) {
    console.error('Error fetching subscriber data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch subscriber data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Same as GET for now, but could be used for different operations
  return GET(req);
}
