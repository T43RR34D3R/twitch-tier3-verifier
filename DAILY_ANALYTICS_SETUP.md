# Daily Analytics Collection Setup

This system automatically collects Twitch analytics data daily for users who have analytics access enabled, **without requiring the web app to be open**.

## How It Works

1. **User signs in** → Tokens are automatically stored securely in database
2. **Daily collection runs** → Uses stored tokens to fetch Twitch API data
3. **Token refresh** → Automatically refreshes expired tokens using refresh tokens
4. **Historical data** → Charts show real historical trends over time

## Setup Steps

### 1. Update Database Schema

Run the updated `analytics-setup.sql` in your Supabase SQL Editor. This adds the `user_tokens` table.

### 2. Test the System

1. **Sign in as Buckfoozle** to store his tokens
2. **Test manual collection**:
   ```bash
   POST http://localhost:3000/api/collect-analytics
   ```
3. **Check the data**:
   - Go to `/analytics` 
   - Should see historical data in charts

### 3. Set Up Daily Automation

You have several options for daily automation:

#### Option A: Vercel Cron Jobs (Recommended)
Add to your `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/collect-analytics",
      "schedule": "0 12 * * *"
    }
  ]
}
```

#### Option B: GitHub Actions
Create `.github/workflows/daily-analytics.yml`:
```yaml
name: Daily Analytics Collection
on:
  schedule:
    - cron: '0 12 * * *'  # Run daily at 12 PM UTC
jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Analytics Collection
        run: |
          curl -X POST https://your-app.vercel.app/api/collect-analytics
```

#### Option C: External Cron Service
Use services like:
- Cron-job.org
- EasyCron
- UptimeRobot

Set them to POST to: `https://your-app.vercel.app/api/collect-analytics`

## What Gets Collected Daily

✅ **Follower Count** - Total followers from Twitch API  
✅ **Subscriber Count** - Total current subscribers  
✅ **Tier Breakdown** - Tier 1, 2, 3 subscriber counts  
✅ **Current Viewers** - If live when collection runs  
📅 **Historical Trends** - Build up over time for growth charts  

## Data Storage

- **User Tokens**: Stored securely with refresh capability
- **Daily Analytics**: One record per day per user in `stream_analytics` table
- **Automatic Updates**: If data already exists for today, it gets updated

## Token Security

- ✅ Access tokens automatically refresh when expired
- ✅ Tokens stored encrypted in Supabase database
- ✅ No user interaction required after initial sign-in
- ✅ Follows OAuth2 best practices

## Benefits

1. **No Manual Work** - Completely automated
2. **Historical Data** - Real growth trends over time
3. **Always Fresh** - Data updates daily automatically
4. **Offline Collection** - Works even when users aren't online

## Testing

To manually trigger collection for testing:
```bash
curl -X POST http://localhost:3000/api/collect-analytics
```

Check the console logs to see what data was collected.

## Troubleshooting

**No data collected:**
- Check that user has analytics access enabled
- Verify user has signed in recently (to store tokens)
- Check API logs for token refresh errors

**API errors:**
- Tokens might be revoked - user needs to sign in again
- Check Twitch API rate limits
- Verify OAuth scopes are correct

## Next Steps

1. **Run the updated SQL schema**
2. **Have Buckfoozle sign in** to store his tokens
3. **Test manual collection** with the API endpoint
4. **Set up daily automation** with your preferred method
5. **Watch historical data build up** over the coming days!

The system is designed to be completely hands-off once set up. Historical analytics will improve over time as more data is collected.
