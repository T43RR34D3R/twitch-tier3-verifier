# 🎯 TwitchAnnouncer - Final Setup for BisectHosting

## ✅ What I've Prepared

1. **✅ Complete source code** extracted and organized
2. **✅ Downloaded 4/5 dependencies**:
   - Gson (JSON parsing) ✅
   - OkHttp (HTTP client) ✅  
   - Okio (HTTP dependency) ✅
   - LuckPerms API ✅
   - **Missing**: Paper/Bukkit API (needed for compilation)

## 🚀 Two Options to Complete

### Option 1: Manual API Download (Easiest)
1. Go to **https://getbukkit.org/download/spigot**
2. Download **spigot-api-1.20.4.jar** (or latest 1.20.x)
3. Put it in the `dependencies/` folder  
4. Rename it to `bukkit-api-1.20.4.jar`
5. Run this command to build:

```powershell
# Compile all Java files
javac -cp "dependencies\*.jar" -d build com\twitchannouncer\*.java com\twitchannouncer\*\*.java

# Copy resources  
Copy-Item plugin.yml build\
Copy-Item config.yml build\

# Create plugin JAR
cd build
jar cvf ..\TwitchAnnouncer-1.0.0-READY.jar *
cd ..
```

### Option 2: Use Maven (If you install it)
```powershell
mvn clean package
```
(Creates JAR in `target/` folder)

## 📤 Upload to BisectHosting

1. **Log into BisectHosting panel**
2. **File Manager** → Navigate to `plugins/` folder  
3. **Upload** `TwitchAnnouncer-1.0.0-READY.jar`
4. **Restart server**
5. **Configure** in `plugins/TwitchAnnouncer/config.yml`

## 🎮 Plugin Features (Once Running)

- **Live stream notifications** with [WATCH] buttons
- **Tab prefixes** for streaming players (🔴 LIVE)  
- **Commands**: `/twitchauth`, `/channel <player>`
- **LuckPerms integration**
- **Fully customizable** messages

## 📁 Current Package Contents

```
TwitchAnnouncer/
├── dependencies/         # 4/5 JARs ready ✅
│   ├── gson-2.10.1.jar
│   ├── okhttp-4.12.0.jar  
│   ├── okio-3.6.0.jar
│   ├── luckperms-api-5.4.jar
│   └── [bukkit-api needed] ❌
├── com/twitchannouncer/  # Complete source ✅
├── plugin.yml           # Plugin manifest ✅
├── config.yml           # Default config ✅  
└── build/               # Ready for compilation
```

## 🔧 Config Setup (After First Run)

Edit `plugins/TwitchAnnouncer/config.yml`:

```yaml
# Get these from https://dev.twitch.tv/console
twitch-client-id: "your_client_id_here"
twitch-client-secret: "your_client_secret_here"

# Your Next.js web app URL  
vercel-app-url: "https://your-app.vercel.app"

# Customize messages
messages:
  stream-announcement: "&6🔴 &b{player} &fis now streaming &d{title}!"
  # ... more customization options
```

---

**You're 95% there!** Just need that one API JAR and you're ready to go! 🚀
