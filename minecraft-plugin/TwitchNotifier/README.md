# TwitchNotifier Minecraft Plugin

A Minecraft plugin that integrates with Twitch to display live stream notifications and tab prefixes for streaming players.

## Features

- **Live Tab Prefix**: Shows a 🔴 prefix in the player tab list when they're streaming
- **Live Notifications**: Broadcasts a message to all players when someone goes live while on the server
- **Channel Command**: `/channel <username>` displays a clickable link to a player's Twitch channel
- **Secure Authorization**: Uses your Vercel app for secure Twitch OAuth integration

## Setup

### 1. Database Migration

First, run the database migration to create the necessary tables:

```sql
-- Run this in your PostgreSQL database
-- File: migrations/002_minecraft_auth.sql

CREATE TABLE IF NOT EXISTS minecraft_auth_pending (
    auth_code VARCHAR(64) PRIMARY KEY,
    minecraft_username VARCHAR(16) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS minecraft_auth_completed (
    auth_code VARCHAR(64) PRIMARY KEY,
    minecraft_username VARCHAR(16) NOT NULL,
    twitch_username VARCHAR(25) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS minecraft_twitch_links (
    minecraft_username VARCHAR(16) PRIMARY KEY,
    twitch_username VARCHAR(25) NOT NULL,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_minecraft_auth_pending_expires ON minecraft_auth_pending(expires_at);
CREATE INDEX IF NOT EXISTS idx_minecraft_auth_completed_twitch ON minecraft_auth_completed(twitch_username);
CREATE INDEX IF NOT EXISTS idx_minecraft_twitch_links_twitch ON minecraft_twitch_links(twitch_username);
```

### 2. Vercel App Configuration

Update your Vercel app's `config.yml` or environment variables to include your actual Vercel app URL:

```yaml
# In TwitchNotifier/src/main/resources/config.yml
vercel-app-url: "https://your-vercel-app.vercel.app"
```

### 3. Build the Plugin

```bash
cd TwitchNotifier
mvn clean package
```

This will create `target/TwitchNotifier-1.0.0.jar`

### 4. Install Dependencies

Make sure your server has:
- **LuckPerms** plugin installed
- **Paper/Spigot** server (1.20+)

### 5. Deploy

1. Copy the JAR file to your server's `plugins/` folder
2. Restart your server
3. The plugin will create its configuration files automatically

## API Endpoints

The Vercel app provides these endpoints for the plugin:

### Authentication Flow
- `POST /api/minecraft/auth/start` - Start authorization process
- `GET /api/minecraft/auth/status?code={authCode}` - Check authorization status
- `POST /api/minecraft/auth/complete` - Complete authorization (used by web interface)

### Stream Status
- `GET /api/twitch/stream-status?username={twitchUsername}` - Check if user is streaming

### Maintenance
- `GET /api/minecraft/auth/cleanup` - Get cleanup statistics
- `POST /api/minecraft/auth/cleanup` - Clean up expired records

## Commands

### For Players

- `/twitchauth` - Link your Twitch account to your Minecraft account
- `/twitchunlink` - Unlink your Twitch account
- `/channel <username>` - View a player's Twitch channel

### For Admins

All admin functions are handled through the configuration file and logs.

## How It Works

### Authorization Flow

1. Player runs `/twitchauth` in Minecraft
2. Plugin calls your Vercel app to start OAuth flow
3. Player receives a clickable link to authorize their Twitch account
4. Player clicks link and completes Twitch OAuth on your website  
5. Plugin polls your Vercel app until authorization is complete
6. Account is linked and stored in the database

### Stream Monitoring

1. Plugin checks stream status every 2 minutes (configurable)
2. When a player goes live while online, broadcasts notification to all players
3. Updates tab list with live prefix (🔴) for streaming players
4. Removes prefix when stream ends

## Configuration

### Plugin Configuration (`config.yml`)

```yaml
# Your Vercel app URL
vercel-app-url: "https://your-vercel-app.vercel.app"

# Stream check interval in ticks (20 ticks = 1 second)
# Default: 2400 ticks = 2 minutes  
stream-check-interval: 2400

# Plugin settings
plugin:
  debug: false
  auto-save: true
```

### Permissions

- `twitchnotifier.channel` - Use `/channel` command (default: true)
- `twitchnotifier.auth` - Use authentication commands (default: true)
- `twitchnotifier.admin` - Administrative permissions (default: op)

## Database Maintenance

### Automatic Cleanup

Set up a periodic cleanup job to remove expired records:

```bash
# Example cron job (every hour)
0 * * * * curl -X POST -H "Authorization: Bearer YOUR_CLEANUP_TOKEN" https://your-vercel-app.vercel.app/api/minecraft/auth/cleanup
```

### Manual Cleanup

```sql
-- Remove expired pending authorizations
DELETE FROM minecraft_auth_pending WHERE expires_at < NOW() - INTERVAL '1 hour';

-- Remove old completed authorizations  
DELETE FROM minecraft_auth_completed WHERE completed_at < NOW() - INTERVAL '24 hours';
```

## Troubleshooting

### Common Issues

1. **"LuckPerms not found" error**
   - Ensure LuckPerms is installed and loaded before TwitchNotifier
   - Check plugin load order in your server

2. **Authorization timeouts**
   - Check your Vercel app URL is correct in config.yml
   - Ensure your Vercel app is deployed and accessible
   - Check server logs for API connection errors

3. **Stream status not updating**
   - Verify Twitch API credentials in your Vercel app
   - Check the stream-check-interval setting
   - Look for API rate limiting in logs

### Debug Mode

Enable debug logging in `config.yml`:

```yaml
plugin:
  debug: true
```

### Logs

Check these log locations:
- Server console for plugin startup messages
- `logs/latest.log` for detailed error information
- Vercel function logs for API-related issues

## Development

### Building from Source

```bash
git clone <repository>
cd minecraft-plugin/TwitchNotifier
mvn clean package
```

### Testing

The plugin includes comprehensive error handling and logging. Test the authorization flow on a development server before deploying to production.

## Security Notes

- Authorization codes expire after 5 minutes
- Completed authorizations are cleaned up after 24 hours
- All API calls use HTTPS
- Player data is stored securely in your PostgreSQL database
- No sensitive Twitch tokens are stored in the Minecraft plugin

## Support

For issues or questions:
1. Check the server logs for error messages
2. Verify your Vercel app is properly configured
3. Test the API endpoints manually
4. Check database connectivity and table structure
