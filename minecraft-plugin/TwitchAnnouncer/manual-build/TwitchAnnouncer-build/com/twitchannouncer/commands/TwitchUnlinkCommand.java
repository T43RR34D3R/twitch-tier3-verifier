package com.twitchannouncer.commands;

import com.twitchannouncer.storage.DataStorage;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.jetbrains.annotations.NotNull;

import java.util.UUID;

public class TwitchUnlinkCommand implements CommandExecutor {
    
    private final DataStorage dataStorage;
    
    public TwitchUnlinkCommand(DataStorage dataStorage) {
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
        
        // Check if player has a linked account
        DataStorage.PlayerData playerData = dataStorage.getPlayerData(playerUuid);
        if (playerData == null || !playerData.hasLinkedTwitch()) {
            player.sendMessage(Component.text("You don't have a linked Twitch account.", NamedTextColor.RED));
            return true;
        }
        
        String twitchUsername = playerData.getTwitchUsername();
        
        // Unlink the account
        dataStorage.unlinkPlayer(playerUuid);
        
        // Reset tab display to remove any live prefix
        player.playerListName(Component.text(player.getName(), NamedTextColor.WHITE));
        
        player.sendMessage(Component.text("✓ Successfully unlinked your Twitch account (" + twitchUsername + ")", NamedTextColor.GREEN));
        player.sendMessage(Component.text("Your stream status will no longer be monitored.", NamedTextColor.GRAY));
        
        return true;
    }
}
