package com.twitchannouncer.managers;

import com.twitchannouncer.TwitchAnnouncerPlugin;
import com.twitchannouncer.api.VercelApiClient;
import com.twitchannouncer.storage.DataStorage;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.event.ClickEvent;
import net.kyori.adventure.text.event.HoverEvent;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitTask;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class StreamStatusManager {
    
    private final TwitchAnnouncerPlugin plugin;
    private final VercelApiClient apiClient;
    private final DataStorage dataStorage;
    private final TabListManager tabListManager;
    
    private BukkitTask statusCheckTask;
    private final Set<UUID> currentlyLivePlayersCache = ConcurrentHashMap.newKeySet();
    
    public StreamStatusManager(TwitchAnnouncerPlugin plugin, VercelApiClient apiClient,
                             DataStorage dataStorage, TabListManager tabListManager) {
        this.plugin = plugin;
        this.apiClient = apiClient;
        this.dataStorage = dataStorage;
        this.tabListManager = tabListManager;
    }
    
    public void startStatusCheckTask() {
        // Check stream statuses every 2 minutes (2400 ticks)
        long interval = plugin.getConfig().getLong("stream-check-interval", 2400);
        
        statusCheckTask = Bukkit.getScheduler().runTaskTimerAsynchronously(plugin, () -> {
            checkAllStreamStatuses();
        }, 100L, interval); // Start after 5 seconds, then repeat every interval
        
        plugin.getLogger().info("Stream status checking started (interval: " + (interval / 20) + " seconds)");
    }
    
    public void stopStatusCheckTask() {
        if (statusCheckTask != null && !statusCheckTask.isCancelled()) {
            statusCheckTask.cancel();
            plugin.getLogger().info("Stream status checking stopped");
        }
    }
    
    private void checkAllStreamStatuses() {
        Map<UUID, DataStorage.PlayerData> allPlayerData = dataStorage.getAllPlayerData();
        
        for (Map.Entry<UUID, DataStorage.PlayerData> entry : allPlayerData.entrySet()) {
            UUID playerUuid = entry.getKey();
            DataStorage.PlayerData playerData = entry.getValue();
            
            // Skip players without linked Twitch accounts
            if (!playerData.hasLinkedTwitch()) {
                continue;
            }
            
            String twitchUsername = playerData.getTwitchUsername();
            boolean wasLive = playerData.isCurrentlyLive();
            
            // Check current stream status
            apiClient.getStreamStatus(twitchUsername).thenAccept(streamInfo -> {
                boolean isNowLive = (streamInfo != null);
                
                // Update data storage
                dataStorage.updateStreamStatus(playerUuid, isNowLive);
                
                // Update cache
                if (isNowLive) {
                    currentlyLivePlayersCache.add(playerUuid);
                } else {
                    currentlyLivePlayersCache.remove(playerUuid);
                }
                
                // Run on main thread for Bukkit operations
                Bukkit.getScheduler().runTask(plugin, () -> {
                    // Update tab list
                    tabListManager.updatePlayerTabDisplay(playerUuid, isNowLive);
                    
                    // Check if player went live (wasn't live before, but is now)
                    if (!wasLive && isNowLive) {
                        handlePlayerWentLive(playerUuid, playerData.getMinecraftUsername(), twitchUsername, streamInfo);
                    }
                });
                
            }).exceptionally(throwable -> {
                plugin.getLogger().warning("Failed to check stream status for " + twitchUsername + ": " + throwable.getMessage());
                return null;
            });
        }
    }
    
    private void handlePlayerWentLive(UUID playerUuid, String minecraftUsername, String twitchUsername, VercelApiClient.StreamInfo streamInfo) {
        // Check if the player is currently online
        Player player = Bukkit.getPlayer(playerUuid);
        boolean playerIsOnline = (player != null && player.isOnline());
        
        if (!playerIsOnline) {
            // Player is not online, don't send notification
            return;
        }
        
        String channelUrl = "https://twitch.tv/" + twitchUsername;
        
        // Get configurable message format
        String messageFormat = plugin.getConfig().getString("messages.live-notification.message", 
            "&c🔴 &e&l{player} &fis now LIVE on Twitch! &9&l[WATCH]");
        String watchButtonText = plugin.getConfig().getString("messages.live-notification.watch-button.text", "[WATCH]");
        String watchButtonColor = plugin.getConfig().getString("messages.live-notification.watch-button.color", "&9&l");
        String hoverText = plugin.getConfig().getString("messages.live-notification.watch-button.hover-text", 
            "&eClick to watch {twitch_username}'s stream");
        
        // Replace placeholders
        messageFormat = replacePlaceholders(messageFormat, minecraftUsername, twitchUsername, streamInfo);
        hoverText = replacePlaceholders(hoverText, minecraftUsername, twitchUsername, streamInfo);
        
        // Split message at [WATCH] placeholder to insert clickable button
        String[] messageParts = messageFormat.split("\\[WATCH\\]", 2);
        
        net.kyori.adventure.text.TextComponent.Builder messageBuilder = Component.text();
        
        // Add first part of message
        if (messageParts.length > 0) {
            messageBuilder.append(parseColorCodes(messageParts[0]));
        }
        
        // Add clickable watch button
        Component watchButton = parseColorCodes(watchButtonColor + watchButtonText)
                .clickEvent(ClickEvent.openUrl(channelUrl));
        
        if (plugin.getConfig().getBoolean("messages.live-notification.show.hover-tooltip", true)) {
            watchButton = watchButton.hoverEvent(HoverEvent.showText(parseColorCodes(hoverText)));
        }
        
        messageBuilder.append(watchButton);
        
        // Add second part of message if exists
        if (messageParts.length > 1) {
            messageBuilder.append(parseColorCodes(messageParts[1]));
        }
        
        Component message = messageBuilder.build();
        
        // Create additional messages based on config
        java.util.List<Component> additionalMessages = new java.util.ArrayList<>();
        
        // Add stream title if enabled and available
        if (plugin.getConfig().getBoolean("messages.live-notification.show.title", true) &&
            streamInfo != null && streamInfo.getTitle() != null && !streamInfo.getTitle().isEmpty()) {
            String titleFormat = plugin.getConfig().getString("messages.live-notification.title-message", "&7📺 {title}");
            titleFormat = replacePlaceholders(titleFormat, minecraftUsername, twitchUsername, streamInfo);
            additionalMessages.add(parseColorCodes(titleFormat));
        }
        
        // Add game info if enabled and different from title
        if (plugin.getConfig().getBoolean("messages.live-notification.show.game", false) &&
            streamInfo != null && streamInfo.getGame() != null && !streamInfo.getGame().isEmpty() &&
            !streamInfo.getGame().equals(streamInfo.getTitle())) {
            String gameFormat = plugin.getConfig().getString("messages.live-notification.game-message", "&7🎮 Playing: {game}");
            gameFormat = replacePlaceholders(gameFormat, minecraftUsername, twitchUsername, streamInfo);
            additionalMessages.add(parseColorCodes(gameFormat));
        }
        
        // Add viewer count if enabled
        if (plugin.getConfig().getBoolean("messages.live-notification.show.viewers", false) &&
            streamInfo != null && streamInfo.getViewers() > 0) {
            String viewerFormat = plugin.getConfig().getString("messages.live-notification.viewer-message", "&7👥 {viewers} viewers");
            viewerFormat = replacePlaceholders(viewerFormat, minecraftUsername, twitchUsername, streamInfo);
            additionalMessages.add(parseColorCodes(viewerFormat));
        }
        
        // Broadcast messages to all online players
        for (Player onlinePlayer : Bukkit.getOnlinePlayers()) {
            onlinePlayer.sendMessage(message);
            for (Component additionalMessage : additionalMessages) {
                onlinePlayer.sendMessage(additionalMessage);
            }
        }
        
        plugin.getLogger().info(minecraftUsername + " (" + twitchUsername + ") went live while online - notification sent to all players");
    }
    
    public boolean isPlayerLive(UUID playerUuid) {
        return currentlyLivePlayersCache.contains(playerUuid);
    }
    
    public void forceCheckPlayer(UUID playerUuid) {
        DataStorage.PlayerData playerData = dataStorage.getPlayerData(playerUuid);
        if (playerData == null || !playerData.hasLinkedTwitch()) {
            return;
        }
        
        String twitchUsername = playerData.getTwitchUsername();
        boolean wasLive = playerData.isCurrentlyLive();
        
        apiClient.getStreamStatus(twitchUsername).thenAccept(streamInfo -> {
            boolean isNowLive = (streamInfo != null);
            
            dataStorage.updateStreamStatus(playerUuid, isNowLive);
            
            if (isNowLive) {
                currentlyLivePlayersCache.add(playerUuid);
            } else {
                currentlyLivePlayersCache.remove(playerUuid);
            }
            
            Bukkit.getScheduler().runTask(plugin, () -> {
                tabListManager.updatePlayerTabDisplay(playerUuid, isNowLive);
                
                if (!wasLive && isNowLive) {
                    handlePlayerWentLive(playerUuid, playerData.getMinecraftUsername(), twitchUsername, streamInfo);
                }
            });
            
        }).exceptionally(throwable -> {
            plugin.getLogger().warning("Failed to force check stream status for " + twitchUsername + ": " + throwable.getMessage());
            return null;
        });
    }
    
    /**
     * Replace placeholders in message strings
     */
    private String replacePlaceholders(String message, String minecraftUsername, String twitchUsername, VercelApiClient.StreamInfo streamInfo) {
        message = message.replace("{player}", minecraftUsername);
        message = message.replace("{twitch_username}", twitchUsername);
        
        if (streamInfo != null) {
            message = message.replace("{title}", streamInfo.getTitle() != null ? streamInfo.getTitle() : "Untitled Stream");
            message = message.replace("{game}", streamInfo.getGame() != null ? streamInfo.getGame() : "Unknown Game");
            message = message.replace("{viewers}", String.valueOf(streamInfo.getViewers()));
        } else {
            message = message.replace("{title}", "Untitled Stream");
            message = message.replace("{game}", "Unknown Game");
            message = message.replace("{viewers}", "0");
        }
        
        return message;
    }
    
    /**
     * Parse Minecraft color codes (&1, &a, etc.) to Adventure Components
     */
    private Component parseColorCodes(String text) {
        // This is a simple implementation - for production you might want to use a library like MiniMessage
        Component component = Component.text(text);
        
        // Replace common color codes
        text = text.replace("&0", "§0").replace("&1", "§1").replace("&2", "§2").replace("&3", "§3")
                  .replace("&4", "§4").replace("&5", "§5").replace("&6", "§6").replace("&7", "§7")
                  .replace("&8", "§8").replace("&9", "§9").replace("&a", "§a").replace("&b", "§b")
                  .replace("&c", "§c").replace("&d", "§d").replace("&e", "§e").replace("&f", "§f")
                  .replace("&l", "§l").replace("&o", "§o").replace("&n", "§n").replace("&m", "§m")
                  .replace("&k", "§k").replace("&r", "§r");
        
        return Component.text(text);
    }
}
