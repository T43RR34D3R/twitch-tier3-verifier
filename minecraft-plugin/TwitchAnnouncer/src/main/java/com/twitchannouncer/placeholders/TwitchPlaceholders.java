package com.twitchannouncer.placeholders;

import com.twitchannouncer.TwitchAnnouncerPlugin;
import com.twitchannouncer.storage.DataStorage;
import me.clip.placeholderapi.expansion.PlaceholderExpansion;
import org.bukkit.OfflinePlayer;
import org.jetbrains.annotations.NotNull;

/**
 * PlaceholderAPI expansion for TwitchAnnouncer
 * Provides placeholders that can be used with TAB plugin and other plugins
 * 
 * Available placeholders:
 * %twitchannouncer_live_status% - Returns "🔴LIVE" if player is live, empty if not
 * %twitchannouncer_live_prefix% - Returns "🔴 " if player is live, empty if not
 * %twitchannouncer_twitch_username% - Returns the player's Twitch username or empty
 * %twitchannouncer_is_live% - Returns "true" or "false"
 */
public class TwitchPlaceholders extends PlaceholderExpansion {

    private final TwitchAnnouncerPlugin plugin;

    public TwitchPlaceholders(TwitchAnnouncerPlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public @NotNull String getIdentifier() {
        return "twitchannouncer";
    }

    @Override
    public @NotNull String getAuthor() {
        return "TwitchAnnouncer";
    }

    @Override
    public @NotNull String getVersion() {
        return plugin.getDescription().getVersion();
    }

    @Override
    public boolean persist() {
        return true; // Required to keep the expansion loaded
    }

    @Override
    public String onRequest(OfflinePlayer player, @NotNull String params) {
        if (player == null) {
            return "";
        }

        DataStorage.PlayerData playerData = plugin.getDataStorage().getPlayerData(player.getUniqueId());
        if (playerData == null) {
            return "";
        }

        switch (params.toLowerCase()) {
            case "live_status":
                return playerData.isCurrentlyLive() ? "&c&l●LIVE" : "";
                
            case "live_prefix":
                return playerData.isCurrentlyLive() ? "&c&l●LIVE &r" : "";
                
            case "twitch_username":
                return playerData.getTwitchUsername() != null ? playerData.getTwitchUsername() : "";
                
            case "is_live":
                return String.valueOf(playerData.isCurrentlyLive());
                
            case "has_twitch":
                return String.valueOf(playerData.hasLinkedTwitch());
                
            default:
                return null; // Placeholder not found
        }
    }
}
