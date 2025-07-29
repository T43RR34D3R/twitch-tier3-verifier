package com.twitchannouncer.managers;

import com.twitchannouncer.TwitchAnnouncerPlugin;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import net.luckperms.api.LuckPerms;
import net.luckperms.api.model.user.User;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;

import java.util.UUID;

public class TabListManager {
    
    private final TwitchAnnouncerPlugin plugin;
    
    public TabListManager(TwitchAnnouncerPlugin plugin) {
        this.plugin = plugin;
    }
    
    /**
     * Update a player's tab list display name based on their stream status
     * @param playerUuid The player's UUID
     * @param isLive Whether the player is currently live
     */
    public void updatePlayerTabDisplay(UUID playerUuid, boolean isLive) {
        Player player = Bukkit.getPlayer(playerUuid);
        if (player == null || !player.isOnline()) {
            return;
        }
        
        updatePlayerTabPrefix(player, isLive);
    }
    
    /**
     * Update a player's tab prefix, combining LuckPerms prefix with live status
     * @param player The player to update
     * @param isLive Whether the player is currently live
     */
    public void updatePlayerTabPrefix(Player player, boolean isLive) {
        String playerName = player.getName();
        
        // Get the player's existing prefix from LuckPerms
        String existingPrefix = getPlayerPrefix(player);
        String existingSuffix = getPlayerSuffix(player);
        
        // Build the display name component using the builder pattern
        var displayNameBuilder = Component.text();
        
        // Add live prefix if streaming
        if (isLive) {
            String livePrefix = plugin.getConfig().getString("messages.live-notification.tab-prefix", "&c🔴 ");
            Component livePrefixComponent = LegacyComponentSerializer.legacyAmpersand().deserialize(livePrefix);
            displayNameBuilder.append(livePrefixComponent);
        }
        
        // Add existing LuckPerms prefix if it exists
        if (existingPrefix != null && !existingPrefix.isEmpty()) {
            Component existingPrefixComponent = LegacyComponentSerializer.legacyAmpersand().deserialize(existingPrefix);
            displayNameBuilder.append(existingPrefixComponent);
        }
        
        // Add player name
        displayNameBuilder.append(Component.text(playerName, NamedTextColor.WHITE));
        
        // Add suffix if exists
        if (existingSuffix != null && !existingSuffix.isEmpty()) {
            Component existingSuffixComponent = LegacyComponentSerializer.legacyAmpersand().deserialize(existingSuffix);
            displayNameBuilder.append(existingSuffixComponent);
        }
        
        Component displayName = displayNameBuilder.build();
        
        player.playerListName(displayName);
    }
    
    /**
     * Get a player's prefix from LuckPerms
     * @param player The player
     * @return The prefix string, or null if none
     */
    private String getPlayerPrefix(Player player) {
        LuckPerms luckPerms = plugin.getLuckPerms();
        if (luckPerms == null) {
            return null;
        }
        
        User user = luckPerms.getUserManager().getUser(player.getUniqueId());
        if (user == null) {
            return null;
        }
        
        return user.getCachedData().getMetaData().getPrefix();
    }
    
    /**
     * Get a player's suffix from LuckPerms
     * @param player The player
     * @return The suffix string, or null if none
     */
    private String getPlayerSuffix(Player player) {
        LuckPerms luckPerms = plugin.getLuckPerms();
        if (luckPerms == null) {
            return null;
        }
        
        User user = luckPerms.getUserManager().getUser(player.getUniqueId());
        if (user == null) {
            return null;
        }
        
        return user.getCachedData().getMetaData().getSuffix();
    }
    
    /**
     * Update tab display for all online players based on their current stream status
     */
    public void refreshAllPlayerTabDisplays() {
        for (Player player : Bukkit.getOnlinePlayers()) {
            UUID playerUuid = player.getUniqueId();
            
            // Get stream status from data storage
            var playerData = plugin.getDataStorage().getPlayerData(playerUuid);
            boolean isLive = (playerData != null && playerData.isCurrentlyLive());
            
            updatePlayerTabDisplay(playerUuid, isLive);
        }
    }
    
    /**
     * Reset a player's tab display to default (remove any prefixes)
     * @param playerUuid The player's UUID
     */
    public void resetPlayerTabDisplay(UUID playerUuid) {
        Player player = Bukkit.getPlayer(playerUuid);
        if (player == null || !player.isOnline()) {
            return;
        }
        
        player.playerListName(Component.text(player.getName(), NamedTextColor.WHITE));
    }
    
    /**
     * Called when a player joins to set their initial tab display
     * @param player The player who joined
     */
    public void onPlayerJoin(Player player) {
        UUID playerUuid = player.getUniqueId();
        
        // Check if player has linked Twitch and is currently live
        var playerData = plugin.getDataStorage().getPlayerData(playerUuid);
        boolean isLive = (playerData != null && playerData.isCurrentlyLive());
        
        updatePlayerTabDisplay(playerUuid, isLive);
        
        // Force check their stream status in case it changed while they were offline
        plugin.getStreamStatusManager().forceCheckPlayer(playerUuid);
    }
    
    /**
     * Called when a player leaves to clean up their tab display
     * @param player The player who left
     */
    public void onPlayerLeave(Player player) {
        // Tab display is automatically cleaned up when player leaves
        // This method is here for potential future use
    }
}
