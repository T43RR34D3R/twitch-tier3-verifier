package com.twitchannouncer.commands;

import com.twitchannouncer.TwitchAnnouncerPlugin;
import com.twitchannouncer.storage.DataStorage;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.luckperms.api.LuckPerms;
import net.luckperms.api.model.user.User;
import org.bukkit.Bukkit;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.jetbrains.annotations.NotNull;

import java.util.UUID;

public class TwitchTestCommand implements CommandExecutor {
    
    private final TwitchAnnouncerPlugin plugin;
    private final DataStorage dataStorage;
    
    public TwitchTestCommand(TwitchAnnouncerPlugin plugin, DataStorage dataStorage) {
        this.plugin = plugin;
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
        
        // Test current player data
        player.sendMessage(Component.text("=== TwitchAnnouncer Test Info ===", NamedTextColor.GOLD));
        
        // Check player data
        DataStorage.PlayerData playerData = dataStorage.getPlayerData(playerUuid);
        if (playerData != null) {
            player.sendMessage(Component.text("✓ Player data found", NamedTextColor.GREEN));
            player.sendMessage(Component.text("  Twitch Username: " + (playerData.getTwitchUsername() != null ? playerData.getTwitchUsername() : "Not linked"), NamedTextColor.YELLOW));
            player.sendMessage(Component.text("  Is Live: " + playerData.isCurrentlyLive(), NamedTextColor.YELLOW));
            player.sendMessage(Component.text("  Has Linked Twitch: " + playerData.hasLinkedTwitch(), NamedTextColor.YELLOW));
        } else {
            player.sendMessage(Component.text("✗ No player data found", NamedTextColor.RED));
        }
        
        // Check LuckPerms integration
        LuckPerms luckPerms = plugin.getLuckPerms();
        if (luckPerms != null) {
            player.sendMessage(Component.text("✓ LuckPerms integration active", NamedTextColor.GREEN));
            
            User user = luckPerms.getUserManager().getUser(playerUuid);
            if (user != null) {
                String prefix = user.getCachedData().getMetaData().getPrefix();
                String suffix = user.getCachedData().getMetaData().getSuffix();
                
                player.sendMessage(Component.text("  Current Prefix: " + (prefix != null ? prefix : "None"), NamedTextColor.YELLOW));
                player.sendMessage(Component.text("  Current Suffix: " + (suffix != null ? suffix : "None"), NamedTextColor.YELLOW));
            }
        } else {
            player.sendMessage(Component.text("✗ LuckPerms integration not available", NamedTextColor.RED));
        }
        
        // Test tab list display name
        Component currentDisplayName = player.displayName();
        player.sendMessage(Component.text("Current Tab Display: ", NamedTextColor.YELLOW).append(currentDisplayName));
        
        // Test stream status simulation
        if (args.length > 0) {
            String action = args[0].toLowerCase();
            switch (action) {
                case "live":
                    if (playerData != null) {
                        plugin.getTabListManager().updatePlayerTabPrefix(player, true);
                        player.sendMessage(Component.text("✓ Simulated going LIVE", NamedTextColor.GREEN));
                    } else {
                        player.sendMessage(Component.text("✗ No player data to test with", NamedTextColor.RED));
                    }
                    break;
                case "offline":
                    if (playerData != null) {
                        plugin.getTabListManager().updatePlayerTabPrefix(player, false);
                        player.sendMessage(Component.text("✓ Simulated going OFFLINE", NamedTextColor.GREEN));
                    } else {
                        player.sendMessage(Component.text("✗ No player data to test with", NamedTextColor.RED));
                    }
                    break;
                default:
                    player.sendMessage(Component.text("Usage: /twitchtest [live|offline]", NamedTextColor.GRAY));
                    break;
            }
        }
        
        return true;
    }
}
