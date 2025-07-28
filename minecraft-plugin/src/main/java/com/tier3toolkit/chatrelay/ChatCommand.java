package com.tier3toolkit.chatrelay;

import org.bukkit.ChatColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

public class ChatCommand implements CommandExecutor {
    private final Tier3ChatRelay plugin;

    public ChatCommand(Tier3ChatRelay plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!sender.hasPermission("tier3chat.admin")) {
            sender.sendMessage(ChatColor.RED + "You don't have permission to use this command!");
            return true;
        }

        if (args.length == 0) {
            sendHelp(sender);
            return true;
        }

        switch (args[0].toLowerCase()) {
            case "reload":
                plugin.reloadConfig();
                plugin.loadConfig();
                sender.sendMessage(ChatColor.GREEN + "Tier3ChatRelay configuration reloaded!");
                break;
            
            case "status":
                sender.sendMessage(ChatColor.YELLOW + "=== Tier3ChatRelay Status ===");
                sender.sendMessage(ChatColor.WHITE + "Web App URL: " + ChatColor.AQUA + plugin.getWebAppUrl());
                sender.sendMessage(ChatColor.WHITE + "Endpoint: " + ChatColor.AQUA + plugin.getChatEndpoint());
                sender.sendMessage(ChatColor.WHITE + "Status: " + (plugin.isEnabled() ? ChatColor.GREEN + "Enabled" : ChatColor.RED + "Disabled"));
                break;
            
            case "test":
                if (sender instanceof Player) {
                    Player player = (Player) sender;
                    plugin.sendTestMessage(player.getName(), player.getUniqueId().toString(), "Test message from " + player.getName());
                    sender.sendMessage(ChatColor.GREEN + "Test message sent to web overlay!");
                } else {
                    plugin.sendTestMessage("Console", "00000000-0000-0000-0000-000000000000", "Test message from console");
                    sender.sendMessage(ChatColor.GREEN + "Test message sent to web overlay!");
                }
                break;
            
            default:
                sendHelp(sender);
                break;
        }
        
        return true;
    }

    private void sendHelp(CommandSender sender) {
        sender.sendMessage(ChatColor.YELLOW + "=== Tier3ChatRelay Commands ===");
        sender.sendMessage(ChatColor.WHITE + "/tier3chat reload" + ChatColor.GRAY + " - Reload configuration");
        sender.sendMessage(ChatColor.WHITE + "/tier3chat status" + ChatColor.GRAY + " - Show plugin status");
        sender.sendMessage(ChatColor.WHITE + "/tier3chat test" + ChatColor.GRAY + " - Send test message");
    }
}
