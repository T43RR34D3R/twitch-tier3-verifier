# Stream Analytics Setup Guide

Your Twitch Tier 3 Verifier app now includes a comprehensive analytics dashboard! This guide will help you set up and use the new analytics features.

## What's New

✅ **Historical Stream Analytics** - View stream duration trends, peak viewers, and performance over time
✅ **Subscription Analytics** - Track subscriber growth, tier breakdowns, and subscription activity
✅ **Engagement Metrics** - Monitor chat activity, bits received, and viewer engagement
✅ **Growth Analytics** - See follower and subscriber growth with percentage changes
✅ **Interactive Charts** - Beautiful charts powered by Chart.js with multiple time periods

## Setup Steps

### 1. Database Setup

1. Open your Supabase dashboard
2. Go to "SQL Editor" 
3. Create a new query
4. Copy and paste the entire content from `analytics-setup.sql`
5. Click "Run" to create the analytics tables

This creates:
- `stream_analytics` - Daily stream performance data
- `subscription_history` - Individual subscription events
- `stream_sessions` - Individual stream session data
- `chat_analytics` - Daily chat statistics
- Sample data for testing

### 2. Access the Analytics

1. Start your app: `npm run dev`
2. Sign in as an admin user
3. Go to `/admin` dashboard
4. Click "View Analytics Dashboard"
5. Or navigate directly to `/analytics`

### 3. Features Available

#### Summary Dashboard
- **Total Followers** with growth percentage
- **Total Subscribers** with growth tracking
- **Average Viewers** over selected period
- **Stream Time** and stream count

#### Interactive Charts
- **Viewer Analytics** - Average and peak viewers over time
- **Growth Analytics** - Follower and subscriber growth trends
- **Subscription Tiers** - Pie chart showing tier 1, 2, and 3 distribution
- **Bits Analytics** - Bar chart of bits received per stream
- **Chat Analytics** - Messages and unique chatters over time

#### Subscription Stats
- New subscriptions, re-subscriptions, and gifts
- Breakdown by tier (1, 2, 3)
- Total subscription activity

#### Time Period Selection
- Last 7 days
- Last 30 days
- Last 90 days

## Sample Data

The setup includes 30 days of sample data for testing. You can:
- View realistic charts immediately
- Test all features with sample data
- See how the analytics will look with real data

## Data Collection (Future Enhancement)

Currently, the system uses sample data. To collect real data, you would need to:

1. **Twitch API Integration** - Use Twitch's API to fetch:
   - Stream information
   - Subscriber counts
   - Follower counts
   - Chat data (requires additional permissions)

2. **EventSub Webhooks** - Set up Twitch EventSub for real-time events:
   - New follows
   - Subscriptions
   - Bits donations
   - Chat messages

3. **Scheduled Jobs** - Create background jobs to:
   - Fetch daily analytics
   - Update subscriber counts
   - Archive stream sessions

## Security

- Analytics are only accessible to authenticated users
- All data is stored securely in your Supabase database
- No sensitive information is exposed in the frontend
- Same authentication system as your existing admin panel

## Features NOT Included (Real-time)

As requested, this system does NOT include:
- Real-time viewer counts
- Live chat monitoring
- Real-time notifications
- Stream status indicators

All data is historical and updated periodically.

## Customization

The analytics dashboard is fully customizable:

- **Colors** - Modify chart colors in `analytics/page.tsx`
- **Metrics** - Add new metrics by updating the database and API
- **Time Periods** - Add custom date ranges
- **Export** - Add CSV/PDF export functionality
- **Filters** - Add game/category filters

## Database Schema

### stream_analytics
- Daily aggregated data per broadcaster
- Viewer counts, stream time, bits, etc.
- Follower/subscriber counts at end of day

### subscription_history  
- Individual subscription events
- Tracks tier, gift status, months subscribed
- Useful for detailed subscription analytics

### stream_sessions
- Individual stream session data
- Start/end times, peak viewers, game played
- More granular than daily analytics

### chat_analytics
- Daily chat statistics
- Message counts, unique chatters
- Can be extended with emote data

## Troubleshooting

**No data showing**: Make sure you ran the `analytics-setup.sql` script completely

**Charts not loading**: Check browser console for JavaScript errors

**API errors**: Verify your Supabase connection is working

**Authentication issues**: Ensure you're signed in with an admin account

## Next Steps

Your analytics dashboard is now ready! You can:

1. **View the demo data** to understand the features
2. **Customize the styling** to match your brand
3. **Add more metrics** as needed
4. **Set up real data collection** when ready

The system is designed to be completely independent of your existing Tier 3 verification functionality, so your users won't be affected.

Enjoy your new analytics dashboard! 🎉📊
