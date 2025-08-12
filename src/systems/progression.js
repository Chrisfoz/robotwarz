/**
 * Progression System - Handles XP, levels, rewards, and achievements
 */

export class ProgressionSystem {
    constructor() {
        this.playerData = {
            level: 1,
            xp: 0,
            totalXP: 0,
            credits: 1000,
            wins: 0,
            losses: 0,
            kills: 0,
            deaths: 0,
            damageDealt: 0,
            damageTaken: 0,
            gamesPlayed: 0,
            winStreak: 0,
            bestWinStreak: 0,
            achievements: new Set(),
            unlockedItems: new Set(['TITAN']), // Start with Titan unlocked
            statistics: {
                favoriteBot: null,
                totalPlayTime: 0,
                accuracyRate: 0,
                survivalTime: 0,
                perfectGames: 0
            }
        };

        // XP requirements per level (exponential curve)
        this.xpRequirements = this.generateXPRequirements();
        
        // Rewards configuration
        this.rewards = {
            KILL: 100,
            ASSIST: 50,
            DAMAGE: 1, // per point of damage
            WIN: 250,
            LOSS: 50,
            SURVIVAL_BONUS: 25, // per 30 seconds survived
            FIRST_BLOOD: 150,
            DOUBLE_KILL: 200,
            TRIPLE_KILL: 300,
            RAMPAGE: 500,
            PERFECT_GAME: 1000, // No deaths
            COMEBACK: 300, // Win from behind
            CLOSE_CALL: 100, // Win with <10% health
            PARTICIPATION: 25
        };

        // Credit rewards
        this.creditRewards = {
            LEVEL_UP: 500,
            WIN: 100,
            KILL: 25,
            ACHIEVEMENT: 250,
            DAILY_BONUS: 200,
            WIN_STREAK_3: 150,
            WIN_STREAK_5: 300,
            WIN_STREAK_10: 750
        };

        // Level unlocks
        this.levelUnlocks = {
            2: { type: 'BOT', item: 'VIPER', name: 'Viper Bot Unlocked!' },
            3: { type: 'UPGRADE', item: 'ARMOR_1', name: 'Basic Armor Upgrade' },
            5: { type: 'BOT', item: 'SNIPER', name: 'Sniper Bot Unlocked!' },
            7: { type: 'ABILITY', item: 'OVERCHARGE', name: 'Overcharge Ability' },
            10: { type: 'BOT', item: 'TANK', name: 'Tank Bot Unlocked!' },
            12: { type: 'UPGRADE', item: 'SPEED_2', name: 'Advanced Speed Upgrade' },
            15: { type: 'BOT', item: 'ASSASSIN', name: 'Assassin Bot Unlocked!' },
            20: { type: 'ARENA', item: 'LAVA_ARENA', name: 'Lava Arena Unlocked!' },
            25: { type: 'PRESTIGE', item: 'PRESTIGE_1', name: 'Prestige Mode Available!' }
        };

        // Achievements
        this.achievementDefinitions = {
            FIRST_WIN: { 
                name: 'First Victory', 
                description: 'Win your first game', 
                xp: 500,
                credits: 100,
                check: (data) => data.wins >= 1 
            },
            VETERAN: { 
                name: 'Veteran', 
                description: 'Play 50 games', 
                xp: 1000,
                credits: 500,
                check: (data) => data.gamesPlayed >= 50 
            },
            SHARPSHOOTER: { 
                name: 'Sharpshooter', 
                description: 'Achieve 75% accuracy in a game', 
                xp: 750,
                credits: 300,
                check: (data, gameStats) => gameStats?.accuracy >= 0.75 
            },
            SURVIVOR: { 
                name: 'Survivor', 
                description: 'Win a game without dying', 
                xp: 1500,
                credits: 750,
                check: (data, gameStats) => gameStats?.deaths === 0 && gameStats?.won 
            },
            DESTROYER: { 
                name: 'Destroyer', 
                description: 'Deal 10,000 total damage', 
                xp: 2000,
                credits: 1000,
                check: (data) => data.damageDealt >= 10000 
            },
            UNSTOPPABLE: { 
                name: 'Unstoppable', 
                description: 'Get a 10 win streak', 
                xp: 3000,
                credits: 1500,
                check: (data) => data.bestWinStreak >= 10 
            },
            SPEED_DEMON: { 
                name: 'Speed Demon', 
                description: 'Win a game in under 2 minutes', 
                xp: 1000,
                credits: 500,
                check: (data, gameStats) => gameStats?.duration < 120 && gameStats?.won 
            },
            TANK_MASTER: { 
                name: 'Tank Master', 
                description: 'Take 5000 damage and survive', 
                xp: 1500,
                credits: 750,
                check: (data, gameStats) => gameStats?.damageTaken >= 5000 && !gameStats?.died 
            },
            EFFICIENT_KILLER: { 
                name: 'Efficient Killer', 
                description: 'Get 5 kills with less than 100 damage taken', 
                xp: 2000,
                credits: 1000,
                check: (data, gameStats) => gameStats?.kills >= 5 && gameStats?.damageTaken < 100 
            },
            COMEBACK_KID: { 
                name: 'Comeback Kid', 
                description: 'Win after being down to 10% health', 
                xp: 1500,
                credits: 750,
                check: (data, gameStats) => gameStats?.comeback === true 
            }
        };

        // Multipliers
        this.xpMultipliers = {
            DOUBLE_XP_WEEKEND: 2.0,
            FIRST_WIN_OF_DAY: 1.5,
            GROUP_BONUS: 1.2,
            PREMIUM: 1.5
        };

        // Track session stats
        this.sessionStats = {
            startTime: Date.now(),
            xpGained: 0,
            creditsEarned: 0,
            gamesPlayed: 0,
            wins: 0,
            kills: 0
        };

        this.loadProgress();
    }

    generateXPRequirements() {
        const requirements = [0]; // Level 1 requires 0 XP
        for (let level = 2; level <= 100; level++) {
            // Exponential curve: XP = 100 * level^1.5
            requirements.push(Math.floor(100 * Math.pow(level, 1.5)));
        }
        return requirements;
    }

    addXP(amount, reason = 'UNKNOWN') {
        const multiplier = this.calculateXPMultiplier();
        const xpGained = Math.floor(amount * multiplier);
        
        this.playerData.xp += xpGained;
        this.playerData.totalXP += xpGained;
        this.sessionStats.xpGained += xpGained;

        // Check for level up
        const levelUpData = this.checkLevelUp();
        
        // Create XP gain notification
        const notification = {
            type: 'XP_GAIN',
            amount: xpGained,
            reason: reason,
            multiplier: multiplier,
            levelUp: levelUpData
        };

        this.saveProgress();
        return notification;
    }

    checkLevelUp() {
        const currentLevel = this.playerData.level;
        let levelsGained = 0;
        let rewards = [];

        while (this.playerData.level < 100 && 
               this.playerData.xp >= this.xpRequirements[this.playerData.level]) {
            this.playerData.xp -= this.xpRequirements[this.playerData.level];
            this.playerData.level++;
            levelsGained++;

            // Add level up rewards
            this.addCredits(this.creditRewards.LEVEL_UP, 'LEVEL_UP');
            
            // Check for unlocks
            const unlock = this.levelUnlocks[this.playerData.level];
            if (unlock) {
                this.playerData.unlockedItems.add(unlock.item);
                rewards.push(unlock);
            }
        }

        if (levelsGained > 0) {
            return {
                newLevel: this.playerData.level,
                levelsGained: levelsGained,
                rewards: rewards,
                nextLevelXP: this.xpRequirements[this.playerData.level]
            };
        }

        return null;
    }

    addCredits(amount, reason = 'UNKNOWN') {
        this.playerData.credits += amount;
        this.sessionStats.creditsEarned += amount;
        this.saveProgress();

        return {
            type: 'CREDITS_GAIN',
            amount: amount,
            reason: reason,
            total: this.playerData.credits
        };
    }

    spendCredits(amount) {
        if (this.playerData.credits >= amount) {
            this.playerData.credits -= amount;
            this.saveProgress();
            return true;
        }
        return false;
    }

    processGameEnd(gameStats) {
        const rewards = [];
        const previousData = { ...this.playerData };

        // Update basic stats
        this.playerData.gamesPlayed++;
        this.playerData.kills += gameStats.kills || 0;
        this.playerData.deaths += gameStats.deaths || 0;
        this.playerData.damageDealt += gameStats.damageDealt || 0;
        this.playerData.damageTaken += gameStats.damageTaken || 0;

        // Calculate XP rewards
        let totalXP = 0;
        let totalCredits = 0;

        // Kill rewards
        if (gameStats.kills > 0) {
            const killXP = this.rewards.KILL * gameStats.kills;
            totalXP += killXP;
            totalCredits += this.creditRewards.KILL * gameStats.kills;
            rewards.push({ type: 'KILLS', xp: killXP, credits: this.creditRewards.KILL * gameStats.kills });
        }

        // Damage rewards
        if (gameStats.damageDealt > 0) {
            const damageXP = Math.floor(this.rewards.DAMAGE * gameStats.damageDealt);
            totalXP += damageXP;
            rewards.push({ type: 'DAMAGE', xp: damageXP });
        }

        // Win/Loss rewards
        if (gameStats.won) {
            this.playerData.wins++;
            this.playerData.winStreak++;
            this.playerData.bestWinStreak = Math.max(this.playerData.bestWinStreak, this.playerData.winStreak);
            
            totalXP += this.rewards.WIN;
            totalCredits += this.creditRewards.WIN;
            rewards.push({ type: 'VICTORY', xp: this.rewards.WIN, credits: this.creditRewards.WIN });

            // Win streak bonuses
            if (this.playerData.winStreak === 3) {
                totalCredits += this.creditRewards.WIN_STREAK_3;
                rewards.push({ type: 'WIN_STREAK_3', credits: this.creditRewards.WIN_STREAK_3 });
            } else if (this.playerData.winStreak === 5) {
                totalCredits += this.creditRewards.WIN_STREAK_5;
                rewards.push({ type: 'WIN_STREAK_5', credits: this.creditRewards.WIN_STREAK_5 });
            } else if (this.playerData.winStreak === 10) {
                totalCredits += this.creditRewards.WIN_STREAK_10;
                rewards.push({ type: 'WIN_STREAK_10', credits: this.creditRewards.WIN_STREAK_10 });
            }
        } else {
            this.playerData.losses++;
            this.playerData.winStreak = 0;
            totalXP += this.rewards.LOSS;
            rewards.push({ type: 'PARTICIPATION', xp: this.rewards.LOSS });
        }

        // Special bonuses
        if (gameStats.firstBlood) {
            totalXP += this.rewards.FIRST_BLOOD;
            rewards.push({ type: 'FIRST_BLOOD', xp: this.rewards.FIRST_BLOOD });
        }

        if (gameStats.perfectGame) {
            totalXP += this.rewards.PERFECT_GAME;
            rewards.push({ type: 'PERFECT_GAME', xp: this.rewards.PERFECT_GAME });
        }

        if (gameStats.comeback) {
            totalXP += this.rewards.COMEBACK;
            rewards.push({ type: 'COMEBACK', xp: this.rewards.COMEBACK });
        }

        // Apply XP and credits
        const xpNotification = this.addXP(totalXP, 'GAME_END');
        if (totalCredits > 0) {
            this.addCredits(totalCredits, 'GAME_END');
        }

        // Check achievements
        const newAchievements = this.checkAchievements(gameStats);
        if (newAchievements.length > 0) {
            rewards.push(...newAchievements);
        }

        // Update session stats
        this.sessionStats.gamesPlayed++;
        if (gameStats.won) this.sessionStats.wins++;
        this.sessionStats.kills += gameStats.kills || 0;

        this.saveProgress();

        return {
            rewards: rewards,
            totalXP: totalXP,
            totalCredits: totalCredits,
            levelUp: xpNotification.levelUp,
            newAchievements: newAchievements,
            stats: {
                before: previousData,
                after: this.playerData
            }
        };
    }

    checkAchievements(gameStats = {}) {
        const newAchievements = [];

        for (const [id, achievement] of Object.entries(this.achievementDefinitions)) {
            if (!this.playerData.achievements.has(id)) {
                if (achievement.check(this.playerData, gameStats)) {
                    this.playerData.achievements.add(id);
                    
                    // Grant achievement rewards
                    this.addXP(achievement.xp, 'ACHIEVEMENT');
                    this.addCredits(achievement.credits, 'ACHIEVEMENT');
                    
                    newAchievements.push({
                        type: 'ACHIEVEMENT',
                        id: id,
                        name: achievement.name,
                        description: achievement.description,
                        xp: achievement.xp,
                        credits: achievement.credits
                    });
                }
            }
        }

        return newAchievements;
    }

    calculateXPMultiplier() {
        let multiplier = 1.0;

        // Check for active multipliers (these would be set by game events)
        if (this.isDoubleXPWeekend()) {
            multiplier *= this.xpMultipliers.DOUBLE_XP_WEEKEND;
        }

        if (this.isFirstWinOfDay()) {
            multiplier *= this.xpMultipliers.FIRST_WIN_OF_DAY;
        }

        // Premium account check (would be set elsewhere)
        if (this.playerData.isPremium) {
            multiplier *= this.xpMultipliers.PREMIUM;
        }

        return multiplier;
    }

    isDoubleXPWeekend() {
        const now = new Date();
        const day = now.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    }

    isFirstWinOfDay() {
        const lastWin = localStorage.getItem('lastWinDate');
        const today = new Date().toDateString();
        return lastWin !== today;
    }

    getProgressToNextLevel() {
        const currentLevelXP = this.xpRequirements[this.playerData.level - 1] || 0;
        const nextLevelXP = this.xpRequirements[this.playerData.level] || 0;
        const requiredXP = nextLevelXP - currentLevelXP;
        
        return {
            current: this.playerData.xp,
            required: requiredXP,
            percentage: (this.playerData.xp / requiredXP) * 100,
            level: this.playerData.level,
            nextLevel: this.playerData.level + 1
        };
    }

    getPlayerStats() {
        return {
            ...this.playerData,
            winRate: this.playerData.gamesPlayed > 0 ? 
                (this.playerData.wins / this.playerData.gamesPlayed * 100).toFixed(1) : 0,
            kdr: this.playerData.deaths > 0 ? 
                (this.playerData.kills / this.playerData.deaths).toFixed(2) : this.playerData.kills,
            avgDamagePerGame: this.playerData.gamesPlayed > 0 ?
                Math.floor(this.playerData.damageDealt / this.playerData.gamesPlayed) : 0
        };
    }

    getSessionStats() {
        const duration = Date.now() - this.sessionStats.startTime;
        return {
            ...this.sessionStats,
            duration: Math.floor(duration / 1000), // in seconds
            xpPerMinute: duration > 0 ? 
                Math.floor(this.sessionStats.xpGained / (duration / 60000)) : 0
        };
    }

    isItemUnlocked(itemId) {
        return this.playerData.unlockedItems.has(itemId);
    }

    getUnlockedItems() {
        return Array.from(this.playerData.unlockedItems);
    }

    getAchievements() {
        const achievements = [];
        for (const [id, def] of Object.entries(this.achievementDefinitions)) {
            achievements.push({
                id: id,
                ...def,
                unlocked: this.playerData.achievements.has(id)
            });
        }
        return achievements;
    }

    saveProgress() {
        localStorage.setItem('battleBotsProgression', JSON.stringify(this.playerData));
        localStorage.setItem('battleBotsSession', JSON.stringify(this.sessionStats));
    }

    loadProgress() {
        const saved = localStorage.getItem('battleBotsProgression');
        if (saved) {
            const data = JSON.parse(saved);
            // Convert arrays back to Sets
            data.achievements = new Set(data.achievements || []);
            data.unlockedItems = new Set(data.unlockedItems || ['TITAN']);
            this.playerData = { ...this.playerData, ...data };
        }

        const session = localStorage.getItem('battleBotsSession');
        if (session) {
            const data = JSON.parse(session);
            // Check if session is from today
            const today = new Date().toDateString();
            const sessionDate = new Date(data.startTime).toDateString();
            if (today === sessionDate) {
                this.sessionStats = data;
            }
        }
    }

    resetProgress() {
        this.playerData = {
            level: 1,
            xp: 0,
            totalXP: 0,
            credits: 1000,
            wins: 0,
            losses: 0,
            kills: 0,
            deaths: 0,
            damageDealt: 0,
            damageTaken: 0,
            gamesPlayed: 0,
            winStreak: 0,
            bestWinStreak: 0,
            achievements: new Set(),
            unlockedItems: new Set(['TITAN']),
            statistics: {
                favoriteBot: null,
                totalPlayTime: 0,
                accuracyRate: 0,
                survivalTime: 0,
                perfectGames: 0
            }
        };

        this.sessionStats = {
            startTime: Date.now(),
            xpGained: 0,
            creditsEarned: 0,
            gamesPlayed: 0,
            wins: 0,
            kills: 0
        };

        this.saveProgress();
    }

    // Prestige system (for future implementation)
    canPrestige() {
        return this.playerData.level >= 50;
    }

    prestige() {
        if (!this.canPrestige()) return false;

        // Reset level but keep some benefits
        const prestigeLevel = (this.playerData.prestigeLevel || 0) + 1;
        const bonusCredits = 10000 * prestigeLevel;
        
        this.playerData.level = 1;
        this.playerData.xp = 0;
        this.playerData.credits += bonusCredits;
        this.playerData.prestigeLevel = prestigeLevel;
        
        // Keep all unlocks and achievements
        this.saveProgress();
        
        return {
            prestigeLevel: prestigeLevel,
            bonusCredits: bonusCredits
        };
    }
}

// Export singleton instance
export default new ProgressionSystem();