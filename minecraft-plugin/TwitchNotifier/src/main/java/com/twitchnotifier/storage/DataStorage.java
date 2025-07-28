package com.twitchnotifier.storage;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import com.twitchnotifier.TwitchNotifierPlugin;
import org.bukkit.Bukkit;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class DataStorage {
    
    private final TwitchNotifierPlugin plugin;
    private final File dataFile;
    private final Gson gson;
    
    // Maps Minecraft UUID to PlayerData
    private final Map<UUID, PlayerData> playerDataMap;
    
    // Maps Minecraft username to UUID for quick lookups
    private final Map<String, UUID> usernameToUuidMap;
    
    // Maps Twitch username to Minecraft UUID
    private final Map<String, UUID> twitchToMinecraftMap;
    
    public DataStorage(TwitchNotifierPlugin plugin) {
        this.plugin = plugin;
        this.dataFile = new File(plugin.getDataFolder(), "playerdata.json");
        this.gson = new GsonBuilder().setPrettyPrinting().create();
        
        this.playerDataMap = new ConcurrentHashMap<>();
        this.usernameToUuidMap = new ConcurrentHashMap<>();
        this.twitchToMinecraftMap = new ConcurrentHashMap<>();
    }
    
    public void load() {
        if (!dataFile.exists()) {
            plugin.getLogger().info("No existing player data found, starting fresh.");
            return;
        }
        
        try (FileReader reader = new FileReader(dataFile)) {
            Type type = new TypeToken<Map<String, PlayerData>>(){}.getType();
            Map<String, PlayerData> loadedData = gson.fromJson(reader, type);
            
            if (loadedData != null) {
                for (Map.Entry<String, PlayerData> entry : loadedData.entrySet()) {
                    UUID uuid = UUID.fromString(entry.getKey());
                    PlayerData data = entry.getValue();
                    
                    playerDataMap.put(uuid, data);
                    usernameToUuidMap.put(data.getMinecraftUsername(), uuid);
                    
                    if (data.getTwitchUsername() != null) {
                        twitchToMinecraftMap.put(data.getTwitchUsername(), uuid);
                    }
                }
                plugin.getLogger().info("Loaded data for " + playerDataMap.size() + " players.");
            }
        } catch (IOException e) {
            plugin.getLogger().severe("Failed to load player data: " + e.getMessage());
        }
    }
    
    public void save() {
        try {
            if (!plugin.getDataFolder().exists()) {
                plugin.getDataFolder().mkdirs();
            }
            
            // Convert UUID keys to strings for JSON serialization
            Map<String, PlayerData> saveData = new HashMap<>();
            for (Map.Entry<UUID, PlayerData> entry : playerDataMap.entrySet()) {
                saveData.put(entry.getKey().toString(), entry.getValue());
            }
            
            try (FileWriter writer = new FileWriter(dataFile)) {
                gson.toJson(saveData, writer);
            }
            
            plugin.getLogger().info("Saved data for " + playerDataMap.size() + " players.");
        } catch (IOException e) {
            plugin.getLogger().severe("Failed to save player data: " + e.getMessage());
        }
    }
    
    public PlayerData getPlayerData(UUID uuid) {
        return playerDataMap.get(uuid);
    }
    
    public PlayerData getPlayerDataByUsername(String minecraftUsername) {
        UUID uuid = usernameToUuidMap.get(minecraftUsername);
        return uuid != null ? playerDataMap.get(uuid) : null;
    }
    
    public PlayerData getPlayerDataByTwitchUsername(String twitchUsername) {
        UUID uuid = twitchToMinecraftMap.get(twitchUsername);
        return uuid != null ? playerDataMap.get(uuid) : null;
    }
    
    public void setPlayerData(UUID uuid, String minecraftUsername, String twitchUsername) {
        // Remove old mappings if they exist
        PlayerData oldData = playerDataMap.get(uuid);
        if (oldData != null && oldData.getTwitchUsername() != null) {
            twitchToMinecraftMap.remove(oldData.getTwitchUsername());
        }
        
        // Create new player data
        PlayerData newData = new PlayerData(minecraftUsername, twitchUsername, false);
        playerDataMap.put(uuid, newData);
        usernameToUuidMap.put(minecraftUsername, uuid);
        
        if (twitchUsername != null) {
            twitchToMinecraftMap.put(twitchUsername, uuid);
        }
        
        // Save asynchronously
        Bukkit.getScheduler().runTaskAsynchronously(plugin, this::save);
    }
    
    public void unlinkPlayer(UUID uuid) {
        PlayerData data = playerDataMap.get(uuid);
        if (data != null) {
            if (data.getTwitchUsername() != null) {
                twitchToMinecraftMap.remove(data.getTwitchUsername());
            }
            
            // Update player data to remove Twitch username but keep Minecraft username
            PlayerData newData = new PlayerData(data.getMinecraftUsername(), null, false);
            playerDataMap.put(uuid, newData);
            
            // Save asynchronously
            Bukkit.getScheduler().runTaskAsynchronously(plugin, this::save);
        }
    }
    
    public void updateStreamStatus(UUID uuid, boolean isLive) {
        PlayerData data = playerDataMap.get(uuid);
        if (data != null) {
            PlayerData updatedData = new PlayerData(
                data.getMinecraftUsername(),
                data.getTwitchUsername(),
                isLive
            );
            playerDataMap.put(uuid, updatedData);
        }
    }
    
    public Map<UUID, PlayerData> getAllPlayerData() {
        return new HashMap<>(playerDataMap);
    }
    
    public static class PlayerData {
        private final String minecraftUsername;
        private final String twitchUsername;
        private final boolean isCurrentlyLive;
        
        public PlayerData(String minecraftUsername, String twitchUsername, boolean isCurrentlyLive) {
            this.minecraftUsername = minecraftUsername;
            this.twitchUsername = twitchUsername;
            this.isCurrentlyLive = isCurrentlyLive;
        }
        
        public String getMinecraftUsername() {
            return minecraftUsername;
        }
        
        public String getTwitchUsername() {
            return twitchUsername;
        }
        
        public boolean isCurrentlyLive() {
            return isCurrentlyLive;
        }
        
        public boolean hasLinkedTwitch() {
            return twitchUsername != null && !twitchUsername.isEmpty();
        }
    }
}
