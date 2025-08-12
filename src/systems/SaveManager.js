import { SAVE_DATA_STRUCTURE } from '../config/constants.js';

export class SaveManager {
    constructor() {
        this.storageKey = 'robotwarz_save';
        this.settingsKey = 'robotwarz_settings';
    }

    // Load player profile
    loadProfile() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const data = JSON.parse(savedData);
                return this.validateAndMerge(data);
            }
        } catch (error) {
            console.error('Failed to load save data:', error);
        }
        
        // Return default profile
        return this.getDefaultProfile();
    }

    // Save player profile
    saveProfile(profile) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(profile));
            return true;
        } catch (error) {
            console.error('Failed to save profile:', error);
            return false;
        }
    }

    // Get default profile structure
    getDefaultProfile() {
        return {
            playerProfile: {
                name: 'Player',
                level: 1,
                xp: 0,
                credits: 1000, // Starting credits
                totalMatches: 0,
                wins: 0,
                losses: 0
            },
            unlockedBots: ['titan', 'viper', 'sniper', 'striker'], // 4 starter bots
            botUpgrades: {
                titan: [],
                viper: [],
                sniper: [],
                striker: [],
                brawler: [],
                phantom: [],
                fortress: [],
                engineer: []
            },
            statistics: {
                totalKills: 0,
                totalDamage: 0,
                totalDeaths: 0,
                favoriteBot: '',
                playtime: 0,
                highestKillStreak: 0,
                totalCreditsEarned: 0,
                totalXPEarned: 0
            },
            achievements: [],
            lastPlayed: Date.now()
        };
    }

    // Validate and merge saved data with default structure
    validateAndMerge(savedData) {
        const defaultProfile = this.getDefaultProfile();
        
        // Deep merge saved data with defaults
        return this.deepMerge(defaultProfile, savedData);
    }

    // Deep merge two objects
    deepMerge(target, source) {
        const output = { ...target };
        
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        output[key] = source[key];
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    output[key] = source[key];
                }
            });
        }
        
        return output;
    }

    // Check if value is an object
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    // Load game settings
    loadSettings() {
        try {
            const settings = localStorage.getItem(this.settingsKey);
            if (settings) {
                return JSON.parse(settings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
        
        return this.getDefaultSettings();
    }

    // Save game settings
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    // Get default settings
    getDefaultSettings() {
        return {
            soundEnabled: true,
            musicVolume: 0.5,
            effectsVolume: 0.7,
            graphics: 'high',
            showFPS: false,
            screenShake: true,
            particles: true,
            autoSave: true
        };
    }

    // Export save data as JSON string
    exportSave() {
        const profile = this.loadProfile();
        const settings = this.loadSettings();
        
        const exportData = {
            version: '1.0.0',
            timestamp: Date.now(),
            profile: profile,
            settings: settings
        };
        
        return btoa(JSON.stringify(exportData));
    }

    // Import save data from JSON string
    importSave(dataString) {
        try {
            const importData = JSON.parse(atob(dataString));
            
            if (importData.profile) {
                this.saveProfile(importData.profile);
            }
            
            if (importData.settings) {
                this.saveSettings(importData.settings);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to import save data:', error);
            return false;
        }
    }

    // Clear all save data
    clearSave() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.settingsKey);
            return true;
        } catch (error) {
            console.error('Failed to clear save data:', error);
            return false;
        }
    }

    // Update specific stat
    updateStat(statPath, value) {
        const profile = this.loadProfile();
        const keys = statPath.split('.');
        let current = profile;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        this.saveProfile(profile);
    }

    // Increment a stat
    incrementStat(statPath, amount = 1) {
        const profile = this.loadProfile();
        const keys = statPath.split('.');
        let current = profile;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        const lastKey = keys[keys.length - 1];
        current[lastKey] = (current[lastKey] || 0) + amount;
        this.saveProfile(profile);
    }

    // Unlock a bot
    unlockBot(botId) {
        const profile = this.loadProfile();
        if (!profile.unlockedBots.includes(botId)) {
            profile.unlockedBots.push(botId);
            this.saveProfile(profile);
            return true;
        }
        return false;
    }

    // Add upgrade to bot
    addBotUpgrade(botId, upgradeId) {
        const profile = this.loadProfile();
        if (!profile.botUpgrades[botId]) {
            profile.botUpgrades[botId] = [];
        }
        if (!profile.botUpgrades[botId].includes(upgradeId)) {
            profile.botUpgrades[botId].push(upgradeId);
            this.saveProfile(profile);
            return true;
        }
        return false;
    }

    // Check if bot is unlocked
    isBotUnlocked(botId) {
        const profile = this.loadProfile();
        return profile.unlockedBots.includes(botId);
    }

    // Get bot upgrades
    getBotUpgrades(botId) {
        const profile = this.loadProfile();
        return profile.botUpgrades[botId] || [];
    }

    // Calculate player level from XP
    calculateLevel(xp) {
        // Simple level calculation - can be adjusted
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }

    // Update player level based on XP
    updateLevel() {
        const profile = this.loadProfile();
        const newLevel = this.calculateLevel(profile.playerProfile.xp);
        
        if (newLevel !== profile.playerProfile.level) {
            profile.playerProfile.level = newLevel;
            this.saveProfile(profile);
            return newLevel;
        }
        
        return profile.playerProfile.level;
    }

    // Auto-save functionality
    enableAutoSave(interval = 30000) { // Auto-save every 30 seconds
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(() => {
            const profile = this.loadProfile();
            profile.lastPlayed = Date.now();
            this.saveProfile(profile);
        }, interval);
    }

    // Disable auto-save
    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
}