package com.twitchnotifier;

import com.twitchnotifier.commands.ChannelCommand;
import com.twitchnotifier.commands.TwitchAuthCommand;
import com.twitchnotifier.commands.TwitchUnlinkCommand;
import com.twitchnotifier.listeners.PlayerListener;
import com.twitchnotifier.managers.StreamStatusManager;
import com.twitchnotifier.managers.TabListManager;
import com.twitchnotifier.storage.DataStorage;
import com.twitchnotifier.api.VercelApiClient;
import net.luckperms.api.LuckPerms;
import org.bukkit.Bukkit;
import org.bukkit.plugin.RegisteredServiceProvider;
import org.bukkit.plugin.java.JavaPlugin;

public class TwitchNotifierPlugin extends JavaPlugin {
    
    private DataStorage dataStorage;
    private VercelApiClient apiClient;
    private StreamStatusManager streamStatusManager;
    private TabListManager tabListManager;
    private LuckPerms luckPerms;

    @Override
    public void onEnable() {
        // Save default config
        saveDefaultConfig();
        
        // Initialize LuckPerms
        RegisteredServiceProvider<LuckPerms> provider = Bukkit.getServicesManager().getRegistration(LuckPerms.class);
        if (provider != null) {
            luckPerms = provider.getProvider();
            getLogger().info("LuckPerms integration enabled!");
        } else {
            getLogger().severe("LuckPerms not found! Plugin will not work properly.");
            getServer().getPluginManager().disablePlugin(this);
            return;
        }
        
        // Initialize components
        initializeComponents();
        
        // Register commands
        registerCommands();
        
        // Register listeners
        registerListeners();
        
        // Start stream status checking task
        streamStatusManager.startStatusCheckTask();
        
        getLogger().info("TwitchNotifier has been enabled!");
    }

    @Override
    public void onDisable() {
        if (streamStatusManager != null) {
            streamStatusManager.stopStatusCheckTask();
        }
        
        if (dataStorage != null) {
            dataStorage.save();
        }
        
        getLogger().info("TwitchNotifier has been disabled!");
    }
    
    private void initializeComponents() {
        // Initialize data storage
        dataStorage = new DataStorage(this);
        dataStorage.load();
        
        // Initialize API client
        String vercelAppUrl = getConfig().getString("vercel-app-url", "https://your-vercel-app.vercel.app");
        apiClient = new VercelApiClient(vercelAppUrl);
        
        // Initialize managers
        tabListManager = new TabListManager(this);
        streamStatusManager = new StreamStatusManager(this, apiClient, dataStorage, tabListManager);
    }
    
    private void registerCommands() {
        getCommand("channel").setExecutor(new ChannelCommand(dataStorage));
        getCommand("twitchauth").setExecutor(new TwitchAuthCommand(this, apiClient, dataStorage));
        getCommand("twitchunlink").setExecutor(new TwitchUnlinkCommand(dataStorage));
    }
    
    private void registerListeners() {
        getServer().getPluginManager().registerEvents(new PlayerListener(this), this);
    }
    
    // Getters
    public DataStorage getDataStorage() {
        return dataStorage;
    }
    
    public VercelApiClient getApiClient() {
        return apiClient;
    }
    
    public StreamStatusManager getStreamStatusManager() {
        return streamStatusManager;
    }
    
    public TabListManager getTabListManager() {
        return tabListManager;
    }
    
    public LuckPerms getLuckPerms() {
        return luckPerms;
    }
}
