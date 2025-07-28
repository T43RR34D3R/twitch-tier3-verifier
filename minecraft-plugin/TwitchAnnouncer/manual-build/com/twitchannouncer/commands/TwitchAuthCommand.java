package com.twitchannouncer.commands;

import com.twitchannouncer.TwitchAnnouncerPlugin;
import com.twitchannouncer.api.VercelApiClient;
import com.twitchannouncer.storage.DataStorage;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.event.ClickEvent;
import net.kyori.adventure.text.event.HoverEvent;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.jetbrains.annotations.NotNull;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class TwitchAuthCommand implements CommandExecutor {
    
    private final TwitchAnnouncerPlugin plugin;
    private final VercelApiClient apiClient;
    private final DataStorage dataStorage;
    
    // Store pending authorizations (authCode -> PlayerUUID)
    private final Map<String, UUID> pendingAuths = new ConcurrentHashMap<>();
    
    public TwitchAuthCommand(TwitchAnnouncerPlugin plugin, VercelApiClient apiClient, DataStorage dataStorage) {
        this.plugin = plugin;
        this.apiClient = apiClient;
        this.dataStorage = dataStorage;
    }
    
    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (!(sender instanceof Player)) {
            sender.sendMessage(Component.text("This command can only be used by players.", NamedTextColor.RED));
            return true;
        }
        
        Player player = (Player) sender;
        UUID playerUuid = player.getUniqueId();
        String playerName = player.getName();
        
        // Check if player already has a linked account
        DataStorage.PlayerData existingData = dataStorage.getPlayerData(playerUuid);
        if (existingData != null && existingData.hasLinkedTwitch()) {
            player.sendMessage(Component.text("You already have a Twitch account linked: " + existingData.getTwitchUsername(), NamedTextColor.YELLOW));
            player.sendMessage(Component.text("Use /twitchunlink to unlink your current account first.", NamedTextColor.GRAY));
            return true;
        }
        
        player.sendMessage(Component.text("Starting Twitch authorization process...", NamedTextColor.YELLOW));
        
        // Start authorization process
        apiClient.startAuthorization(playerName).thenAccept(authResponse -> {
            // Store the pending authorization
            pendingAuths.put(authResponse.getAuthCode(), playerUuid);
            
            // Send authorization URL to player
            Bukkit.getScheduler().runTask(plugin, () -> {
                Component message = Component.text()
                        .append(Component.text("Click here to authorize your Twitch account: ", NamedTextColor.GREEN))
                        .append(Component.text("[AUTHORIZE]", NamedTextColor.BLUE)
                                .decorate(TextDecoration.BOLD)
                                .clickEvent(ClickEvent.openUrl(authResponse.getAuthUrl()))
                                .hoverEvent(HoverEvent.showText(Component.text("Click to open authorization page", NamedTextColor.YELLOW))))
                        .build();
                
                player.sendMessage(message);
                player.sendMessage(Component.text("Or copy this link: " + authResponse.getAuthUrl(), NamedTextColor.GRAY));
                player.sendMessage(Component.text("You have 5 minutes to complete the authorization.", NamedTextColor.YELLOW));
                
                // Start checking for authorization completion
                startAuthorizationCheck(authResponse.getAuthCode(), playerUuid, playerName);
            });
        }).exceptionally(throwable -> {
            Bukkit.getScheduler().runTask(plugin, () -> {
                player.sendMessage(Component.text("Failed to start authorization: " + throwable.getMessage(), NamedTextColor.RED));
                plugin.getLogger().severe("Failed to start authorization for " + playerName + ": " + throwable.getMessage());
            });
            return null;
        });
        
        return true;
    }
    
    private void startAuthorizationCheck(String authCode, UUID playerUuid, String playerName) {
        // Check every 5 seconds for up to 5 minutes (60 attempts)
        checkAuthorizationStatus(authCode, playerUuid, playerName, 0);
    }
    
    private void checkAuthorizationStatus(String authCode, UUID playerUuid, String playerName, int attempt) {
        if (attempt >= 60) { // 5 minutes timeout
            pendingAuths.remove(authCode);
            
            Player player = Bukkit.getPlayer(playerUuid);
            if (player != null && player.isOnline()) {
                player.sendMessage(Component.text("Authorization timed out. Please try again with /twitchauth", NamedTextColor.RED));
            }
            return;
        }
        
        apiClient.checkAuthorizationStatus(authCode).thenAccept(twitchUsername -> {
            if (twitchUsername != null) {
                // Authorization complete!
                pendingAuths.remove(authCode);
                
                Bukkit.getScheduler().runTask(plugin, () -> {
                    // Save the linked account
                    dataStorage.setPlayerData(playerUuid, playerName, twitchUsername);
                    
                    Player player = Bukkit.getPlayer(playerUuid);
                    if (player != null && player.isOnline()) {
                        player.sendMessage(Component.text("✓ Successfully linked your Twitch account: " + twitchUsername, NamedTextColor.GREEN));
                        player.sendMessage(Component.text("Your stream status will now be monitored!", NamedTextColor.YELLOW));
                    }
                    
                    plugin.getLogger().info("Player " + playerName + " linked Twitch account: " + twitchUsername);
                });
            } else {
                // Not complete yet, check again in 5 seconds
                Bukkit.getScheduler().runTaskLater(plugin, () -> {
                    checkAuthorizationStatus(authCode, playerUuid, playerName, attempt + 1);
                }, 100L); // 5 seconds = 100 ticks
            }
        }).exceptionally(throwable -> {
            plugin.getLogger().warning("Error checking authorization status for " + playerName + ": " + throwable.getMessage());
            
            // Retry after 5 seconds
            Bukkit.getScheduler().runTaskLater(plugin, () -> {
                checkAuthorizationStatus(authCode, playerUuid, playerName, attempt + 1);
            }, 100L);
            
            return null;
        });
    }
}
