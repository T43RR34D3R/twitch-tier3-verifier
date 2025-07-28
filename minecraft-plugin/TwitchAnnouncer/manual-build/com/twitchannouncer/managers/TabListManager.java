package com.twitchannouncer.managers;

import com.twitchannouncer.TwitchAnnouncerPlugin;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
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
        
        String playerName = player.getName();
        
        if (isLive) {
            // Add live prefix to tab display
            Component liveTabName = Component.text()
                    .append(Component.text("🔴 ", NamedTextColor.RED))
                    .append(Component.text(playerName, NamedTextColor.WHITE))
                    .build();
            
            player.playerListName(liveTabName);
        } else {
            // Remove live prefix (reset to default)
            player.playerListName(Component.text(playerName, NamedTextColor.WHITE));
        }
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
