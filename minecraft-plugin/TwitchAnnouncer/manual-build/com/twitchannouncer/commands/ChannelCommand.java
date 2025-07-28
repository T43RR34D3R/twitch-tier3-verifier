package com.twitchannouncer.commands;

import com.twitchannouncer.storage.DataStorage;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.event.ClickEvent;
import net.kyori.adventure.text.event.HoverEvent;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.jetbrains.annotations.NotNull;

public class ChannelCommand implements CommandExecutor {
    
    private final DataStorage dataStorage;
    
    public ChannelCommand(DataStorage dataStorage) {
        this.dataStorage = dataStorage;
    }
    
    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (args.length != 1) {
            sender.sendMessage(Component.text("Usage: /channel <username>", NamedTextColor.RED));
            return true;
        }
        
        String targetUsername = args[0];
        DataStorage.PlayerData playerData = dataStorage.getPlayerDataByUsername(targetUsername);
        
        if (playerData == null) {
            sender.sendMessage(Component.text("Player '" + targetUsername + "' not found or hasn't used this server.", NamedTextColor.RED));
            return true;
        }
        
        if (!playerData.hasLinkedTwitch()) {
            sender.sendMessage(Component.text("Player '" + targetUsername + "' hasn't linked their Twitch account.", NamedTextColor.RED));
            return true;
        }
        
        String twitchUsername = playerData.getTwitchUsername();
        String channelUrl = "https://twitch.tv/" + twitchUsername;
        
        // Create clickable link message
        Component message = Component.text()
                .append(Component.text(targetUsername + "'s Twitch channel: ", NamedTextColor.GRAY))
                .append(Component.text(channelUrl, NamedTextColor.BLUE)
                        .decorate(TextDecoration.UNDERLINED)
                        .clickEvent(ClickEvent.openUrl(channelUrl))
                        .hoverEvent(HoverEvent.showText(Component.text("Click to open " + twitchUsername + "'s Twitch channel", NamedTextColor.YELLOW))))
                .build();
        
        sender.sendMessage(message);
        
        // Add streaming status if they're currently live
        if (playerData.isCurrentlyLive()) {
            Component liveMessage = Component.text("🔴 " + targetUsername + " is currently LIVE!", NamedTextColor.RED)
                    .decorate(TextDecoration.BOLD);
            sender.sendMessage(liveMessage);
        }
        
        return true;
    }
}
