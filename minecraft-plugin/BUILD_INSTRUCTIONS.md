# Tier3ChatRelay Plugin - Build Instructions

## Option 1: Manual Build (Recommended for now)

Since there are Java version conflicts with Maven, here's how to build the plugin manually:

1. **Copy the paper-plugin.yml and config.yml to the jar structure:**
   ```
   mkdir -p manual-build
   mkdir -p manual-build/META-INF
   mkdir -p manual-build/com/tier3toolkit/chatrelay
   ```

2. **Copy the plugin files**
   ```
   copy src\main\resources\paper-plugin.yml manual-build\
   copy src\main\resources\config.yml manual-build\
   copy src\main\java\com\tier3toolkit\chatrelay\*.java manual-build\com\tier3toolkit\chatrelay\
   ```

3. **Download dependencies manually:**
   - Download Paper API JAR for 1.21.1 from https://papermc.io/downloads
   - Download json-simple-1.1.1.jar from Maven Central

4. **Compile with javac:**
   ```
   javac -cp "path/to/paper-api.jar;path/to/json-simple.jar" -d manual-build manual-build/com/tier3toolkit/chatrelay/*.java
   ```

5. **Create JAR:**
   ```
   cd manual-build
   jar cvf ../Tier3ChatRelay-1.0.0.jar .
   ```

## Option 2: Alternative Simple Plugin

Instead of the complex plugin above, here's a simpler version that might work better:

### Simple Plugin Structure:
- Just relay chat messages to your web endpoint
- No complex command system initially
- Focus on core functionality

## Installation on Minecraft Server

1. **Copy the JAR file** to your server's `plugins` folder
2. **Restart the server** to load the plugin
3. **Edit the config** in `plugins/Tier3ChatRelay/config.yml`:
   ```yaml
   webapp:
     url: "http://your-domain.com"  # Change this to your Tier 3 Toolkit URL
     endpoint: "/api/minecraft/chat-stream"
   ```
4. **Restart the server** again to apply configuration

## Testing the Plugin

Once installed, you can test it with these Minecraft commands:

- `/tier3chat status` - Check if the plugin is working
- `/tier3chat test` - Send a test message to your web overlay
- `/tier3chat reload` - Reload the configuration

## Troubleshooting

- Check the server console for error messages
- Make sure your Tier 3 Toolkit web app is running and accessible
- Verify the URL in config.yml is correct
- Check that port 3000 (or your port) is accessible from the Minecraft server

## Commands Available:

- **/tier3chat status** - Shows plugin status and configuration
- **/tier3chat test** - Sends a test message to the overlay
- **/tier3chat reload** - Reloads the plugin configuration

The plugin will automatically send all chat messages to your Tier 3 Toolkit web overlay, where they'll appear in OBS with player head images!
