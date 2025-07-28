package com.tier3toolkit.chatrelay;

import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.event.Listener;
import org.bukkit.event.EventHandler;
import org.bukkit.event.player.AsyncPlayerChatEvent;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;
import org.json.simple.JSONObject;

public class Tier3ChatRelay extends JavaPlugin implements Listener {
    private String webAppUrl;
    private String chatEndpoint;
    private int connectionTimeout;
    private int retryAttempts;
    private boolean chatEnabled;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        loadConfig();
        getServer().getPluginManager().registerEvents(this, this);
        
        // Register commands
        getCommand("tier3chat").setExecutor(new ChatCommand(this));
        
        getLogger().info("Tier3ChatRelay enabled!");
        getLogger().info("Web App URL: " + webAppUrl);
        getLogger().info("Chat relay: " + (chatEnabled ? "Enabled" : "Disabled"));
    }

    public void loadConfig() {
        reloadConfig();
        webAppUrl = getConfig().getString("webapp.url", "http://localhost:3000");
        chatEndpoint = getConfig().getString("webapp.endpoint", "/api/minecraft/chat-stream");
        connectionTimeout = getConfig().getInt("webapp.timeout", 5000);
        retryAttempts = getConfig().getInt("webapp.retry_attempts", 3);
        chatEnabled = getConfig().getBoolean("chat.enabled", true);
    }
    
    // Getter methods for command class
    public String getWebAppUrl() {
        return webAppUrl;
    }
    
    public String getChatEndpoint() {
        return chatEndpoint;
    }
    
    public boolean isChatEnabled() {
        return chatEnabled;
    }

    @EventHandler
    public void onPlayerChat(AsyncPlayerChatEvent event) {
        if (!chatEnabled) {
            return;
        }
        
        String playerName = event.getPlayer().getName();
        String playerUuid = event.getPlayer().getUniqueId().toString();
        String message = event.getMessage();
        sendMessageToWebApp(playerName, playerUuid, message, 0);
    }
    
    public void sendTestMessage(String playerName, String playerUuid, String message) {
        sendMessageToWebApp(playerName, playerUuid, message, 0);
    }

    private void sendMessageToWebApp(String playerName, String playerUuid, String message, int attempt) {
        Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
            try {
                URL url = new URL(webAppUrl + chatEndpoint);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json; utf-8");
                connection.setRequestProperty("Accept", "application/json");
                connection.setConnectTimeout(connectionTimeout);
                connection.setDoOutput(true);

                JSONObject jsonParam = new JSONObject();
                jsonParam.put("playerName", playerName);
                jsonParam.put("playerUuid", playerUuid);
                jsonParam.put("message", message);

                try (OutputStream os = connection.getOutputStream()) {
                    byte[] input = jsonParam.toJSONString().getBytes("utf-8");
                    os.write(input, 0, input.length);
                }

                int responseCode = connection.getResponseCode();
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    getLogger().info("Message sent: " + message);
                } else {
                    getLogger().warning("Failed to send message: HTTP " + responseCode);
                }
            } catch (Exception e) {
                getLogger().warning("Failed to send message: " + e.getMessage());
                // Retry logic
                if (attempt < retryAttempts) {
                    getLogger().info("Retrying... Attempt " + (attempt + 1));
                    sendMessageToWebApp(playerName, playerUuid, message, attempt + 1);
                }
            }
        });
    }

    @Override
    public void onDisable() {
        getLogger().info("Tier3ChatRelay disabled!");
    }
}
