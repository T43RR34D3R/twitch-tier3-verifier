# 🎮 Subathon Timer Setup Guide

Your subathon timer system now has **automatic event integration**! When viewers subscribe, follow, cheer bits, or raid your channel, the timer will automatically add time based on your custom settings.

## 🚀 Quick Start

1. **Visit the Settings Dashboard**: `/subathon-settings`
2. **Configure time amounts** for each event type
3. **Setup Twitch EventSub webhooks** (one-click setup)
4. **Start your timer** and watch it grow automatically!

## 📋 Features

### ⚙️ Configurable Time Additions
- **New Subscriptions**: Set different times for Tier 1, 2, and 3 subs
- **Gift Subscriptions**: Configure time per gift sub
- **Resubscriptions**: Set time for returning subscribers
- **Follows**: Add time for new followers
- **Bits/Cheers**: Dynamic time based on bit amount
- **Raids**: Time based on number of raiders
- **Hosts**: Fixed time for hosts

### 🎯 Smart Features
- **Test buttons** - Try out settings before going live
- **Quick presets** - Standard, Generous, and Conservative templates
- **Real-time updates** - Changes sync across all displays
- **Master toggle** - Enable/disable automatic additions
- **Min/Max limits** - Prevent excessive time from large donations

## 🔧 Setup Steps

### 1. Configure Your Settings

Visit `/subathon-settings` and adjust the time values:

**Default Settings:**
- Tier 1 Sub: 5 minutes
- Tier 2 Sub: 10 minutes  
- Tier 3 Sub: 20 minutes
- Gift Subs: Same as regular subs
- Resubs: 60% of sub time
- Follows: 30 seconds
- Bits: 0.1 seconds per bit (100 bits = 10 seconds)
- Raids: 1 second per raider

### 2. Setup Twitch EventSub Webhooks

In the settings dashboard:
1. Click "🚀 Setup EventSub"
2. This creates webhooks for:
   - `channel.subscribe` - New subscriptions
   - `channel.subscription.gift` - Gift subscriptions
   - `channel.subscription.message` - Resubscriptions
   - `channel.follow` - New follows
   - `channel.cheer` - Bit cheers
   - `channel.raid` - Incoming raids

### 3. Environment Variables

Add to your `.env.local`:
```env
TWITCH_WEBHOOK_SECRET=your-secure-webhook-secret
```

### 4. Start Your Timer

Use any of the timer interfaces:
- **Control Panel**: `/subathon-timer` - Full controls
- **OBS Display**: `/subathon-display` - Clean overlay
- **Minimal**: `/timer-minimal` - Just the timer

## 🎨 Timer Displays

### Full Control Panel (`/subathon-timer`)
- Complete timer management
- Manual controls (start, pause, add/remove time)
- Status messages
- Perfect for streamer dashboard

### OBS Display (`/subathon-display`) 
- Clean timer display
- Shows timer with title
- Transparent background
- Perfect for streaming overlays

### Minimal Display (`/timer-minimal`)
- Ultra-clean timer only
- Transparent background
- Large, readable font
- Perfect for simple overlays

## 🔗 API Endpoints

### Timer Control
- `GET /api/subathon-timer` - Get current timer state
- `POST /api/subathon-timer` - Control timer
  - Actions: `setTime`, `start`, `pause`, `addTime`, `removeTime`, `addCustomTime`

### Settings Management
- `GET /api/subathon-settings` - Get current settings
- `POST /api/subathon-settings` - Update settings

### EventSub Management
- `GET /api/twitch/eventsub-manage` - View webhook status
- `POST /api/twitch/eventsub-manage` - Setup/cleanup webhooks

### Webhook Endpoint
- `POST /api/twitch/eventsub` - Receives Twitch events

## 🧪 Testing

Use the test buttons in the settings dashboard to:
- Verify time additions work correctly
- Test different event scenarios
- Make sure the timer updates properly

## 🔒 Security

- EventSub webhooks are verified with HMAC signatures
- Database operations use parameterized queries
- Settings are validated before saving
- Admin-only access to configuration

## 🎯 Event Types Supported

| Event Type | Time Calculation | Example |
|------------|------------------|---------|
| **New Sub** | Fixed per tier | Tier 1 = 5min, Tier 3 = 20min |
| **Gift Sub** | Fixed per gift | 5 gifts = 25min (if 5min each) |
| **Resub** | Fixed per tier | Usually less than new sub |
| **Follow** | Fixed amount | 30 seconds |
| **Bits** | Per-bit calculation | 100 bits = 10s (at 0.1s/bit) |
| **Raid** | Per-raider calculation | 50 raiders = 50s (at 1s/raider) |
| **Host** | Fixed amount | 2 minutes |

## 🎊 Going Live

1. **Test everything** using the test buttons
2. **Set your initial timer** (e.g., 2 hours)
3. **Enable automatic additions** in settings
4. **Start the timer** and begin streaming!
5. **Watch the magic happen** as your community extends the stream!

## 🛠 Troubleshooting

**Timer not updating automatically?**
- Check EventSub webhook status in settings
- Verify `TWITCH_WEBHOOK_SECRET` is set
- Make sure "Enable Automatic Timer Additions" is on

**EventSub setup failed?**
- Ensure you're logged in with the correct Twitch account
- Check your Twitch app has the required scopes
- Verify your domain is accessible by Twitch

**Want to reset everything?**
- Use "🧹 Cleanup EventSub" to remove all webhooks
- Use preset buttons to quickly configure common setups
- Use "🔄 Reset Changes" to revert unsaved settings

---

Your subathon timer is now ready to automatically grow based on your community's support! 🎉
