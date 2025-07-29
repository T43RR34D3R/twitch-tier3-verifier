# TwitchAnnouncer Plugin - Setup Guide for BisectHosting

## ✅ What I've Done For You

1. **Extracted the source code** from the JAR files
2. **Downloaded most dependencies**:
   - ✅ Gson (2.10.1) - JSON parsing
   - ✅ OkHttp (4.12.0) - HTTP client
   - ✅ Okio (3.6.0) - OkHttp dependency  
   - ✅ LuckPerms API (5.4) - Permissions integration
   - ❌ Paper API - Need to get manually

3. **Created build scripts** ready to use

## 🎯 What You Need To Do

### Step 1: Get Paper API JAR
Since Paper API download failed, you have two options:

**Option A (Recommended):** Use Spigot API instead (compatible)
```powershell
Invoke-WebRequest -Uri "https://repo1.maven.org/maven2/org/spigotmc/spigot-api/1.20.4-R0.1-SNAPSHOT/spigot-api-1.20.4-R0.1-20240617.140619-1.jar" -OutFile "dependencies\spigot-api-1.20.4.jar"
```

**Option B:** Download Paper API manually from https://papermc.io/downloads and place in `dependencies/` folder

### Step 2: Build the Plugin
```powershell
.\build-plugin-simple.ps1
```

### Step 3: Upload to BisectHosting
1. Log into your BisectHosting control panel
2. Go to **File Manager**
3. Navigate to your server's `plugins` folder
4. Upload `TwitchAnnouncer-1.0.0-compiled.jar`
5. Restart your server

### Step 4: Configure the Plugin
1. First server startup will create `plugins/TwitchAnnouncer/config.yml`
2. Edit the config with your Twitch API credentials
3. Get Twitch API credentials at: https://dev.twitch.tv/console

## 📁 Current Status

```
TwitchAnnouncer/
├── dependencies/           # ✅ Downloaded JARs
│   ├── gson-2.10.1.jar    # ✅ Ready
│   ├── okhttp-4.12.0.jar  # ✅ Ready  
│   ├── okio-3.6.0.jar     # ✅ Ready
│   ├── luckperms-api-5.4.jar # ✅ Ready
│   └── [paper-api needed]  # ❌ Need to add
├── com/                    # ✅ Source code extracted
├── plugin.yml             # ✅ Plugin manifest
├── config.yml             # ✅ Default config
└── build-plugin-simple.ps1 # ✅ Build script ready
```

## 🚀 Ready to Build!

Once you get the Paper/Spigot API JAR, just run the build script and you'll have a working plugin ready for your BisectHosting server!
