/**
 * Abilities System - Handles special abilities for different bot classes
 */

export class AbilitiesSystem {
    constructor() {
        // Ability definitions for each bot class
        this.abilities = {
            // TITAN abilities
            TITAN: {
                primary: {
                    name: 'Heavy Slam',
                    description: 'Slam the ground dealing area damage and stunning enemies',
                    cooldown: 8000,
                    duration: 0,
                    key: 'Q',
                    execute: this.executeHeavySlam.bind(this)
                },
                secondary: {
                    name: 'Iron Wall',
                    description: 'Become immobile but gain 80% damage reduction for 3 seconds',
                    cooldown: 15000,
                    duration: 3000,
                    key: 'E',
                    execute: this.executeIronWall.bind(this)
                },
                ultimate: {
                    name: 'Berserker Mode',
                    description: 'Double damage and speed but take 50% more damage for 5 seconds',
                    cooldown: 30000,
                    duration: 5000,
                    key: 'R',
                    execute: this.executeBerserkerMode.bind(this)
                }
            },

            // VIPER abilities
            VIPER: {
                primary: {
                    name: 'Venom Strike',
                    description: 'Next attack poisons enemy dealing damage over time',
                    cooldown: 6000,
                    duration: 0,
                    key: 'Q',
                    execute: this.executeVenomStrike.bind(this)
                },
                secondary: {
                    name: 'Shadow Dash',
                    description: 'Dash forward quickly, leaving a damaging trail',
                    cooldown: 10000,
                    duration: 0,
                    key: 'E',
                    execute: this.executeShadowDash.bind(this)
                },
                ultimate: {
                    name: 'Assassinate',
                    description: 'Teleport behind target and deal massive damage',
                    cooldown: 45000,
                    duration: 0,
                    key: 'R',
                    execute: this.executeAssassinate.bind(this)
                }
            },

            // SNIPER abilities
            SNIPER: {
                primary: {
                    name: 'Piercing Shot',
                    description: 'Fire a shot that penetrates through enemies',
                    cooldown: 7000,
                    duration: 0,
                    key: 'Q',
                    execute: this.executePiercingShot.bind(this)
                },
                secondary: {
                    name: 'Deploy Trap',
                    description: 'Place an invisible trap that slows and damages',
                    cooldown: 12000,
                    duration: 0,
                    key: 'E',
                    execute: this.executeDeployTrap.bind(this)
                },
                ultimate: {
                    name: 'Artillery Strike',
                    description: 'Call down a barrage of missiles in target area',
                    cooldown: 40000,
                    duration: 3000,
                    key: 'R',
                    execute: this.executeArtilleryStrike.bind(this)
                }
            },

            // TANK abilities
            TANK: {
                primary: {
                    name: 'Shield Burst',
                    description: 'Explode shield outward, pushing enemies back',
                    cooldown: 8000,
                    duration: 0,
                    key: 'Q',
                    execute: this.executeShieldBurst.bind(this)
                },
                secondary: {
                    name: 'Repair Protocol',
                    description: 'Heal self and nearby allies over 3 seconds',
                    cooldown: 20000,
                    duration: 3000,
                    key: 'E',
                    execute: this.executeRepairProtocol.bind(this)
                },
                ultimate: {
                    name: 'Fortress Mode',
                    description: 'Become immobile fortress with rotating turrets',
                    cooldown: 60000,
                    duration: 8000,
                    key: 'R',
                    execute: this.executeFortressMode.bind(this)
                }
            },

            // ASSASSIN abilities
            ASSASSIN: {
                primary: {
                    name: 'Smoke Bomb',
                    description: 'Drop smoke that blinds enemies and grants stealth',
                    cooldown: 10000,
                    duration: 3000,
                    key: 'Q',
                    execute: this.executeSmokeBomb.bind(this)
                },
                secondary: {
                    name: 'Blade Flurry',
                    description: 'Spin rapidly dealing damage to all nearby enemies',
                    cooldown: 12000,
                    duration: 2000,
                    key: 'E',
                    execute: this.executeBladeFlurry.bind(this)
                },
                ultimate: {
                    name: 'Shadow Clone',
                    description: 'Create a clone that mimics your actions',
                    cooldown: 50000,
                    duration: 10000,
                    key: 'R',
                    execute: this.executeShadowClone.bind(this)
                }
            },

            // SUPPORT abilities (future class)
            SUPPORT: {
                primary: {
                    name: 'Heal Beam',
                    description: 'Channel healing to target ally',
                    cooldown: 2000,
                    duration: 0,
                    key: 'Q',
                    execute: this.executeHealBeam.bind(this)
                },
                secondary: {
                    name: 'Speed Boost',
                    description: 'Grant speed boost to all nearby allies',
                    cooldown: 15000,
                    duration: 5000,
                    key: 'E',
                    execute: this.executeSpeedBoost.bind(this)
                },
                ultimate: {
                    name: 'Revival',
                    description: 'Instantly revive a fallen ally',
                    cooldown: 120000,
                    duration: 0,
                    key: 'R',
                    execute: this.executeRevival.bind(this)
                }
            }
        };

        // Track active abilities and cooldowns
        this.activeAbilities = new Map();
        this.cooldowns = new Map();
        
        // Visual effects for abilities
        this.abilityEffects = [];
        
        // Status effects applied by abilities
        this.statusEffects = new Map();
    }

    // Check if ability can be used
    canUseAbility(bot, abilityType) {
        const botClass = bot.class || 'TITAN';
        const ability = this.abilities[botClass]?.[abilityType];
        
        if (!ability) return false;
        
        const cooldownKey = `${bot.id}_${abilityType}`;
        const lastUsed = this.cooldowns.get(cooldownKey) || 0;
        const timeSinceUse = Date.now() - lastUsed;
        
        return timeSinceUse >= ability.cooldown;
    }

    // Get remaining cooldown time
    getCooldownRemaining(bot, abilityType) {
        const botClass = bot.class || 'TITAN';
        const ability = this.abilities[botClass]?.[abilityType];
        
        if (!ability) return 0;
        
        const cooldownKey = `${bot.id}_${abilityType}`;
        const lastUsed = this.cooldowns.get(cooldownKey) || 0;
        const timeSinceUse = Date.now() - lastUsed;
        
        return Math.max(0, ability.cooldown - timeSinceUse);
    }

    // Use an ability
    useAbility(bot, abilityType, gameContext) {
        if (!this.canUseAbility(bot, abilityType)) {
            return { success: false, error: 'Ability on cooldown' };
        }
        
        const botClass = bot.class || 'TITAN';
        const ability = this.abilities[botClass][abilityType];
        
        // Set cooldown
        const cooldownKey = `${bot.id}_${abilityType}`;
        this.cooldowns.set(cooldownKey, Date.now());
        
        // Execute ability
        const result = ability.execute(bot, gameContext);
        
        // Track active ability if it has duration
        if (ability.duration > 0) {
            this.activeAbilities.set(`${bot.id}_${abilityType}`, {
                bot: bot,
                ability: ability,
                startTime: Date.now(),
                duration: ability.duration,
                data: result.data
            });
        }
        
        return {
            success: true,
            ability: ability.name,
            effect: result
        };
    }

    // Update active abilities
    update(deltaTime) {
        // Update active abilities
        for (const [key, active] of this.activeAbilities) {
            const elapsed = Date.now() - active.startTime;
            
            if (elapsed >= active.duration) {
                // Ability expired, clean up
                this.endAbility(key, active);
                this.activeAbilities.delete(key);
            } else {
                // Update ongoing ability effects
                this.updateAbilityEffect(active, elapsed);
            }
        }
        
        // Update visual effects
        this.abilityEffects = this.abilityEffects.filter(effect => {
            effect.lifetime -= deltaTime;
            return effect.lifetime > 0;
        });
        
        // Update status effects
        for (const [botId, effects] of this.statusEffects) {
            const activeEffects = effects.filter(effect => {
                effect.duration -= deltaTime;
                return effect.duration > 0;
            });
            
            if (activeEffects.length > 0) {
                this.statusEffects.set(botId, activeEffects);
            } else {
                this.statusEffects.delete(botId);
            }
        }
    }

    // End an ability effect
    endAbility(key, active) {
        const [botId, abilityType] = key.split('_');
        
        // Clean up based on ability type
        switch (active.ability.name) {
            case 'Iron Wall':
                active.bot.damageReduction = 0;
                active.bot.immobile = false;
                break;
            case 'Berserker Mode':
                active.bot.damageMultiplier = 1;
                active.bot.speedMultiplier = 1;
                active.bot.vulnerabilityMultiplier = 1;
                break;
            case 'Fortress Mode':
                active.bot.immobile = false;
                active.bot.turretMode = false;
                break;
            case 'Shadow Clone':
                if (active.data.clone) {
                    active.data.clone.destroy();
                }
                break;
        }
    }

    // Update ongoing ability effects
    updateAbilityEffect(active, elapsed) {
        switch (active.ability.name) {
            case 'Repair Protocol':
                // Heal over time
                if (elapsed % 1000 < 16) { // Once per second
                    active.bot.health = Math.min(
                        active.bot.health + 20,
                        active.bot.maxHealth
                    );
                }
                break;
            case 'Blade Flurry':
                // Continuous spin damage
                active.bot.spinning = true;
                active.bot.spinDamage = 10;
                break;
        }
    }

    // TITAN Abilities
    executeHeavySlam(bot, context) {
        const radius = 150;
        const damage = 50;
        const stunDuration = 1500;
        
        // Find enemies in radius
        const enemies = context.getEnemiesInRadius(bot.position, radius);
        
        // Apply damage and stun
        enemies.forEach(enemy => {
            enemy.takeDamage(damage);
            this.applyStatusEffect(enemy, 'stun', stunDuration);
        });
        
        // Create visual effect
        this.createSlamEffect(bot.position, radius);
        
        return {
            targets: enemies.length,
            damage: damage,
            data: { radius, stunDuration }
        };
    }

    executeIronWall(bot, context) {
        bot.damageReduction = 0.8;
        bot.immobile = true;
        
        // Create shield visual
        this.createShieldEffect(bot, 3000);
        
        return {
            data: { reduction: 0.8, duration: 3000 }
        };
    }

    executeBerserkerMode(bot, context) {
        bot.damageMultiplier = 2.0;
        bot.speedMultiplier = 2.0;
        bot.vulnerabilityMultiplier = 1.5;
        
        // Create rage effect
        this.createRageEffect(bot, 5000);
        
        return {
            data: { damageBoost: 2.0, speedBoost: 2.0, vulnerability: 1.5 }
        };
    }

    // VIPER Abilities
    executeVenomStrike(bot, context) {
        bot.nextAttackEffect = {
            type: 'poison',
            damage: 10,
            duration: 5000,
            tickRate: 500
        };
        
        // Visual effect on weapon
        this.createPoisonEffect(bot, 1000);
        
        return {
            data: { poisonDamage: 10, duration: 5000 }
        };
    }

    executeShadowDash(bot, context) {
        const dashDistance = 200;
        const dashDirection = bot.facing || 0;
        
        // Calculate dash endpoint
        const endX = bot.position.x + Math.cos(dashDirection) * dashDistance;
        const endY = bot.position.y + Math.sin(dashDirection) * dashDistance;
        
        // Create trail effect
        this.createDashTrail(bot.position, { x: endX, y: endY });
        
        // Instant position change
        bot.position.x = endX;
        bot.position.y = endY;
        
        return {
            data: { distance: dashDistance, trailDamage: 20 }
        };
    }

    executeAssassinate(bot, context) {
        const target = context.getNearestEnemy(bot);
        if (!target) return { success: false, error: 'No target' };
        
        // Teleport behind target
        const angle = Math.atan2(
            target.position.y - bot.position.y,
            target.position.x - bot.position.x
        );
        bot.position.x = target.position.x - Math.cos(angle) * 50;
        bot.position.y = target.position.y - Math.sin(angle) * 50;
        
        // Deal massive damage
        const damage = 150;
        target.takeDamage(damage);
        
        // Create assassination effect
        this.createAssassinationEffect(target.position);
        
        return {
            data: { target: target.id, damage: damage }
        };
    }

    // SNIPER Abilities
    executePiercingShot(bot, context) {
        const projectile = {
            type: 'piercing',
            damage: bot.damage * 2,
            penetrations: 3,
            position: { ...bot.position },
            velocity: {
                x: Math.cos(bot.facing) * 15,
                y: Math.sin(bot.facing) * 15
            },
            owner: bot.id
        };
        
        context.createProjectile(projectile);
        
        return {
            data: { damage: projectile.damage, penetrations: 3 }
        };
    }

    executeDeployTrap(bot, context) {
        const trap = {
            type: 'trap',
            position: { ...bot.position },
            radius: 50,
            damage: 30,
            slowEffect: 0.5,
            duration: 20000,
            owner: bot.id,
            invisible: true
        };
        
        context.createHazard(trap);
        
        return {
            data: { trapId: trap.id, duration: 20000 }
        };
    }

    executeArtilleryStrike(bot, context) {
        const targetArea = bot.targetPosition || bot.position;
        const missiles = 10;
        const radius = 200;
        
        // Schedule missile strikes
        for (let i = 0; i < missiles; i++) {
            setTimeout(() => {
                const x = targetArea.x + (Math.random() - 0.5) * radius;
                const y = targetArea.y + (Math.random() - 0.5) * radius;
                
                context.createExplosion({
                    position: { x, y },
                    damage: 40,
                    radius: 60,
                    owner: bot.id
                });
                
                this.createMissileStrikeEffect({ x, y });
            }, i * 300);
        }
        
        return {
            data: { missiles: missiles, totalDamage: missiles * 40 }
        };
    }

    // TANK Abilities
    executeShieldBurst(bot, context) {
        const radius = 100;
        const pushForce = 300;
        const damage = 30;
        
        const enemies = context.getEnemiesInRadius(bot.position, radius);
        
        enemies.forEach(enemy => {
            // Calculate push direction
            const dx = enemy.position.x - bot.position.x;
            const dy = enemy.position.y - bot.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.velocity.x += (dx / distance) * pushForce;
                enemy.velocity.y += (dy / distance) * pushForce;
            }
            
            enemy.takeDamage(damage);
        });
        
        this.createBurstEffect(bot.position, radius);
        
        return {
            data: { pushed: enemies.length, damage: damage }
        };
    }

    executeRepairProtocol(bot, context) {
        const healPerSecond = 20;
        const radius = 150;
        
        // Start healing effect
        this.createHealingField(bot.position, radius, 3000);
        
        return {
            data: { healRate: healPerSecond, radius: radius }
        };
    }

    executeFortressMode(bot, context) {
        bot.immobile = true;
        bot.turretMode = true;
        bot.fireRate *= 3;
        bot.damage *= 1.5;
        bot.armor += 0.5;
        
        this.createFortressEffect(bot, 8000);
        
        return {
            data: { duration: 8000, fireRateBoost: 3, damageBoost: 1.5 }
        };
    }

    // ASSASSIN Abilities
    executeSmokeBomb(bot, context) {
        const radius = 120;
        const duration = 3000;
        
        // Create smoke cloud
        context.createHazard({
            type: 'smoke',
            position: { ...bot.position },
            radius: radius,
            duration: duration,
            effect: 'blind',
            owner: bot.id
        });
        
        // Grant stealth to bot
        bot.stealth = true;
        setTimeout(() => { bot.stealth = false; }, duration);
        
        this.createSmokeEffect(bot.position, radius, duration);
        
        return {
            data: { radius: radius, duration: duration }
        };
    }

    executeBladeFlurry(bot, context) {
        // Handled in updateAbilityEffect
        this.createSpinEffect(bot, 2000);
        
        return {
            data: { damagePerTick: 10, duration: 2000 }
        };
    }

    executeShadowClone(bot, context) {
        const clone = {
            ...bot,
            id: `${bot.id}_clone`,
            isClone: true,
            health: bot.health * 0.5,
            damage: bot.damage * 0.5,
            position: {
                x: bot.position.x + 50,
                y: bot.position.y
            }
        };
        
        context.spawnBot(clone);
        
        return {
            data: { clone: clone, duration: 10000 }
        };
    }

    // SUPPORT Abilities
    executeHealBeam(bot, context) {
        const target = context.getNearestAlly(bot);
        if (!target) return { success: false, error: 'No target' };
        
        const healAmount = 30;
        target.health = Math.min(target.health + healAmount, target.maxHealth);
        
        this.createHealBeamEffect(bot.position, target.position);
        
        return {
            data: { target: target.id, healed: healAmount }
        };
    }

    executeSpeedBoost(bot, context) {
        const radius = 200;
        const speedBoost = 1.5;
        const duration = 5000;
        
        const allies = context.getAlliesInRadius(bot.position, radius);
        
        allies.forEach(ally => {
            ally.speedMultiplier = speedBoost;
            setTimeout(() => { ally.speedMultiplier = 1; }, duration);
        });
        
        this.createSpeedBoostEffect(bot.position, radius);
        
        return {
            data: { boosted: allies.length, speedBoost: speedBoost }
        };
    }

    executeRevival(bot, context) {
        const deadAlly = context.getDeadAlly();
        if (!deadAlly) return { success: false, error: 'No dead allies' };
        
        // Revive with 50% health
        deadAlly.health = deadAlly.maxHealth * 0.5;
        deadAlly.isDead = false;
        context.respawnBot(deadAlly);
        
        this.createRevivalEffect(deadAlly.position);
        
        return {
            data: { revived: deadAlly.id, healthRestored: deadAlly.health }
        };
    }

    // Status effect management
    applyStatusEffect(bot, effectType, duration, strength = 1) {
        if (!this.statusEffects.has(bot.id)) {
            this.statusEffects.set(bot.id, []);
        }
        
        this.statusEffects.get(bot.id).push({
            type: effectType,
            duration: duration,
            strength: strength,
            appliedAt: Date.now()
        });
    }

    getStatusEffects(botId) {
        return this.statusEffects.get(botId) || [];
    }

    hasStatusEffect(botId, effectType) {
        const effects = this.getStatusEffects(botId);
        return effects.some(e => e.type === effectType);
    }

    // Visual effect creation (stubs for renderer integration)
    createSlamEffect(position, radius) {
        this.abilityEffects.push({
            type: 'slam',
            position: position,
            radius: radius,
            lifetime: 500,
            color: '#ff4444'
        });
    }

    createShieldEffect(bot, duration) {
        this.abilityEffects.push({
            type: 'shield',
            target: bot,
            lifetime: duration,
            color: '#4444ff'
        });
    }

    createRageEffect(bot, duration) {
        this.abilityEffects.push({
            type: 'rage',
            target: bot,
            lifetime: duration,
            color: '#ff0000'
        });
    }

    createPoisonEffect(bot, duration) {
        this.abilityEffects.push({
            type: 'poison',
            target: bot,
            lifetime: duration,
            color: '#00ff00'
        });
    }

    createDashTrail(start, end) {
        this.abilityEffects.push({
            type: 'trail',
            start: start,
            end: end,
            lifetime: 300,
            color: '#ff00ff'
        });
    }

    createAssassinationEffect(position) {
        this.abilityEffects.push({
            type: 'assassination',
            position: position,
            lifetime: 1000,
            color: '#ff0000'
        });
    }

    createBurstEffect(position, radius) {
        this.abilityEffects.push({
            type: 'burst',
            position: position,
            radius: radius,
            lifetime: 400,
            color: '#00ffff'
        });
    }

    createHealingField(position, radius, duration) {
        this.abilityEffects.push({
            type: 'healField',
            position: position,
            radius: radius,
            lifetime: duration,
            color: '#00ff00'
        });
    }

    createFortressEffect(bot, duration) {
        this.abilityEffects.push({
            type: 'fortress',
            target: bot,
            lifetime: duration,
            color: '#888888'
        });
    }

    createSmokeEffect(position, radius, duration) {
        this.abilityEffects.push({
            type: 'smoke',
            position: position,
            radius: radius,
            lifetime: duration,
            color: '#666666'
        });
    }

    createSpinEffect(bot, duration) {
        this.abilityEffects.push({
            type: 'spin',
            target: bot,
            lifetime: duration,
            color: '#ffff00'
        });
    }

    createHealBeamEffect(start, end) {
        this.abilityEffects.push({
            type: 'healBeam',
            start: start,
            end: end,
            lifetime: 500,
            color: '#00ff00'
        });
    }

    createSpeedBoostEffect(position, radius) {
        this.abilityEffects.push({
            type: 'speedBoost',
            position: position,
            radius: radius,
            lifetime: 1000,
            color: '#00ffff'
        });
    }

    createRevivalEffect(position) {
        this.abilityEffects.push({
            type: 'revival',
            position: position,
            lifetime: 2000,
            color: '#ffff00'
        });
    }

    createMissileStrikeEffect(position) {
        this.abilityEffects.push({
            type: 'missileStrike',
            position: position,
            lifetime: 500,
            color: '#ff8800'
        });
    }

    // Render ability effects
    renderEffects(ctx) {
        this.abilityEffects.forEach(effect => {
            ctx.save();
            ctx.globalAlpha = effect.lifetime / 1000;
            
            switch (effect.type) {
                case 'slam':
                case 'burst':
                case 'healField':
                case 'speedBoost':
                case 'smoke':
                    ctx.strokeStyle = effect.color;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(effect.position.x, effect.position.y, effect.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                    
                case 'shield':
                case 'rage':
                case 'fortress':
                case 'spin':
                    if (effect.target) {
                        ctx.strokeStyle = effect.color;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(effect.target.position.x, effect.target.position.y, 40, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    break;
                    
                case 'trail':
                case 'healBeam':
                    ctx.strokeStyle = effect.color;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(effect.start.x, effect.start.y);
                    ctx.lineTo(effect.end.x, effect.end.y);
                    ctx.stroke();
                    break;
                    
                case 'assassination':
                case 'missileStrike':
                case 'revival':
                    ctx.fillStyle = effect.color;
                    ctx.beginPath();
                    ctx.arc(effect.position.x, effect.position.y, 20, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
            
            ctx.restore();
        });
    }

    // Get ability info for UI
    getAbilityInfo(botClass, abilityType) {
        return this.abilities[botClass]?.[abilityType];
    }

    getAllAbilities(botClass) {
        return this.abilities[botClass] || {};
    }

    // Reset all cooldowns (for debugging/testing)
    resetCooldowns(botId = null) {
        if (botId) {
            // Reset specific bot's cooldowns
            for (const key of this.cooldowns.keys()) {
                if (key.startsWith(botId)) {
                    this.cooldowns.delete(key);
                }
            }
        } else {
            // Reset all cooldowns
            this.cooldowns.clear();
        }
    }

    // Clear all active abilities
    clearActiveAbilities() {
        for (const [key, active] of this.activeAbilities) {
            this.endAbility(key, active);
        }
        this.activeAbilities.clear();
        this.statusEffects.clear();
        this.abilityEffects = [];
    }
}

// Export singleton instance
export default new AbilitiesSystem();