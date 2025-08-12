/**
 * Upgrade System - Handles bot upgrades, shop, and stat modifications
 */

export class UpgradeSystem {
    constructor() {
        // Upgrade definitions with effects and costs
        this.upgrades = {
            // Armor upgrades
            ARMOR_1: {
                id: 'ARMOR_1',
                name: 'Reinforced Plating',
                description: 'Reduces damage taken by 10%',
                category: 'DEFENSE',
                tier: 1,
                cost: 500,
                effects: {
                    damageReduction: 0.1
                },
                requirements: { level: 3 },
                maxStacks: 1
            },
            ARMOR_2: {
                id: 'ARMOR_2',
                name: 'Heavy Armor',
                description: 'Reduces damage by 20% but decreases speed by 10%',
                category: 'DEFENSE',
                tier: 2,
                cost: 1200,
                effects: {
                    damageReduction: 0.2,
                    speedMultiplier: -0.1
                },
                requirements: { level: 7, prerequisite: 'ARMOR_1' },
                maxStacks: 1
            },
            ARMOR_3: {
                id: 'ARMOR_3',
                name: 'Reactive Armor',
                description: 'Reduces damage by 30% and reflects 10% damage back',
                category: 'DEFENSE',
                tier: 3,
                cost: 2500,
                effects: {
                    damageReduction: 0.3,
                    damageReflection: 0.1
                },
                requirements: { level: 15, prerequisite: 'ARMOR_2' },
                maxStacks: 1
            },

            // Speed upgrades
            SPEED_1: {
                id: 'SPEED_1',
                name: 'Turbo Boost',
                description: 'Increases movement speed by 15%',
                category: 'MOBILITY',
                tier: 1,
                cost: 400,
                effects: {
                    speedMultiplier: 0.15
                },
                requirements: { level: 2 },
                maxStacks: 1
            },
            SPEED_2: {
                id: 'SPEED_2',
                name: 'Overdrive',
                description: 'Increases speed by 25% and turn rate by 20%',
                category: 'MOBILITY',
                tier: 2,
                cost: 1000,
                effects: {
                    speedMultiplier: 0.25,
                    turnRateMultiplier: 0.2
                },
                requirements: { level: 8, prerequisite: 'SPEED_1' },
                maxStacks: 1
            },
            SPEED_3: {
                id: 'SPEED_3',
                name: 'Quantum Drive',
                description: 'Increases speed by 35% and grants dash ability',
                category: 'MOBILITY',
                tier: 3,
                cost: 2200,
                effects: {
                    speedMultiplier: 0.35,
                    dashEnabled: true,
                    dashCooldown: 5000
                },
                requirements: { level: 12, prerequisite: 'SPEED_2' },
                maxStacks: 1
            },

            // Weapon upgrades
            DAMAGE_1: {
                id: 'DAMAGE_1',
                name: 'Sharpened Weapons',
                description: 'Increases damage by 15%',
                category: 'OFFENSE',
                tier: 1,
                cost: 600,
                effects: {
                    damageMultiplier: 0.15
                },
                requirements: { level: 4 },
                maxStacks: 1
            },
            DAMAGE_2: {
                id: 'DAMAGE_2',
                name: 'Armor Piercing',
                description: 'Increases damage by 25% and ignores 20% armor',
                category: 'OFFENSE',
                tier: 2,
                cost: 1400,
                effects: {
                    damageMultiplier: 0.25,
                    armorPenetration: 0.2
                },
                requirements: { level: 10, prerequisite: 'DAMAGE_1' },
                maxStacks: 1
            },
            DAMAGE_3: {
                id: 'DAMAGE_3',
                name: 'Plasma Weapons',
                description: 'Increases damage by 40% and adds burn effect',
                category: 'OFFENSE',
                tier: 3,
                cost: 2800,
                effects: {
                    damageMultiplier: 0.4,
                    burnDamage: true,
                    burnDuration: 3000
                },
                requirements: { level: 18, prerequisite: 'DAMAGE_2' },
                maxStacks: 1
            },

            // Fire rate upgrades
            FIRERATE_1: {
                id: 'FIRERATE_1',
                name: 'Rapid Fire',
                description: 'Reduces weapon cooldown by 20%',
                category: 'OFFENSE',
                tier: 1,
                cost: 500,
                effects: {
                    fireRateMultiplier: 0.2
                },
                requirements: { level: 5 },
                maxStacks: 1
            },
            FIRERATE_2: {
                id: 'FIRERATE_2',
                name: 'Overclocked Systems',
                description: 'Reduces cooldown by 35% but increases heat generation',
                category: 'OFFENSE',
                tier: 2,
                cost: 1100,
                effects: {
                    fireRateMultiplier: 0.35,
                    heatGeneration: 1.2
                },
                requirements: { level: 11, prerequisite: 'FIRERATE_1' },
                maxStacks: 1
            },

            // Health upgrades
            HEALTH_1: {
                id: 'HEALTH_1',
                name: 'Reinforced Hull',
                description: 'Increases max health by 25%',
                category: 'DEFENSE',
                tier: 1,
                cost: 700,
                effects: {
                    healthMultiplier: 0.25
                },
                requirements: { level: 6 },
                maxStacks: 1
            },
            HEALTH_2: {
                id: 'HEALTH_2',
                name: 'Regenerative Plating',
                description: 'Increases health by 40% and adds slow regeneration',
                category: 'DEFENSE',
                tier: 2,
                cost: 1500,
                effects: {
                    healthMultiplier: 0.4,
                    healthRegen: 2 // HP per second
                },
                requirements: { level: 13, prerequisite: 'HEALTH_1' },
                maxStacks: 1
            },

            // Special upgrades
            SHIELD_1: {
                id: 'SHIELD_1',
                name: 'Energy Shield',
                description: 'Adds a regenerating shield worth 30% max health',
                category: 'DEFENSE',
                tier: 2,
                cost: 1800,
                effects: {
                    shieldCapacity: 0.3,
                    shieldRegenRate: 5,
                    shieldRegenDelay: 3000
                },
                requirements: { level: 14 },
                maxStacks: 1
            },
            CRIT_1: {
                id: 'CRIT_1',
                name: 'Precision Targeting',
                description: 'Increases critical hit chance by 15%',
                category: 'OFFENSE',
                tier: 1,
                cost: 800,
                effects: {
                    critChance: 0.15
                },
                requirements: { level: 9 },
                maxStacks: 1
            },
            CRIT_2: {
                id: 'CRIT_2',
                name: 'Weak Point Scanner',
                description: 'Increases crit chance by 25% and crit damage by 50%',
                category: 'OFFENSE',
                tier: 2,
                cost: 1600,
                effects: {
                    critChance: 0.25,
                    critDamageMultiplier: 0.5
                },
                requirements: { level: 16, prerequisite: 'CRIT_1' },
                maxStacks: 1
            },
            LIFESTEAL_1: {
                id: 'LIFESTEAL_1',
                name: 'Vampiric Systems',
                description: 'Heal for 20% of damage dealt',
                category: 'SUSTAIN',
                tier: 2,
                cost: 1400,
                effects: {
                    lifesteal: 0.2
                },
                requirements: { level: 12 },
                maxStacks: 1
            },
            EXPLOSION_1: {
                id: 'EXPLOSION_1',
                name: 'Explosive Rounds',
                description: 'Projectiles explode on impact dealing area damage',
                category: 'OFFENSE',
                tier: 2,
                cost: 1700,
                effects: {
                    explosiveRounds: true,
                    explosionRadius: 50,
                    explosionDamage: 0.3
                },
                requirements: { level: 15 },
                maxStacks: 1
            },

            // Utility upgrades
            RADAR_1: {
                id: 'RADAR_1',
                name: 'Enhanced Radar',
                description: 'Increases detection range and shows enemy health',
                category: 'UTILITY',
                tier: 1,
                cost: 600,
                effects: {
                    radarRange: 1.5,
                    showEnemyHealth: true
                },
                requirements: { level: 7 },
                maxStacks: 1
            },
            STEALTH_1: {
                id: 'STEALTH_1',
                name: 'Cloaking Device',
                description: 'Become invisible for 3 seconds (60s cooldown)',
                category: 'UTILITY',
                tier: 2,
                cost: 2000,
                effects: {
                    stealthEnabled: true,
                    stealthDuration: 3000,
                    stealthCooldown: 60000
                },
                requirements: { level: 17 },
                maxStacks: 1
            },
            TELEPORT_1: {
                id: 'TELEPORT_1',
                name: 'Blink Drive',
                description: 'Teleport a short distance (30s cooldown)',
                category: 'UTILITY',
                tier: 3,
                cost: 2500,
                effects: {
                    teleportEnabled: true,
                    teleportDistance: 200,
                    teleportCooldown: 30000
                },
                requirements: { level: 20 },
                maxStacks: 1
            }
        };

        // Upgrade categories for shop organization
        this.categories = {
            OFFENSE: { name: 'Offense', icon: '⚔️', color: '#ff4444' },
            DEFENSE: { name: 'Defense', icon: '🛡️', color: '#4444ff' },
            MOBILITY: { name: 'Mobility', icon: '💨', color: '#44ff44' },
            SUSTAIN: { name: 'Sustain', icon: '❤️', color: '#ff44ff' },
            UTILITY: { name: 'Utility', icon: '🔧', color: '#ffff44' }
        };

        // Player's purchased upgrades
        this.purchasedUpgrades = new Map();
        
        // Active upgrades per bot
        this.activeUpgrades = new Map();

        // Upgrade sets (for synergies)
        this.upgradeSets = {
            TANK_BUILD: {
                name: 'Tank Build',
                upgrades: ['ARMOR_2', 'HEALTH_2', 'SHIELD_1'],
                bonus: { damageReduction: 0.1 }
            },
            SPEED_BUILD: {
                name: 'Speed Demon',
                upgrades: ['SPEED_2', 'DASH_1', 'TELEPORT_1'],
                bonus: { speedMultiplier: 0.15 }
            },
            GLASS_CANNON: {
                name: 'Glass Cannon',
                upgrades: ['DAMAGE_3', 'CRIT_2', 'FIRERATE_2'],
                bonus: { damageMultiplier: 0.2, healthMultiplier: -0.2 }
            }
        };

        this.loadUpgrades();
    }

    purchaseUpgrade(upgradeId, progressionSystem) {
        const upgrade = this.upgrades[upgradeId];
        if (!upgrade) return { success: false, error: 'Invalid upgrade' };

        // Check requirements
        if (!this.canPurchase(upgradeId, progressionSystem)) {
            return { success: false, error: 'Requirements not met' };
        }

        // Check credits
        if (!progressionSystem.spendCredits(upgrade.cost)) {
            return { success: false, error: 'Insufficient credits' };
        }

        // Add to purchased upgrades
        const currentCount = this.purchasedUpgrades.get(upgradeId) || 0;
        if (currentCount >= upgrade.maxStacks) {
            return { success: false, error: 'Maximum stacks reached' };
        }

        this.purchasedUpgrades.set(upgradeId, currentCount + 1);
        this.saveUpgrades();

        return {
            success: true,
            upgrade: upgrade,
            stack: currentCount + 1,
            maxStacks: upgrade.maxStacks
        };
    }

    canPurchase(upgradeId, progressionSystem) {
        const upgrade = this.upgrades[upgradeId];
        if (!upgrade) return false;

        // Check level requirement
        if (upgrade.requirements.level > progressionSystem.playerData.level) {
            return false;
        }

        // Check prerequisite
        if (upgrade.requirements.prerequisite) {
            if (!this.purchasedUpgrades.has(upgrade.requirements.prerequisite)) {
                return false;
            }
        }

        // Check max stacks
        const currentCount = this.purchasedUpgrades.get(upgradeId) || 0;
        if (currentCount >= upgrade.maxStacks) {
            return false;
        }

        // Check credits
        if (progressionSystem.playerData.credits < upgrade.cost) {
            return false;
        }

        return true;
    }

    equipUpgrade(botId, upgradeId) {
        if (!this.purchasedUpgrades.has(upgradeId)) {
            return { success: false, error: 'Upgrade not purchased' };
        }

        if (!this.activeUpgrades.has(botId)) {
            this.activeUpgrades.set(botId, new Set());
        }

        const botUpgrades = this.activeUpgrades.get(botId);
        
        // Check for conflicting upgrades in same tier
        const upgrade = this.upgrades[upgradeId];
        for (const equippedId of botUpgrades) {
            const equipped = this.upgrades[equippedId];
            if (equipped.category === upgrade.category && equipped.tier === upgrade.tier) {
                botUpgrades.delete(equippedId);
            }
        }

        botUpgrades.add(upgradeId);
        this.saveUpgrades();

        return { success: true, upgrade: upgrade };
    }

    unequipUpgrade(botId, upgradeId) {
        if (!this.activeUpgrades.has(botId)) {
            return { success: false, error: 'No upgrades equipped' };
        }

        const botUpgrades = this.activeUpgrades.get(botId);
        if (!botUpgrades.has(upgradeId)) {
            return { success: false, error: 'Upgrade not equipped' };
        }

        botUpgrades.delete(upgradeId);
        this.saveUpgrades();

        return { success: true };
    }

    applyUpgrades(bot, botId) {
        const upgrades = this.activeUpgrades.get(botId);
        if (!upgrades || upgrades.size === 0) return bot;

        const effects = this.calculateCombinedEffects(upgrades);
        
        // Apply stat modifications
        if (effects.healthMultiplier) {
            bot.maxHealth *= (1 + effects.healthMultiplier);
            bot.health = bot.maxHealth;
        }

        if (effects.speedMultiplier) {
            bot.speed *= (1 + effects.speedMultiplier);
        }

        if (effects.damageMultiplier) {
            bot.damage *= (1 + effects.damageMultiplier);
        }

        if (effects.damageReduction) {
            bot.armor = (bot.armor || 0) + effects.damageReduction;
        }

        if (effects.fireRateMultiplier) {
            for (const key in bot.cooldowns) {
                bot.cooldowns[key] *= (1 - effects.fireRateMultiplier);
            }
        }

        // Add special properties
        if (effects.shieldCapacity) {
            bot.shield = bot.maxHealth * effects.shieldCapacity;
            bot.maxShield = bot.shield;
            bot.shieldRegenRate = effects.shieldRegenRate;
            bot.shieldRegenDelay = effects.shieldRegenDelay;
        }

        if (effects.healthRegen) {
            bot.healthRegen = effects.healthRegen;
        }

        if (effects.lifesteal) {
            bot.lifesteal = effects.lifesteal;
        }

        if (effects.critChance) {
            bot.critChance = (bot.critChance || 0) + effects.critChance;
        }

        if (effects.critDamageMultiplier) {
            bot.critDamageMultiplier = 1.5 + effects.critDamageMultiplier;
        }

        if (effects.armorPenetration) {
            bot.armorPenetration = effects.armorPenetration;
        }

        // Add abilities
        if (effects.dashEnabled) {
            bot.abilities.dash = {
                enabled: true,
                cooldown: effects.dashCooldown,
                lastUsed: 0
            };
        }

        if (effects.stealthEnabled) {
            bot.abilities.stealth = {
                enabled: true,
                duration: effects.stealthDuration,
                cooldown: effects.stealthCooldown,
                lastUsed: 0
            };
        }

        if (effects.teleportEnabled) {
            bot.abilities.teleport = {
                enabled: true,
                distance: effects.teleportDistance,
                cooldown: effects.teleportCooldown,
                lastUsed: 0
            };
        }

        // Apply set bonuses
        const setBonuses = this.checkSetBonuses(upgrades);
        for (const bonus of setBonuses) {
            this.applySetBonus(bot, bonus);
        }

        bot.upgrades = Array.from(upgrades);
        return bot;
    }

    calculateCombinedEffects(upgradeIds) {
        const combined = {};

        for (const upgradeId of upgradeIds) {
            const upgrade = this.upgrades[upgradeId];
            if (!upgrade) continue;

            for (const [effect, value] of Object.entries(upgrade.effects)) {
                if (typeof value === 'number') {
                    combined[effect] = (combined[effect] || 0) + value;
                } else {
                    combined[effect] = value;
                }
            }
        }

        return combined;
    }

    checkSetBonuses(upgradeIds) {
        const bonuses = [];

        for (const [setId, set] of Object.entries(this.upgradeSets)) {
            const hasAll = set.upgrades.every(id => upgradeIds.has(id));
            if (hasAll) {
                bonuses.push({
                    id: setId,
                    name: set.name,
                    bonus: set.bonus
                });
            }
        }

        return bonuses;
    }

    applySetBonus(bot, setBonus) {
        const bonus = setBonus.bonus;

        if (bonus.damageReduction) {
            bot.armor = (bot.armor || 0) + bonus.damageReduction;
        }

        if (bonus.speedMultiplier) {
            bot.speed *= (1 + bonus.speedMultiplier);
        }

        if (bonus.damageMultiplier) {
            bot.damage *= (1 + bonus.damageMultiplier);
        }

        if (bonus.healthMultiplier) {
            bot.maxHealth *= (1 + bonus.healthMultiplier);
            bot.health = Math.min(bot.health, bot.maxHealth);
        }

        bot.setBonus = setBonus.name;
    }

    getAvailableUpgrades(progressionSystem) {
        const available = [];

        for (const [id, upgrade] of Object.entries(this.upgrades)) {
            if (this.canPurchase(id, progressionSystem) || this.purchasedUpgrades.has(id)) {
                available.push({
                    ...upgrade,
                    purchased: this.purchasedUpgrades.has(id),
                    equipped: this.isEquipped(id),
                    canPurchase: this.canPurchase(id, progressionSystem),
                    stacks: this.purchasedUpgrades.get(id) || 0
                });
            }
        }

        return available;
    }

    isEquipped(upgradeId) {
        for (const botUpgrades of this.activeUpgrades.values()) {
            if (botUpgrades.has(upgradeId)) {
                return true;
            }
        }
        return false;
    }

    getEquippedUpgrades(botId) {
        const upgrades = this.activeUpgrades.get(botId);
        if (!upgrades) return [];

        return Array.from(upgrades).map(id => ({
            ...this.upgrades[id],
            id: id
        }));
    }

    getPurchasedUpgrades() {
        const purchased = [];
        for (const [id, count] of this.purchasedUpgrades) {
            purchased.push({
                ...this.upgrades[id],
                id: id,
                stacks: count
            });
        }
        return purchased;
    }

    getUpgradesByCategory(category) {
        return Object.values(this.upgrades).filter(u => u.category === category);
    }

    getTotalUpgradeValue() {
        let total = 0;
        for (const [id, count] of this.purchasedUpgrades) {
            const upgrade = this.upgrades[id];
            if (upgrade) {
                total += upgrade.cost * count;
            }
        }
        return total;
    }

    resetUpgrades() {
        this.purchasedUpgrades.clear();
        this.activeUpgrades.clear();
        this.saveUpgrades();
    }

    refundUpgrade(upgradeId, progressionSystem) {
        if (!this.purchasedUpgrades.has(upgradeId)) {
            return { success: false, error: 'Upgrade not purchased' };
        }

        const upgrade = this.upgrades[upgradeId];
        const refundAmount = Math.floor(upgrade.cost * 0.7); // 70% refund

        // Remove from equipped if necessary
        for (const botUpgrades of this.activeUpgrades.values()) {
            botUpgrades.delete(upgradeId);
        }

        // Remove from purchased
        const count = this.purchasedUpgrades.get(upgradeId);
        if (count > 1) {
            this.purchasedUpgrades.set(upgradeId, count - 1);
        } else {
            this.purchasedUpgrades.delete(upgradeId);
        }

        // Refund credits
        progressionSystem.addCredits(refundAmount, 'UPGRADE_REFUND');
        this.saveUpgrades();

        return {
            success: true,
            refundAmount: refundAmount
        };
    }

    saveUpgrades() {
        const data = {
            purchased: Array.from(this.purchasedUpgrades),
            active: Array.from(this.activeUpgrades).map(([botId, upgrades]) => [
                botId,
                Array.from(upgrades)
            ])
        };
        localStorage.setItem('battleBotsUpgrades', JSON.stringify(data));
    }

    loadUpgrades() {
        const saved = localStorage.getItem('battleBotsUpgrades');
        if (saved) {
            const data = JSON.parse(saved);
            this.purchasedUpgrades = new Map(data.purchased || []);
            this.activeUpgrades = new Map(
                (data.active || []).map(([botId, upgrades]) => [
                    botId,
                    new Set(upgrades)
                ])
            );
        }
    }

    // Get upgrade recommendations based on bot class
    getRecommendations(botClass) {
        const recommendations = {
            TITAN: ['ARMOR_2', 'HEALTH_2', 'SHIELD_1', 'DAMAGE_1'],
            VIPER: ['SPEED_2', 'CRIT_1', 'LIFESTEAL_1', 'STEALTH_1'],
            SNIPER: ['DAMAGE_2', 'CRIT_2', 'RADAR_1', 'EXPLOSION_1'],
            TANK: ['ARMOR_3', 'HEALTH_2', 'SHIELD_1', 'REFLECT_1'],
            ASSASSIN: ['SPEED_3', 'STEALTH_1', 'CRIT_2', 'TELEPORT_1']
        };

        return recommendations[botClass] || [];
    }
}

// Export singleton instance
export default new UpgradeSystem();