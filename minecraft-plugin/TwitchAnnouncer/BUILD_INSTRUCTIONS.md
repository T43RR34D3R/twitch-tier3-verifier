# TwitchAnnouncer Plugin - Build Instructions

## Overview
TwitchAnnouncer is a Minecraft plugin that provides Twitch stream announcements and tab list prefixes for live streamers.

## Features
- 🔴 Live stream notifications in chat with clickable [WATCH] buttons
- 🎯 Tab list prefixes for live streamers  
- 🎨 Fully customizable messages with placeholders
- 🔗 Twitch OAuth integration
- ⚙️ LuckPerms integration
- 📊 Stream status monitoring

## Manual Build (Recommended)

Since Maven dependencies can be complex, here's how to build manually:

### 1. Prepare Build Directory
The manual-build directory structure is already set up with all source files copied.

### 2. Download Dependencies
You'll need these JAR files:
- **Paper API** (1.20.4+): Download from https://papermc.io/downloads
- **LuckPerms API** (5.4+): Download from https://ci.lucko.me/job/LuckPerms/
- **OkHttp** (4.12.0): Download from Maven Central
- **Gson** (2.10.1): Download from Maven Central

### 3. Compile with javac
```bash
javac -cp "paper-api.jar;luckperms-api.jar;okhttp.jar;gson.jar" -d manual-build manual-build/com/twitchannouncer/*.java manual-build/com/twitchannouncer/*/*.java
```

### 4. Create JAR
```bash
cd manual-build
jar cvf ../TwitchAnnouncer-1.0.0.jar .
```

## Maven Build (Alternative)
If you have Maven installed:
```bash
mvn clean package
```

## Installation

1. **Copy the JAR** to your server's `plugins` folder
2. **Install LuckPerms** plugin (required dependency)
3. **Restart the server** to load the plugin
4. **Configure** in `plugins/TwitchAnnouncer/config.yml`:
   ```yaml
   vercel-app-url: "https://your-vercel-app.vercel.app"
   stream-check-interval: 2400  # 2 minutes in ticks
   ```

## Commands

- **/twitchauth** - Link your Twitch account
- **/twitchunlink** - Unlink your Twitch account  
- **/channel <username>** - Get a player's Twitch channel link

## Permissions

- `twitchannouncer.auth` - Use authentication commands (default: true)
- `twitchannouncer.channel` - Use channel command (default: true)
- `twitchannouncer.admin` - Administrative permissions (default: op)

## Configuration

The plugin supports extensive message customization including:
- Custom notification messages with placeholders
- Configurable watch button styling
- Stream title/game/viewer count display options
- Color customization with Minecraft color codes

## Troubleshooting

- Check server console for errors
- Ensure LuckPerms is installed and working
- Verify your Vercel app URL is accessible
- Check that players have proper permissions

## Architecture

The plugin consists of:
- **TwitchAnnouncerPlugin** - Main plugin class
- **VercelApiClient** - Handles Twitch API integration
- **StreamStatusManager** - Monitors stream status and sends notifications
- **TabListManager** - Manages tab list prefixes
- **DataStorage** - Handles player data persistence
- **Commands** - User interaction commands
