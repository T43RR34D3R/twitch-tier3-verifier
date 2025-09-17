# EventSub Setup for Subathon Timer

## Problem Identified
The subathon timer webhook is working correctly (confirmed by test), but real Twitch subscription events are not being received. This is because EventSub subscriptions are not properly configured for the production environment.

## Required Environment Variables
The following environment variables need to be set in Railway:

1. **NEXTAUTH_URL**: Must be set to `https://buckfoozle.com` (currently set to localhost)
2. **TWITCH_WEBHOOK_SECRET**: A secret string for verifying webhook authenticity (currently missing)

## Steps to Fix

### Step 1: Set Environment Variables in Railway
1. Go to your Railway project dashboard
2. Go to Variables tab
3. Add/Update these variables:
   ```
   NEXTAUTH_URL=https://buckfoozle.com
   TWITCH_WEBHOOK_SECRET=your-secure-random-secret-here
   ```
4. Redeploy the application

### Step 2: Set Up EventSub Subscriptions
Once the environment variables are fixed, you need to:

1. **Log in to your app** as BuckFoozle (admin user)
2. **Navigate to the admin panel** at https://buckfoozle.com/admin
3. **Look for EventSub management** or go directly to the eventsub management endpoint
4. **Run the setup command** to create all necessary subscriptions

### Step 3: Verify EventSub Subscriptions
After setup, verify that the following subscriptions are active:
- `channel.subscribe` - New subscriptions
- `channel.subscription.gift` - Gift subscriptions  
- `channel.subscription.message` - Resubscriptions
- `channel.follow` - New follows
- `channel.cheer` - Bit donations
- `channel.raid` - Raids

All should point to: `https://buckfoozle.com/api/twitch/eventsub`

## Testing
After setup, you can:
1. Test with another simulated event: `node test-subathon-webhook.js`
2. Have someone actually subscribe to test real events
3. Monitor logs for successful EventSub notifications

## Current Status
- ✅ Webhook endpoint is working correctly
- ✅ Subathon settings are configured properly
- ✅ Timer API is functional
- ❌ EventSub subscriptions not configured for production
- ❌ Environment variables need to be fixed

## Next Steps
1. Fix environment variables in Railway
2. Set up EventSub subscriptions through the admin interface
3. Test with a real subscription event
