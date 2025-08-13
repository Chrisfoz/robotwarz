// Game Configuration Constants

export const ARENA_CONFIG = {
    WIDTH: 800,
    HEIGHT: 600
};

const DETECTED_DEBUG = (() => {
    try {
        const params = new URLSearchParams(globalThis.location?.search || '');
        if (params.get('debug') === '1') return true;
        const host = globalThis.location?.hostname || '';
        return host === 'localhost' || host === '127.0.0.1';
    } catch (e) {
        return false;
    }
})();

export const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    FPS: 60,
    TARGET_FPS: 60,
    FIXED_TIMESTEP: 1000 / 60,
    MAX_PLAYERS: 4,
    DEBUG_MODE: DETECTED_DEBUG
};

// 8 Permanent Robot Types - Base stats that can be upgraded
export const BOT_CLASSES = {
    TITAN: {
        id: 'titan',
        name: 'Titan',
        baseStats: {
            health: 150,
            speed: 3,
            meleeDamage: 25,
            rangedDamage: 15,
            armor: 0.3,
            energy: 100,
            rangedCooldown: 800,
            meleeCooldown: 500
        },
        color: '#4a5568',
        ability: 'damageReduction',
        abilityDuration: 3000,
        abilityCooldown: 10000,
        description: 'Heavy tank with damage reduction',
        unlocked: true,  // Starter bot
        price: 0
    },
    VIPER: {
        id: 'viper',
        name: 'Viper',
        baseStats: {
            health: 80,
            speed: 5,
            meleeDamage: 15,
            rangedDamage: 20,
            armor: 0,
            energy: 120,
            rangedCooldown: 300,
            meleeCooldown: 300
        },
        color: '#48bb78',
        ability: 'dash',
        abilityDuration: 200,
        abilityCooldown: 5000,
        description: 'Fast striker with dash ability',
        unlocked: true,  // Starter bot
        price: 0
    },
    SNIPER: {
        id: 'sniper',
        name: 'Sniper',
        baseStats: {
            health: 100,
            speed: 3.5,
            meleeDamage: 10,
            rangedDamage: 40,
            armor: 0.1,
            energy: 100,
            rangedCooldown: 1500,
            meleeCooldown: 700
        },
        color: '#9f7aea',
        ability: 'drone',
        abilityDuration: 10000,
        abilityCooldown: 15000,
        description: 'Long-range specialist with drone',
        unlocked: true,  // Starter bot
        price: 0
    },
    BRAWLER: {
        id: 'brawler',
        name: 'Brawler',
        baseStats: {
            health: 120,
            speed: 4,
            meleeDamage: 35,
            rangedDamage: 10,
            armor: 0.2,
            energy: 80,
            rangedCooldown: 1000,
            meleeCooldown: 400
        },
        color: '#f56565',
        ability: 'berserk',  // Increases melee damage and speed temporarily
        abilityDuration: 4000,
        abilityCooldown: 12000,
        description: 'Melee specialist with berserk mode',
        unlocked: false,
        price: 2500
    },
    PHANTOM: {
        id: 'phantom',
        name: 'Phantom',
        baseStats: {
            health: 90,
            speed: 4.5,
            meleeDamage: 20,
            rangedDamage: 25,
            armor: 0.05,
            energy: 110,
            rangedCooldown: 400,
            meleeCooldown: 400
        },
        color: '#805ad5',
        ability: 'cloak',  // Temporary invisibility
        abilityDuration: 3000,
        abilityCooldown: 10000,
        description: 'Stealth assassin with cloaking device',
        unlocked: false,
        price: 3500
    },
    FORTRESS: {
        id: 'fortress',
        name: 'Fortress',
        baseStats: {
            health: 200,
            speed: 2.5,
            meleeDamage: 20,
            rangedDamage: 20,
            armor: 0.4,
            energy: 80,
            rangedCooldown: 600,
            meleeCooldown: 600
        },
        color: '#718096',
        ability: 'deployShield',  // Creates a temporary shield barrier
        abilityDuration: 5000,
        abilityCooldown: 15000,
        description: 'Ultimate defense with deployable shields',
        unlocked: false,
        price: 4000
    },
    STRIKER: {
        id: 'striker',
        name: 'Striker',
        baseStats: {
            health: 100,
            speed: 4.2,
            meleeDamage: 18,
            rangedDamage: 30,
            armor: 0.15,
            energy: 100,
            rangedCooldown: 500,
            meleeCooldown: 450
        },
        color: '#ed8936',
        ability: 'multiShot',  // Fires multiple projectiles
        abilityDuration: 100,
        abilityCooldown: 8000,
        description: 'Balanced fighter with multi-shot capability',
        unlocked: true,  // Starter bot (4th starter)
        price: 0
    },
    ENGINEER: {
        id: 'engineer',
        name: 'Engineer',
        baseStats: {
            health: 110,
            speed: 3.8,
            meleeDamage: 15,
            rangedDamage: 22,
            armor: 0.15,
            energy: 130,
            rangedCooldown: 600,
            meleeCooldown: 500
        },
        color: '#38b2ac',
        ability: 'deployTurret',  // Deploys an automated turret
        abilityDuration: 8000,
        abilityCooldown: 20000,
        description: 'Support class with deployable turrets',
        unlocked: false,
        price: 5000
    }
};

// Upgrades that can be purchased and applied to ANY robot
export const UPGRADES = {
    // Permanent upgrades bought with credits (apply to specific robot)
    PERMANENT: {
        ARMOR: [
            {
                id: 'armor_1',
                name: 'Light Armor',
                effect: { armor: 0.05, health: 5 },
                cost: 300,
                description: '+5% damage reduction, +5 HP'
            },
            {
                id: 'armor_2',
                name: 'Medium Armor',
                effect: { armor: 0.10, health: 10 },
                cost: 800,
                requirement: 'armor_1',
                description: '+10% damage reduction, +10 HP'
            },
            {
                id: 'armor_3',
                name: 'Heavy Armor',
                effect: { armor: 0.15, health: 20, speed: -0.2 },
                cost: 1500,
                requirement: 'armor_2',
                description: '+15% damage reduction, +20 HP, -0.2 speed'
            }
        ],
        WEAPONS: [
            {
                id: 'weapon_1',
                name: 'Upgraded Weapons',
                effect: { meleeDamage: 1.1, rangedDamage: 1.1 },
                cost: 400,
                description: '+10% all damage'
            },
            {
                id: 'weapon_2',
                name: 'Advanced Weapons',
                effect: { meleeDamage: 1.2, rangedDamage: 1.2, cooldownReduction: 0.9 },
                cost: 1000,
                requirement: 'weapon_1',
                description: '+20% damage, -10% cooldowns'
            },
            {
                id: 'weapon_3',
                name: 'Elite Weapons',
                effect: { meleeDamage: 1.35, rangedDamage: 1.35, cooldownReduction: 0.85 },
                cost: 2000,
                requirement: 'weapon_2',
                description: '+35% damage, -15% cooldowns'
            }
        ],
        ENGINE: [
            {
                id: 'engine_1',
                name: 'Speed Boost',
                effect: { speed: 0.3, energy: 10 },
                cost: 350,
                description: '+0.3 speed, +10 energy'
            },
            {
                id: 'engine_2',
                name: 'Turbo Engine',
                effect: { speed: 0.6, energy: 20, acceleration: 1.2 },
                cost: 900,
                requirement: 'engine_1',
                description: '+0.6 speed, +20 energy, +20% acceleration'
            },
            {
                id: 'engine_3',
                name: 'Hyperdrive',
                effect: { speed: 1.0, energy: 30, acceleration: 1.4 },
                cost: 1800,
                requirement: 'engine_2',
                description: '+1.0 speed, +30 energy, +40% acceleration'
            }
        ],
        SPECIAL: [
            {
                id: 'regen_1',
                name: 'Repair Nanobots',
                effect: { regen: 0.5 },
                cost: 600,
                description: 'Regenerate 0.5 HP/second'
            },
            {
                id: 'shield_1',
                name: 'Energy Shield',
                effect: { shield: 20 },
                cost: 800,
                description: '+20 regenerating shield points'
            },
            {
                id: 'ability_1',
                name: 'Enhanced Capacitor',
                effect: { abilityCooldown: 0.85, abilityPower: 1.15 },
                cost: 1200,
                description: '-15% ability cooldown, +15% ability power'
            }
        ]
    },
    // Temporary in-game power-ups (found in arena or bought with match credits)
    TEMPORARY: {
        DAMAGE_BOOST: {
            duration: 30000,
            effect: { damage: 1.5 },
            cost: 100,
            description: '+50% damage for 30 seconds'
        },
        SPEED_BOOST: {
            duration: 20000,
            effect: { speed: 2.0 },
            cost: 75,
            description: 'Double speed for 20 seconds'
        },
        INVULNERABILITY: {
            duration: 5000,
            effect: { invulnerable: true },
            cost: 200,
            description: 'Invulnerable for 5 seconds'
        },
        RAPID_FIRE: {
            duration: 15000,
            effect: { cooldown: 0.5 },
            cost: 150,
            description: '50% faster attacks for 15 seconds'
        }
    }
};

// Player progression and economy
export const ECONOMY = {
    REWARDS: {
        KILL: 100,
        ASSIST: 50,
        DAMAGE_DEALT: 1,  // per point
        WIN_BONUS: 200,
        PARTICIPATION: 50,
        FIRST_BLOOD: 75,
        SURVIVAL_BONUS: 100
    },
    XP_REWARDS: {
        KILL: 50,
        ASSIST: 25,
        DAMAGE_DEALT: 0.5,
        WIN: 100,
        LOSS: 25,
        MATCH_COMPLETE: 50
    },
    LEVEL_REQUIREMENTS: {
        // XP needed for each level
        1: 0,
        2: 100,
        3: 250,
        4: 500,
        5: 1000,
        6: 1750,
        7: 2750,
        8: 4000,
        9: 5500,
        10: 7500,
        // ... continue pattern
    }
};

// Save data structure for player progression
export const SAVE_DATA_STRUCTURE = {
    playerProfile: {
        name: '',
        level: 1,
        xp: 0,
        credits: 0,
        totalMatches: 0,
        wins: 0,
        losses: 0
    },
    unlockedBots: ['titan', 'viper', 'sniper', 'striker'],  // Start with 4 bots
    botUpgrades: {
        // Store purchased upgrades per bot
        // Example: titan: ['armor_1', 'weapon_1', 'engine_1']
    },
    statistics: {
        totalKills: 0,
        totalDamage: 0,
        favoriteBot: '',
        playtime: 0
    },
    settings: {
        soundEnabled: true,
        musicVolume: 0.5,
        effectsVolume: 0.7
    }
};

export const COLORS = {
    PRIMARY: '#56CCF2',
    SECONDARY: '#3a4c67',
    BACKGROUND: '#0f1419',
    DAMAGE: '#fc8181',
    HEAL: '#68d391',
    ENERGY: '#63b3ed',
    WARNING: '#f6ad55',
    UI_BG: 'rgba(26, 26, 46, 0.8)',
    UI_BORDER: '#3a4c67',
    LOCKED: '#4a5568',
    UNLOCKED: '#48bb78',
    UPGRADE_AVAILABLE: '#f6e05e'
};

export const GAME_STATES = {
    MENU: 'MENU',
    BOT_SELECT: 'BOT_SELECT',
    UPGRADE_SHOP: 'UPGRADE_SHOP',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    LOBBY: 'LOBBY',
    VICTORY: 'VICTORY'
};
