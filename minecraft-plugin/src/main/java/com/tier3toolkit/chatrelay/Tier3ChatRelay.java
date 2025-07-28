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
import java.io.BufferedReader;
import java.io.InputStreamReader;
import org.json.simple.JSONObject;
import org.json.simple.JSONArray;
import org.json.simple.parser.JSONParser;

public class Tier3ChatRelay extends JavaPlugin implements Listener {
    private String webAppUrl;
    private String chatEndpoint;
    private String receiveEndpoint;
    private int connectionTimeout;
    private int retryAttempts;
    private boolean chatEnabled;
    private boolean receiveEnabled;
    private int pollInterval;
    private int taskId = -1;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        loadConfig();
        getServer().getPluginManager().registerEvents(this, this);
        
        // Register commands using Paper's method
        this.getServer().getCommandMap().register("tier3chat", new org.bukkit.command.Command("tier3chat") {
            @Override
            public boolean execute(org.bukkit.command.CommandSender sender, String commandLabel, String[] args) {
                return new ChatCommand(Tier3ChatRelay.this).onCommand(sender, this, commandLabel, args);
            }
        });
        
        getLogger().info("Tier3ChatRelay enabled!");
        getLogger().info("Web App URL: " + webAppUrl);
        getLogger().info("Chat relay: " + (chatEnabled ? "Enabled" : "Disabled"));
    }

    public void loadConfig() {
        reloadConfig();
        webAppUrl = getConfig().getString("webapp.url", "http://localhost:3000");
        chatEndpoint = getConfig().getString("webapp.endpoint", "/api/minecraft/chat-stream");
        receiveEndpoint = getConfig().getString("webapp.receive_endpoint", "/api/minecraft/receive-messages");
        connectionTimeout = getConfig().getInt("webapp.timeout", 5000);
        retryAttempts = getConfig().getInt("webapp.retry_attempts", 3);
        chatEnabled = getConfig().getBoolean("chat.enabled", true);
        receiveEnabled = getConfig().getBoolean("chat.receive_enabled", false);
        pollInterval = getConfig().getInt("chat.poll_interval", 30); // seconds
        
        // Start/stop polling task based on config
        if (receiveEnabled && taskId == -1) {
            startPolling();
        } else if (!receiveEnabled && taskId != -1) {
            stopPolling();
        }
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

    private void startPolling() {
        if (taskId != -1) {
            return; // Already running
        }
        
        getLogger().info("Starting message polling every " + pollInterval + " seconds");
        taskId = Bukkit.getScheduler().runTaskTimerAsynchronously(this, this::pollForMessages, 0L, pollInterval * 20L).getTaskId();
    }
    
    private void stopPolling() {
        if (taskId != -1) {
            Bukkit.getScheduler().cancelTask(taskId);
            taskId = -1;
            getLogger().info("Stopped message polling");
        }
    }
    
    private void pollForMessages() {
        try {
            URL url = new URL(webAppUrl + receiveEndpoint);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Accept", "application/json");
            connection.setConnectTimeout(connectionTimeout);
            
            int responseCode = connection.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();
                
                // Parse JSON response
                JSONParser parser = new JSONParser();
                JSONObject jsonResponse = (JSONObject) parser.parse(response.toString());
                JSONArray messages = (JSONArray) jsonResponse.get("messages");
                
                if (messages != null && !messages.isEmpty()) {
                    // Process messages on main thread
                    Bukkit.getScheduler().runTask(this, () -> {
                        for (Object msgObj : messages) {
                            JSONObject message = (JSONObject) msgObj;
                            String sender = (String) message.get("sender");
                            String content = (String) message.get("message");
                            String messageId = (String) message.get("id");
                            
                            // Broadcast message to all players
                            String formattedMessage = ChatColor.GRAY + "[" + ChatColor.BLUE + "Web" + ChatColor.GRAY + "] " + 
                                                    ChatColor.WHITE + sender + ": " + content;
                            Bukkit.broadcastMessage(formattedMessage);
                            
                            getLogger().info("Received web message from " + sender + ": " + content);
                        }
                    });
                    
                    // Acknowledge processed messages
                    acknowledgeMessages(messages);
                }
            } else if (responseCode != 204) { // 204 = No Content (no new messages)
                getLogger().warning("Failed to poll messages: HTTP " + responseCode);
            }
        } catch (Exception e) {
            getLogger().warning("Error polling for messages: " + e.getMessage());
        }
    }
    
    private void acknowledgeMessages(JSONArray messages) {
        Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
            try {
                URL url = new URL(webAppUrl + receiveEndpoint + "/ack");
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json; utf-8");
                connection.setConnectTimeout(connectionTimeout);
                connection.setDoOutput(true);
                
                JSONObject ackData = new JSONObject();
                JSONArray messageIds = new JSONArray();
                for (Object msgObj : messages) {
                    JSONObject message = (JSONObject) msgObj;
                    messageIds.add(message.get("id"));
                }
                ackData.put("messageIds", messageIds);
                
                try (OutputStream os = connection.getOutputStream()) {
                    byte[] input = ackData.toJSONString().getBytes("utf-8");
                    os.write(input, 0, input.length);
                }
                
                connection.getResponseCode(); // Trigger the request
            } catch (Exception e) {
                getLogger().warning("Error acknowledging messages: " + e.getMessage());
            }
        });
    }

    @Override
    public void onDisable() {
        stopPolling();
        getLogger().info("Tier3ChatRelay disabled!");
    }
}
