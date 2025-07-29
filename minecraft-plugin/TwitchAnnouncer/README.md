# TwitchAnnouncer Plugin - JAR Distribution

## 📦 **Available Files**

### `TwitchAnnouncer-1.0.0.jar` 
**Source JAR for Manual Compilation**
- Contains complete plugin source code
- Includes plugin.yml and config.yml
- Ready for compilation when dependencies are available

### `TwitchAnnouncer-1.0.0-sources.jar`
**Backup Source Distribution**
- Identical source code for reference
- Can be extracted and modified if needed

## ⚠️ **Important Note**

These JAR files contain **source code**, not compiled bytecode. They need to be compiled with the proper dependencies before they can be used as Minecraft plugins.

## 🔧 **To Use These JARs**

### Option 1: Manual Compilation (Recommended)
1. **Download Dependencies:**
   - Paper API (1.20.4+) from https://papermc.io/downloads
   - LuckPerms API (5.4+) from https://ci.lucko.me/job/LuckPerms/
   - OkHttp (4.12.0) from Maven Central
   - Gson (2.10.1) from Maven Central

2. **Extract the JAR:**
   ```bash
   jar xf TwitchAnnouncer-1.0.0.jar
   ```

3. **Compile the Java files:**
   ```bash
   javac -cp "paper-api.jar:luckperms-api.jar:okhttp.jar:gson.jar" -d . com/twitchannouncer/*.java com/twitchannouncer/*/*.java
   ```

4. **Create final plugin JAR:**
   ```bash
   jar cvf TwitchAnnouncer-1.0.0-compiled.jar plugin.yml config.yml com/
   ```

### Option 2: Maven Build
1. Use the `pom.xml` in the parent directory
2. Run `mvn clean package`
3. Find compiled JAR in `target/` directory

## 🚀 **Features**

- **Live Stream Notifications** with clickable [WATCH] buttons
- **Tab List Prefixes** for live streamers (🔴)
- **Fully Customizable Messages** with placeholders
- **Twitch OAuth Integration** for account linking
- **LuckPerms Integration** for permissions
- **Stream Status Monitoring** with configurable intervals

## 📋 **Commands**

- `/twitchauth` - Link your Twitch account
- `/twitchunlink` - Unlink your Twitch account  
- `/channel <username>` - Get player's Twitch channel link

## 🔑 **Permissions**

- `twitchannouncer.auth` - Use authentication commands (default: true)
- `twitchannouncer.channel` - Use channel command (default: true)
- `twitchannouncer.admin` - Administrative permissions (default: op)

## ⚙️ **Configuration**

The plugin supports extensive customization via `config.yml`:
- Custom notification messages with placeholders
- Configurable watch button styling
- Stream title/game/viewer count display options
- Color customization with Minecraft color codes

## 🔗 **Dependencies**

- **LuckPerms** (required)
- **Paper/Bukkit** 1.20.4+
- **Java** 17+

## 📖 **Documentation**

See `BUILD_INSTRUCTIONS.md` for detailed compilation instructions and architecture information.

---

**TwitchAnnouncer** v1.0.0 - Minecraft Plugin for Twitch Stream Announcements
