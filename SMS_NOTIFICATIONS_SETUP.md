# SMS Notifications Setup Guide

This guide will help you set up SMS notifications for your calendar events using Twilio.

## 🎯 What This Does

- **SMS notifications** sent automatically when calendar events start
- **All-day events**: Notify at 9:00 AM on the event date  
- **Timed events**: Notify exactly when the event begins
- **User control**: Users can enable/disable SMS and verify their phone numbers
- **Admin control**: Admins can enable SMS notifications per event
- **International support**: Works with phone numbers worldwide

## 📋 Prerequisites

1. **Twilio Account**: Sign up at [twilio.com](https://twilio.com)
2. **Database Access**: Your existing PostgreSQL database
3. **Next.js App**: Your current calendar application

## 🚀 Step 1: Set Up Twilio

### 1.1 Create Twilio Account
1. Go to [console.twilio.com](https://console.twilio.com/) and sign up
2. Complete phone verification
3. Note your **Account SID** and **Auth Token** from the dashboard

### 1.2 Get a Phone Number
1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select a number that supports SMS
3. Purchase the number (usually ~$1/month)
4. Note the phone number in E.164 format (e.g., `+15551234567`)

### 1.3 Set Environment Variables
Add these to your `.env.local` file:

```bash
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

## 🗄️ Step 2: Database Setup

Run the SQL setup script:

```bash
# Connect to your PostgreSQL database and run:
psql -d your_database_name -f sms-notifications-setup.sql
```

Or manually execute the SQL from `sms-notifications-setup.sql`.

This creates:
- **SMS fields** in your existing `calendar_events` table
- **`user_sms_preferences`** table for user phone numbers and settings  
- **`sms_notifications_log`** table for tracking sent notifications
- **Indexes** for performance

## ⚙️ Step 3: Set Up Automated Notifications

### Option A: Vercel Cron Jobs (Recommended)

1. Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/send-event-notifications",
      "schedule": "* * * * *"
    }
  ]
}
```

2. Deploy to Vercel - cron jobs run automatically

### Option B: External Cron Service

Use a service like [cron-job.org](https://cron-job.org) to call your endpoint every minute:

- **URL**: `https://yourdomain.com/api/send-event-notifications`
- **Schedule**: `* * * * *` (every minute)
- **Method**: POST

### Option C: Local Development

For testing locally, you can manually trigger notifications:

```bash
curl -X POST http://localhost:3000/api/send-event-notifications
```

Or visit: `http://localhost:3000/api/send-event-notifications` in your browser

## 🧪 Step 4: Test the System

### 4.1 Test SMS Sending
```bash
# Manual test endpoint
curl -X GET http://localhost:3000/api/send-event-notifications
```

### 4.2 Create Test Event
1. Go to your calendar as an admin
2. Create a new event for today
3. Set the time to a few minutes from now
4. ✅ Enable "Send SMS notifications when this event starts"
5. Save the event

### 4.3 Set Up Your Phone Number
1. Click **📱 SMS Settings** in the calendar
2. Enter your phone number
3. Click **Send Verification Code**
4. Enter the 6-digit code you receive
5. ✅ Enable SMS notifications

### 4.4 Wait for Notification
The system checks every minute for events that should send notifications. You should receive an SMS when your test event's time arrives!

## 📱 How It Works

### For Users:
1. **SMS Settings**: Click "📱 SMS Settings" in calendar to set up phone number
2. **Verification**: Must verify phone number via SMS code  
3. **Control**: Can enable/disable SMS notifications anytime

### For Admins:
1. **Event Control**: Toggle "📱 Send SMS notifications" when creating/editing events
2. **Automatic**: Events with SMS enabled will automatically send notifications
3. **Timing**: 
   - All-day events → 9:00 AM on event date
   - Timed events → Exactly at start time

### System Process:
1. **Cron Job**: Runs every minute checking for events to notify
2. **Query**: Finds events starting now with SMS enabled and not yet sent
3. **Send**: Sends SMS to all users with verified phone numbers
4. **Log**: Records all notification attempts (success/failure)
5. **Mark**: Marks events as "SMS sent" to avoid duplicates

## 💰 Costs

- **Phone Number**: ~$1/month
- **SMS Messages**: ~$0.0075 per message in US (varies by country)
- **Example**: 100 notifications/month = ~$1.75 total

## 🔧 Customization

### Message Format
Edit the `createNotificationMessage()` function in `/api/send-event-notifications/route.ts`:

```typescript
function createNotificationMessage(event: any): string {
  // Customize your SMS message format here
  return `🗓️ Event: ${event.title}\n📅 ${eventDate}\n📝 ${event.description}`;
}
```

### Notification Timing
Currently notifications send:
- **All-day events**: 9:00 AM
- **Timed events**: At start time

To add advance notifications (15 min before, etc.), modify the SQL query in the notification API.

### Supported Countries
Twilio supports SMS in 180+ countries. Phone number formatting automatically handles:
- US/Canada: 10 digits → `+1xxxxxxxxxx`
- International: Keeps country code as entered

## 🛠️ Troubleshooting

### SMS Not Sending?
1. **Check Environment Variables**: Verify Twilio credentials are correct
2. **Check Phone Number**: Must be in E.164 format (`+1234567890`)
3. **Check Twilio Balance**: Ensure account has sufficient funds
4. **Check Logs**: View browser console/server logs for errors

### Cron Jobs Not Running?
1. **Vercel**: Check Functions tab in Vercel dashboard
2. **External**: Verify cron service is calling your endpoint
3. **Manual Test**: Visit `/api/send-event-notifications` directly

### Phone Verification Issues?
1. **Check Phone Format**: Must include country code
2. **Check Carrier**: Some carriers block automated SMS
3. **Try Different Number**: Test with a different phone number

### Database Issues?
1. **Check Migrations**: Ensure SQL setup script ran successfully
2. **Check Permissions**: Verify database user has CREATE/ALTER permissions
3. **Check Indexes**: Run `\d calendar_events` to verify new columns exist

## 🔒 Security

- **Phone Numbers**: Stored securely in database, never exposed to frontend
- **Verification Codes**: Expire after 10 minutes
- **API Protection**: All SMS endpoints require authentication
- **Admin Only**: Only admins can enable SMS for events

## 📊 Monitoring

Check the `sms_notifications_log` table to monitor:
- Successful notifications sent
- Failed notification attempts  
- Error messages for debugging

```sql
-- View recent notification activity
SELECT 
  snl.*,
  ce.title as event_title 
FROM sms_notifications_log snl
JOIN calendar_events ce ON snl.event_id = ce.id
ORDER BY snl.sent_at DESC 
LIMIT 20;
```

## 🎉 You're Done!

Your SMS notification system is now fully set up! Users can manage their SMS preferences, admins can enable notifications per event, and the system will automatically send SMS messages when events start.

**Next Steps:**
- Test with real events
- Monitor notification logs
- Customize message format if needed
- Consider adding more notification timing options

## 💡 Pro Tips

1. **Test Thoroughly**: Create test events at different times to verify timing
2. **Monitor Costs**: Check Twilio usage monthly to track SMS costs
3. **User Onboarding**: Tell users about the SMS Settings button
4. **Admin Training**: Show admins the SMS toggle in event editor
5. **International Users**: Test with international phone numbers if needed

Happy scheduling! 📅📱✨
