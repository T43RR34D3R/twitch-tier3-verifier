package com.twitchnotifier.listeners;

import com.twitchnotifier.TwitchNotifierPlugin;
import com.twitchnotifier.storage.DataStorage;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;

import java.util.UUID;

public class PlayerListener implements Listener {
    
    private final TwitchNotifierPlugin plugin;
    
    public PlayerListener(TwitchNotifierPlugin plugin) {
        this.plugin = plugin;
    }
    
    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        UUID playerUuid = player.getUniqueId();
        String playerName = player.getName();
        
        // Update player data with current username (in case they changed it)
        DataStorage.PlayerData existingData = plugin.getDataStorage().getPlayerData(playerUuid);
        if (existingData != null) {
            // Update the stored username but keep the Twitch link
            plugin.getDataStorage().setPlayerData(
                playerUuid, 
                playerName, 
                existingData.getTwitchUsername()
            );
        } else {
            // Create new player data entry
            plugin.getDataStorage().setPlayerData(playerUuid, playerName, null);
        }
        
        // Let tab list manager handle the player join
        plugin.getTabListManager().onPlayerJoin(player);
    }
    
    @EventHandler
    public void onPlayerQuit(PlayerQuitEvent event) {
        Player player = event.getPlayer();
        
        // Let tab list manager handle the player leave
        plugin.getTabListManager().onPlayerLeave(player);
    }
}
