package com.twitchnotifier.api;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import okhttp3.*;

import java.io.IOException;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

public class VercelApiClient {
    
    private final String baseUrl;
    private final OkHttpClient httpClient;
    private final Gson gson;
    
    public VercelApiClient(String baseUrl) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
        this.gson = new Gson();
    }
    
    /**
     * Start the authorization process for a Minecraft player
     * @param minecraftUsername The player's Minecraft username
     * @return CompletableFuture with the authorization URL and code
     */
    public CompletableFuture<AuthResponse> startAuthorization(String minecraftUsername) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                JsonObject requestBody = new JsonObject();
                requestBody.addProperty("minecraftUsername", minecraftUsername);
                
                RequestBody body = RequestBody.create(
                    requestBody.toString(),
                    MediaType.get("application/json; charset=utf-8")
                );
                
                Request request = new Request.Builder()
                        .url(baseUrl + "/api/minecraft/auth/start")
                        .post(body)
                        .build();
                
                try (Response response = httpClient.newCall(request).execute()) {
                    if (!response.isSuccessful()) {
                        throw new IOException("Unexpected response code: " + response.code());
                    }
                    
                    String responseBody = response.body().string();
                    JsonObject jsonResponse = JsonParser.parseString(responseBody).getAsJsonObject();
                    
                    return new AuthResponse(
                        jsonResponse.get("authUrl").getAsString(),
                        jsonResponse.get("authCode").getAsString()
                    );
                }
            } catch (Exception e) {
                throw new RuntimeException("Failed to start authorization", e);
            }
        });
    }
    
    /**
     * Check if the authorization is complete and get the Twitch username
     * @param authCode The authorization code from startAuthorization
     * @return CompletableFuture with the Twitch username if authorization is complete, null otherwise
     */
    public CompletableFuture<String> checkAuthorizationStatus(String authCode) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Request request = new Request.Builder()
                        .url(baseUrl + "/api/minecraft/auth/status?code=" + authCode)
                        .get()
                        .build();
                
                try (Response response = httpClient.newCall(request).execute()) {
                    if (!response.isSuccessful()) {
                        if (response.code() == 404) {
                            return null; // Authorization not complete yet
                        }
                        throw new IOException("Unexpected response code: " + response.code());
                    }
                    
                    String responseBody = response.body().string();
                    JsonObject jsonResponse = JsonParser.parseString(responseBody).getAsJsonObject();
                    
                    if (jsonResponse.has("twitchUsername")) {
                        return jsonResponse.get("twitchUsername").getAsString();
                    }
                    
                    return null; // Authorization not complete yet
                }
            } catch (Exception e) {
                throw new RuntimeException("Failed to check authorization status", e);
            }
        });
    }
    
    /**
     * Check if a Twitch user is currently streaming
     * @param twitchUsername The Twitch username to check
     * @return CompletableFuture with StreamInfo if streaming, null if not streaming
     */
    public CompletableFuture<StreamInfo> getStreamStatus(String twitchUsername) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Request request = new Request.Builder()
                        .url(baseUrl + "/api/twitch/stream-status?username=" + twitchUsername)
                        .get()
                        .build();
                
                try (Response response = httpClient.newCall(request).execute()) {
                    if (!response.isSuccessful()) {
                        if (response.code() == 404) {
                            return null; // Not streaming
                        }
                        throw new IOException("Unexpected response code: " + response.code());
                    }
                    
                    String responseBody = response.body().string();
                    JsonObject jsonResponse = JsonParser.parseString(responseBody).getAsJsonObject();
                    
                    if (jsonResponse.has("isLive") && jsonResponse.get("isLive").getAsBoolean()) {
                        return new StreamInfo(
                            twitchUsername,
                            jsonResponse.has("title") ? jsonResponse.get("title").getAsString() : "Untitled Stream",
                            jsonResponse.has("game") ? jsonResponse.get("game").getAsString() : "Unknown Game",
                            jsonResponse.has("viewers") ? jsonResponse.get("viewers").getAsInt() : 0
                        );
                    }
                    
                    return null; // Not streaming
                }
            } catch (Exception e) {
                throw new RuntimeException("Failed to get stream status", e);
            }
        });
    }
    
    /**
     * Get the Twitch channel URL for a username
     * @param twitchUsername The Twitch username
     * @return The Twitch channel URL
     */
    public String getTwitchChannelUrl(String twitchUsername) {
        return "https://twitch.tv/" + twitchUsername;
    }
    
    public void shutdown() {
        httpClient.dispatcher().executorService().shutdown();
        httpClient.connectionPool().evictAll();
    }
    
    // Response classes
    public static class AuthResponse {
        private final String authUrl;
        private final String authCode;
        
        public AuthResponse(String authUrl, String authCode) {
            this.authUrl = authUrl;
            this.authCode = authCode;
        }
        
        public String getAuthUrl() {
            return authUrl;
        }
        
        public String getAuthCode() {
            return authCode;
        }
    }
    
    public static class StreamInfo {
        private final String username;
        private final String title;
        private final String game;
        private final int viewers;
        
        public StreamInfo(String username, String title, String game, int viewers) {
            this.username = username;
            this.title = title;
            this.game = game;
            this.viewers = viewers;
        }
        
        public String getUsername() {
            return username;
        }
        
        public String getTitle() {
            return title;
        }
        
        public String getGame() {
            return game;
        }
        
        public int getViewers() {
            return viewers;
        }
    }
}
