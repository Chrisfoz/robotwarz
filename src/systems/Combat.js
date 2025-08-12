import { GAME_CONFIG, BOT_CLASSES, ECONOMY, COLORS } from '../config/constants.js';

/**
 * Combat System for Battle Bots Arena Evolution
 * Handles all combat calculations including damage, effects, and statistics
 * 
 * Features:
 * - Advanced damage calculation with type effectiveness
 * - Critical hit system with visual feedback
 * - Armor penetration and damage falloff mechanics
 * - Component damage system (future-ready)
 * - Damage over time and status effects
 * - Combat statistics and logging
 * - Combo system for chained attacks
 */
export class CombatSystem {
    constructor() {
        // Type effectiveness matrix (attacker -> defender)
        this.typeEffectiveness = {
            melee: {
                light: 1.2,    // Effective vs light armor
                medium: 1.0,   // Normal vs medium armor
                heavy: 0.8,    // Weak vs heavy armor
                shield: 0.9    // Slightly weak vs shields
            },
            ranged: {
                light: 1.0,    // Normal vs light armor
                medium: 1.1,   // Slightly effective vs medium armor
                heavy: 1.3,    // Very effective vs heavy armor
                shield: 0.7    // Weak vs shields
            },
            emp: {
                light: 0.8,    // Weak vs light armor
                medium: 0.9,   // Slightly weak vs medium armor
                heavy: 0.7,    // Weak vs heavy armor
                shield: 1.5    // Very effective vs shields
            },
            explosive: {
                light: 1.1,    // Slightly effective vs all
                medium: 1.1,
                heavy: 1.1,
                shield: 1.2    // More effective vs shields
            }
        };

        // Critical hit system
        this.criticalChance = {
            base: 0.05,        // 5% base crit chance
            sniper: 0.15,      // Snipers have higher crit chance
            viper: 0.12,       // Viper has high crit chance
            phantom: 0.10      // Phantom has good crit chance
        };

        // Damage falloff by distance (for ranged attacks)
        this.damageFalloff = {
            minDistance: 50,   // No falloff within this range
            maxDistance: 300,  // Maximum effective range
            minDamage: 0.3     // Minimum damage percentage at max range
        };

        // Status effect definitions
        this.statusEffects = {
            BURN: {
                dps: 5,
                duration: 3000,
                stackable: true,
                maxStacks: 3,
                color: '#ff6b35'
            },
            SLOW: {
                speedMultiplier: 0.5,
                duration: 2000,
                stackable: false,
                color: '#4a90e2'
            },
            STUN: {
                disableMovement: true,
                disableAttacks: true,
                duration: 1000,
                stackable: false,
                color: '#f39c12'
            },
            POISON: {
                dps: 3,
                duration: 5000,
                stackable: true,
                maxStacks: 5,
                color: '#8e44ad'
            },
            VULNERABLE: {
                damageMultiplier: 1.25,
                duration: 4000,
                stackable: false,
                color: '#e74c3c'
            }
        };

        // Combo system
        this.combos = new Map();
        this.comboTimeout = 3000; // 3 seconds to continue combo

        // Combat logging
        this.combatLog = [];
        this.maxLogEntries = 100;

        // Damage numbers for visual feedback
        this.damageNumbers = [];
        this.damageNumberLifetime = 2000;

        // Kill tracking
        this.killStats = new Map();
        this.assistStats = new Map();
        this.assistTimeWindow = 5000; // 5 seconds for assist credit
    }

    /**
     * Calculate damage with all modifiers applied
     * @param {Object} attacker - Bot dealing damage
     * @param {Object} target - Bot receiving damage
     * @param {number} baseDamage - Base damage amount
     * @param {string} damageType - Type of damage (melee/ranged/emp/explosive)
     * @param {number} distance - Distance between attacker and target
     * @param {Object} options - Additional options (critForce, penetration, etc.)
     * @returns {Object} Damage calculation result
     */
    calculateDamage(attacker, target, baseDamage, damageType, distance = 0, options = {}) {
        if (!target.isAlive() || target.invulnerable) {
            return { finalDamage: 0, blocked: true, critical: false };
        }

        let damage = baseDamage;
        let isCritical = false;
        let modifiers = [];

        // Apply attacker damage bonuses
        if (attacker.currentStats) {
            const damageMultiplier = this.getDamageMultiplier(attacker, damageType);
            damage *= damageMultiplier;
            if (damageMultiplier > 1) {
                modifiers.push(`+${Math.round((damageMultiplier - 1) * 100)}% damage`);
            }
        }

        // Apply distance falloff for ranged attacks
        if (damageType === 'ranged' && distance > 0) {
            const falloffMultiplier = this.calculateFalloff(distance);
            damage *= falloffMultiplier;
            if (falloffMultiplier < 1) {
                modifiers.push(`-${Math.round((1 - falloffMultiplier) * 100)}% range`);
            }
        }

        // Check for critical hit
        if (!options.noCrit) {
            isCritical = this.rollCriticalHit(attacker, target, options.critForce);
            if (isCritical) {
                damage *= this.getCriticalMultiplier(attacker);
                modifiers.push('CRITICAL!');
            }
        }

        // Apply type effectiveness
        const armorType = this.getArmorType(target);
        const effectiveness = this.typeEffectiveness[damageType]?.[armorType] || 1.0;
        damage *= effectiveness;
        if (effectiveness !== 1.0) {
            const effectStr = effectiveness > 1 ? 'effective' : 'resisted';
            modifiers.push(`${effectStr} (${Math.round(effectiveness * 100)}%)`);
        }

        // Apply armor reduction
        let armorReduction = this.calculateArmorReduction(target, damageType, options.penetration);
        damage *= (1 - armorReduction);
        if (armorReduction > 0) {
            modifiers.push(`-${Math.round(armorReduction * 100)}% armor`);
        }

        // Apply status effect modifiers
        damage = this.applyStatusModifiers(target, damage, damageType);

        // Apply combo bonus
        const comboMultiplier = this.getComboMultiplier(attacker.id, target.id);
        if (comboMultiplier > 1) {
            damage *= comboMultiplier;
            modifiers.push(`${Math.round((comboMultiplier - 1) * 100)}% combo`);
        }

        // Component damage system (future expansion)
        const componentDamage = this.calculateComponentDamage(target, damage, options.hitLocation);

        const finalDamage = Math.max(1, Math.round(damage)); // Minimum 1 damage

        // Log the damage calculation
        this.logDamage(attacker, target, finalDamage, damageType, {
            critical: isCritical,
            modifiers,
            distance,
            effectiveness
        });

        return {
            finalDamage,
            critical: isCritical,
            blocked: false,
            modifiers,
            componentDamage,
            effectiveness
        };
    }

    /**
     * Apply damage to target with all effects
     * @param {Object} attacker - Bot dealing damage
     * @param {Object} target - Bot receiving damage
     * @param {number} baseDamage - Base damage amount
     * @param {string} damageType - Type of damage
     * @param {Object} options - Additional options
     * @returns {Object} Damage result
     */
    applyDamage(attacker, target, baseDamage, damageType, options = {}) {
        const distance = attacker.distanceTo ? attacker.distanceTo(target) : 0;
        const damageResult = this.calculateDamage(attacker, target, baseDamage, damageType, distance, options);
        
        if (damageResult.blocked || damageResult.finalDamage <= 0) {
            return damageResult;
        }

        // Track damage for assist system
        this.trackDamageForAssist(attacker.id, target.id, damageResult.finalDamage);

        // Apply damage to target
        const wasAlive = target.isAlive();
        const actualDamage = target.takeDamage(damageResult.finalDamage, damageType);
        
        // Update statistics
        if (attacker.stats) {
            attacker.stats.damageDealt += actualDamage;
        }

        // Create damage number for visual feedback
        this.createDamageNumber(target.x, target.y, actualDamage, damageResult.critical, damageType);

        // Check for kill
        if (wasAlive && !target.isAlive()) {
            this.handleKill(attacker, target);
        }

        // Apply status effects if specified
        if (options.statusEffects) {
            this.applyStatusEffects(target, options.statusEffects);
        }

        // Update combo system
        this.updateCombo(attacker.id, target.id);

        return {
            ...damageResult,
            actualDamage,
            killed: wasAlive && !target.isAlive()
        };
    }

    /**
     * Get damage multiplier for attacker based on stats and type
     * @param {Object} attacker - Attacking bot
     * @param {string} damageType - Type of damage
     * @returns {number} Damage multiplier
     */
    getDamageMultiplier(attacker, damageType) {
        let multiplier = 1.0;
        
        // Base stat multipliers
        if (damageType === 'melee' && attacker.currentStats.meleeDamage) {
            multiplier = attacker.currentStats.meleeDamage / attacker.baseStats.meleeDamage;
        } else if (damageType === 'ranged' && attacker.currentStats.rangedDamage) {
            multiplier = attacker.currentStats.rangedDamage / attacker.baseStats.rangedDamage;
        }

        // Ability-specific bonuses
        if (attacker.abilityActive) {
            switch (attacker.ability) {
                case 'berserk':
                    if (damageType === 'melee') multiplier *= 2.0;
                    break;
                case 'damageReduction':
                    // No damage bonus
                    break;
                // Add more abilities as needed
            }
        }

        return multiplier;
    }

    /**
     * Calculate damage falloff based on distance
     * @param {number} distance - Distance between attacker and target
     * @returns {number} Falloff multiplier (0-1)
     */
    calculateFalloff(distance) {
        if (distance <= this.damageFalloff.minDistance) {
            return 1.0;
        }
        
        if (distance >= this.damageFalloff.maxDistance) {
            return this.damageFalloff.minDamage;
        }

        const falloffRange = this.damageFalloff.maxDistance - this.damageFalloff.minDistance;
        const falloffDistance = distance - this.damageFalloff.minDistance;
        const falloffPercent = falloffDistance / falloffRange;
        
        return 1.0 - (falloffPercent * (1.0 - this.damageFalloff.minDamage));
    }

    /**
     * Roll for critical hit
     * @param {Object} attacker - Attacking bot
     * @param {Object} target - Target bot
     * @param {boolean} force - Force critical hit
     * @returns {boolean} True if critical hit
     */
    rollCriticalHit(attacker, target, force = false) {
        if (force) return true;

        let critChance = this.criticalChance.base;
        
        // Class-specific crit bonuses
        if (this.criticalChance[attacker.className]) {
            critChance = this.criticalChance[attacker.className];
        }

        // Ability modifiers
        if (attacker.abilityActive) {
            switch (attacker.ability) {
                case 'cloak':
                    critChance *= 2.0; // Stealth attacks have higher crit chance
                    break;
            }
        }

        // Status effect modifiers
        if (this.hasStatusEffect(target, 'VULNERABLE')) {
            critChance *= 1.5;
        }

        return Math.random() < critChance;
    }

    /**
     * Get critical hit damage multiplier
     * @param {Object} attacker - Attacking bot
     * @returns {number} Critical damage multiplier
     */
    getCriticalMultiplier(attacker) {
        let multiplier = 2.0; // Base crit multiplier

        // Class-specific crit damage
        switch (attacker.className) {
            case 'sniper':
                multiplier = 2.5;
                break;
            case 'phantom':
                multiplier = 2.2;
                break;
        }

        return multiplier;
    }

    /**
     * Get armor type for damage calculations
     * @param {Object} target - Target bot
     * @returns {string} Armor type
     */
    getArmorType(target) {
        const armorValue = target.currentStats?.armor || 0;
        
        if (armorValue >= 0.3) return 'heavy';
        if (armorValue >= 0.15) return 'medium';
        if (target.shield > 0) return 'shield';
        return 'light';
    }

    /**
     * Calculate armor damage reduction
     * @param {Object} target - Target bot
     * @param {string} damageType - Type of damage
     * @param {number} penetration - Armor penetration amount (0-1)
     * @returns {number} Armor reduction percentage
     */
    calculateArmorReduction(target, damageType, penetration = 0) {
        let armorValue = target.currentStats?.armor || 0;
        
        // Apply penetration
        armorValue *= (1 - penetration);
        
        // EMP damage bypasses some armor
        if (damageType === 'emp') {
            armorValue *= 0.5;
        }

        return Math.min(0.8, armorValue); // Cap at 80% reduction
    }

    /**
     * Apply status effect damage/healing modifiers
     * @param {Object} target - Target bot
     * @param {number} damage - Base damage
     * @param {string} damageType - Type of damage
     * @returns {number} Modified damage
     */
    applyStatusModifiers(target, damage, damageType) {
        let modifiedDamage = damage;

        // Vulnerable status increases damage taken
        if (this.hasStatusEffect(target, 'VULNERABLE')) {
            const effect = this.statusEffects.VULNERABLE;
            modifiedDamage *= effect.damageMultiplier;
        }

        return modifiedDamage;
    }

    /**
     * Calculate component-specific damage (future expansion)
     * @param {Object} target - Target bot
     * @param {number} damage - Total damage
     * @param {string} hitLocation - Where the hit landed
     * @returns {Object} Component damage breakdown
     */
    calculateComponentDamage(target, damage, hitLocation = 'center') {
        // Future implementation for destructible bot components
        // For now, return basic structure
        return {
            hull: damage * 0.7,
            armor: damage * 0.2,
            systems: damage * 0.1,
            critical: hitLocation === 'core'
        };
    }

    /**
     * Get combo multiplier for consecutive attacks
     * @param {string} attackerId - Attacker's ID
     * @param {string} targetId - Target's ID
     * @returns {number} Combo multiplier
     */
    getComboMultiplier(attackerId, targetId) {
        const comboKey = `${attackerId}-${targetId}`;
        const combo = this.combos.get(comboKey);
        
        if (!combo) return 1.0;

        const now = Date.now();
        if (now - combo.lastHit > this.comboTimeout) {
            this.combos.delete(comboKey);
            return 1.0;
        }

        // Combo multiplier: 1.0 + (hits * 0.1), max 2.0
        return Math.min(2.0, 1.0 + (combo.hits * 0.1));
    }

    /**
     * Update combo system
     * @param {string} attackerId - Attacker's ID
     * @param {string} targetId - Target's ID
     */
    updateCombo(attackerId, targetId) {
        const comboKey = `${attackerId}-${targetId}`;
        const now = Date.now();
        
        if (this.combos.has(comboKey)) {
            const combo = this.combos.get(comboKey);
            if (now - combo.lastHit <= this.comboTimeout) {
                combo.hits++;
                combo.lastHit = now;
            } else {
                // Reset combo
                this.combos.set(comboKey, { hits: 1, lastHit: now });
            }
        } else {
            this.combos.set(comboKey, { hits: 1, lastHit: now });
        }
    }

    /**
     * Apply status effects to target
     * @param {Object} target - Target bot
     * @param {Array} effects - Array of status effects to apply
     */
    applyStatusEffects(target, effects) {
        effects.forEach(effect => {
            const effectData = this.statusEffects[effect.type];
            if (!effectData) return;

            const statusKey = effect.type;
            const existingEffect = target.statusEffects.get(statusKey);

            if (effectData.stackable && existingEffect) {
                // Stack the effect
                const stacks = Math.min(effectData.maxStacks || 999, existingEffect.stacks + 1);
                existingEffect.stacks = stacks;
                existingEffect.duration = Math.max(existingEffect.duration, effect.duration || effectData.duration);
            } else {
                // Apply new effect or refresh existing
                target.statusEffects.set(statusKey, {
                    ...effectData,
                    duration: effect.duration || effectData.duration,
                    stacks: effectData.stackable ? (existingEffect?.stacks || 0) + 1 : 1,
                    source: effect.source
                });
            }
        });
    }

    /**
     * Update status effects for all bots
     * @param {Array} bots - Array of bots to update
     * @param {number} deltaTime - Time since last update
     */
    updateStatusEffects(bots, deltaTime) {
        bots.forEach(bot => {
            if (!bot.isAlive()) return;

            for (const [effectType, effectData] of bot.statusEffects) {
                // Apply damage over time effects
                if (effectData.dps) {
                    const damage = effectData.dps * effectData.stacks * (deltaTime / 1000);
                    bot.takeDamage(damage, 'dot');
                    this.createDamageNumber(bot.x, bot.y, damage, false, 'dot');
                }

                // Update duration
                effectData.duration -= deltaTime;
                if (effectData.duration <= 0) {
                    bot.statusEffects.delete(effectType);
                }
            }
        });
    }

    /**
     * Check if target has specific status effect
     * @param {Object} target - Target bot
     * @param {string} effectType - Status effect type
     * @returns {boolean} True if target has the effect
     */
    hasStatusEffect(target, effectType) {
        return target.statusEffects && target.statusEffects.has(effectType);
    }

    /**
     * Track damage for assist calculation
     * @param {string} attackerId - Attacker's ID
     * @param {string} targetId - Target's ID
     * @param {number} damage - Damage dealt
     */
    trackDamageForAssist(attackerId, targetId, damage) {
        const now = Date.now();
        const assistKey = `${targetId}`;
        
        if (!this.assistStats.has(assistKey)) {
            this.assistStats.set(assistKey, []);
        }
        
        const assists = this.assistStats.get(assistKey);
        assists.push({
            attackerId,
            damage,
            timestamp: now
        });
        
        // Clean old entries
        this.assistStats.set(assistKey, assists.filter(
            entry => now - entry.timestamp < this.assistTimeWindow
        ));
    }

    /**
     * Handle kill and award credits/XP
     * @param {Object} killer - Bot that got the kill
     * @param {Object} victim - Bot that was killed
     */
    handleKill(killer, victim) {
        // Award kill credits and XP
        if (killer.stats) {
            killer.stats.kills++;
        }
        
        // Track kill statistics
        const killKey = killer.id;
        if (!this.killStats.has(killKey)) {
            this.killStats.set(killKey, { kills: 0, credits: 0, xp: 0 });
        }
        
        const stats = this.killStats.get(killKey);
        stats.kills++;
        stats.credits += ECONOMY.REWARDS.KILL;
        stats.xp += ECONOMY.XP_REWARDS.KILL;

        // Award assists
        const assists = this.assistStats.get(victim.id) || [];
        assists.forEach(assist => {
            if (assist.attackerId !== killer.id) {
                const assistKey = assist.attackerId;
                if (!this.killStats.has(assistKey)) {
                    this.killStats.set(assistKey, { kills: 0, credits: 0, xp: 0 });
                }
                
                const assistStats = this.killStats.get(assistKey);
                assistStats.credits += ECONOMY.REWARDS.ASSIST;
                assistStats.xp += ECONOMY.XP_REWARDS.ASSIST;
            }
        });

        // Clear assist tracking for this victim
        this.assistStats.delete(victim.id);

        // Log the kill
        this.logKill(killer, victim, assists.length);
    }

    /**
     * Create damage number for visual feedback
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} damage - Damage amount
     * @param {boolean} critical - Is critical hit
     * @param {string} type - Damage type
     */
    createDamageNumber(x, y, damage, critical, type) {
        this.damageNumbers.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y - 20,
            damage: Math.round(damage),
            critical,
            type,
            life: this.damageNumberLifetime,
            maxLife: this.damageNumberLifetime,
            vx: (Math.random() - 0.5) * 2,
            vy: -2
        });
    }

    /**
     * Update damage numbers animation
     * @param {number} deltaTime - Time since last update
     */
    updateDamageNumbers(deltaTime) {
        this.damageNumbers = this.damageNumbers.filter(number => {
            number.life -= deltaTime;
            number.y += number.vy * (deltaTime / 16);
            number.vy += 0.1; // Gravity
            number.x += number.vx * (deltaTime / 16);
            return number.life > 0;
        });
    }

    /**
     * Render damage numbers
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    renderDamageNumbers(ctx) {
        this.damageNumbers.forEach(number => {
            const alpha = number.life / number.maxLife;
            const scale = number.critical ? 1.5 : 1.0;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${16 * scale}px Arial`;
            ctx.textAlign = 'center';
            
            // Color based on damage type
            let color = '#ffffff';
            switch (number.type) {
                case 'melee': color = '#ff6b6b'; break;
                case 'ranged': color = '#ffd93d'; break;
                case 'emp': color = '#6bcf7f'; break;
                case 'dot': color = '#bb86fc'; break;
                case 'explosive': color = '#ff9500'; break;
            }
            
            if (number.critical) {
                // Add glow effect for critical hits
                ctx.shadowBlur = 10;
                ctx.shadowColor = color;
                color = '#ffffff';
            }
            
            ctx.fillStyle = color;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            
            const text = number.critical ? `${number.damage}!` : `${number.damage}`;
            ctx.strokeText(text, number.x, number.y);
            ctx.fillText(text, number.x, number.y);
            
            ctx.restore();
        });
    }

    /**
     * Log damage for combat analysis
     * @param {Object} attacker - Attacking bot
     * @param {Object} target - Target bot
     * @param {number} damage - Final damage dealt
     * @param {string} type - Damage type
     * @param {Object} details - Additional details
     */
    logDamage(attacker, target, damage, type, details) {
        const logEntry = {
            timestamp: Date.now(),
            type: 'damage',
            attacker: attacker.name || attacker.className,
            attackerId: attacker.id,
            target: target.name || target.className,
            targetId: target.id,
            damage,
            damageType: type,
            critical: details.critical,
            distance: details.distance,
            effectiveness: details.effectiveness,
            modifiers: details.modifiers
        };

        this.combatLog.push(logEntry);
        
        // Limit log size
        if (this.combatLog.length > this.maxLogEntries) {
            this.combatLog.shift();
        }
    }

    /**
     * Log kill for statistics
     * @param {Object} killer - Killer bot
     * @param {Object} victim - Victim bot
     * @param {number} assistCount - Number of assists
     */
    logKill(killer, victim, assistCount) {
        const logEntry = {
            timestamp: Date.now(),
            type: 'kill',
            killer: killer.name || killer.className,
            killerId: killer.id,
            victim: victim.name || victim.className,
            victimId: victim.id,
            assistCount
        };

        this.combatLog.push(logEntry);
        
        if (this.combatLog.length > this.maxLogEntries) {
            this.combatLog.shift();
        }
    }

    /**
     * Get combat statistics for a bot
     * @param {string} botId - Bot ID
     * @returns {Object} Combat statistics
     */
    getBotStats(botId) {
        const killStats = this.killStats.get(botId) || { kills: 0, credits: 0, xp: 0 };
        
        // Calculate damage dealt and taken from combat log
        let damageDealt = 0;
        let damageTaken = 0;
        let hits = 0;
        let misses = 0;
        
        this.combatLog.forEach(entry => {
            if (entry.type === 'damage') {
                if (entry.attackerId === botId) {
                    damageDealt += entry.damage;
                    hits++;
                }
                if (entry.targetId === botId) {
                    damageTaken += entry.damage;
                }
            }
        });
        
        return {
            ...killStats,
            damageDealt,
            damageTaken,
            hits,
            accuracy: hits / (hits + misses) || 0,
            kda: killStats.kills / Math.max(1, damageTaken / 100) // Rough KDA calculation
        };
    }

    /**
     * Get combat effectiveness analysis
     * @returns {Object} Combat analysis data
     */
    getCombatAnalysis() {
        const botStats = new Map();
        const weaponStats = new Map();
        const typeEffectivenessStats = new Map();
        
        this.combatLog.forEach(entry => {
            if (entry.type === 'damage') {
                // Bot statistics
                if (!botStats.has(entry.attackerId)) {
                    botStats.set(entry.attackerId, {
                        totalDamage: 0,
                        hits: 0,
                        crits: 0,
                        kills: 0
                    });
                }
                
                const stats = botStats.get(entry.attackerId);
                stats.totalDamage += entry.damage;
                stats.hits++;
                if (entry.critical) stats.crits++;
                
                // Weapon type statistics
                if (!weaponStats.has(entry.damageType)) {
                    weaponStats.set(entry.damageType, {
                        totalDamage: 0,
                        hits: 0,
                        avgEffectiveness: 0
                    });
                }
                
                const weaponStat = weaponStats.get(entry.damageType);
                weaponStat.totalDamage += entry.damage;
                weaponStat.hits++;
                weaponStat.avgEffectiveness = (weaponStat.avgEffectiveness + entry.effectiveness) / 2;
            }
        });
        
        return {
            botStats: Object.fromEntries(botStats),
            weaponStats: Object.fromEntries(weaponStats),
            totalCombatEvents: this.combatLog.length,
            lastUpdate: Date.now()
        };
    }

    /**
     * Clear combat logs and reset statistics
     */
    reset() {
        this.combatLog.length = 0;
        this.killStats.clear();
        this.assistStats.clear();
        this.combos.clear();
        this.damageNumbers.length = 0;
    }

    /**
     * Export combat data for analysis or saving
     * @returns {Object} Serializable combat data
     */
    exportData() {
        return {
            combatLog: this.combatLog.slice(-50), // Last 50 events
            killStats: Object.fromEntries(this.killStats),
            timestamp: Date.now()
        };
    }

    /**
     * Import combat data
     * @param {Object} data - Combat data to import
     */
    importData(data) {
        if (data.combatLog) {
            this.combatLog = data.combatLog;
        }
        if (data.killStats) {
            this.killStats = new Map(Object.entries(data.killStats));
        }
    }
}