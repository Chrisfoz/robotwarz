import { BOT_CLASSES } from '../config/constants.js';

export class Bot {
    constructor(x, y, className, playerId = 0, upgrades = []) {
        const botClass = BOT_CLASSES[className];
        if (!botClass) {
            throw new Error(`Unknown bot class: ${className}`);
        }

        // Basic properties
        this.id = Math.random().toString(36).substr(2, 9);
        this.playerId = playerId;
        this.className = className;
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.radius = 20;
        
        // Movement
        this.vx = 0;
        this.vy = 0;
        this.targetX = x;
        this.targetY = y;
        
        // Stats from base class (will be modified by upgrades)
        this.baseStats = { ...botClass.baseStats };
        this.currentStats = this.calculateStats(upgrades);
        
        // Health and energy
        this.health = this.currentStats.health;
        this.maxHealth = this.currentStats.health;
        this.energy = this.currentStats.energy;
        this.maxEnergy = this.currentStats.energy;
        this.shield = 0;
        this.maxShield = 0;
        
        // Combat
        this.lastMeleeTime = 0;
        this.lastRangedTime = 0;
        this.isAttacking = false;
        this.target = null;
        
        // Ability
        this.ability = botClass.ability;
        this.abilityActive = false;
        this.abilityStartTime = 0;
        this.lastAbilityTime = 0;
        this.abilityDuration = botClass.abilityDuration;
        this.abilityCooldown = botClass.abilityCooldown;
        
        // Visual
        this.color = botClass.color;
        this.description = botClass.description;
        this.name = botClass.name;
        
        // Status effects
        this.statusEffects = new Map();
        this.invulnerable = false;
        this.cloaked = false;
        
        // Upgrades
        this.upgrades = upgrades;
        this.temporaryEffects = [];
        
        // Statistics
        this.stats = {
            damageDealt: 0,
            damageTaken: 0,
            kills: 0,
            deaths: 0
        };
    }

    calculateStats(upgrades) {
        let stats = { ...this.baseStats };
        
        // Apply permanent upgrades
        upgrades.forEach(upgradeId => {
            // Find and apply upgrade effects
            // This will be implemented with the upgrade system
        });
        
        // Apply temporary effects
        this.temporaryEffects?.forEach(effect => {
            if (effect.active) {
                Object.keys(effect.modifiers).forEach(stat => {
                    if (stat.includes('Damage') || stat.includes('speed')) {
                        stats[stat] *= effect.modifiers[stat];
                    } else {
                        stats[stat] += effect.modifiers[stat];
                    }
                });
            }
        });
        
        return stats;
    }

    update(deltaTime, arena) {
        // Movement
        this.updateMovement(deltaTime);
        
        // Energy regeneration
        this.energy = Math.min(this.maxEnergy, this.energy + deltaTime * 0.01);
        
        // Shield regeneration
        if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + deltaTime * 0.005);
        }
        
        // Health regeneration (if has regen upgrade)
        if (this.currentStats.regen) {
            this.health = Math.min(this.maxHealth, this.health + this.currentStats.regen * deltaTime * 0.001);
        }
        
        // Update ability
        this.updateAbility(deltaTime);
        
        // Update status effects
        this.updateStatusEffects(deltaTime);
        
        // Update temporary effects
        this.updateTemporaryEffects(deltaTime);
        
        // Arena bounds will be handled by Physics system
    }

    updateMovement(deltaTime) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
            // Calculate desired velocity
            const speed = this.currentStats.speed;
            const desiredVx = (dx / dist) * speed;
            const desiredVy = (dy / dist) * speed;
            
            // Apply acceleration (lerp towards desired velocity)
            const accel = this.currentStats.acceleration || 0.1;
            this.vx = this.vx * (1 - accel) + desiredVx * accel;
            this.vy = this.vy * (1 - accel) + desiredVy * accel;
            
            // Update angle for visual rotation
            this.angle = Math.atan2(dy, dx);
        } else {
            // Stop when close to target (apply braking)
            this.vx *= 0.9;
            this.vy *= 0.9;
        }
        
        // Position will be updated by Physics system
        // The Physics system will use this.vx and this.vy to update this.x and this.y
    }

    updateAbility(deltaTime) {
        if (this.abilityActive) {
            const elapsed = Date.now() - this.abilityStartTime;
            if (elapsed > this.abilityDuration) {
                this.deactivateAbility();
            }
        }
    }

    updateStatusEffects(deltaTime) {
        for (const [effect, data] of this.statusEffects) {
            data.duration -= deltaTime;
            if (data.duration <= 0) {
                this.statusEffects.delete(effect);
            }
        }
    }

    updateTemporaryEffects(deltaTime) {
        this.temporaryEffects = this.temporaryEffects.filter(effect => {
            effect.duration -= deltaTime;
            if (effect.duration <= 0) {
                effect.active = false;
                return false;
            }
            return true;
        });
        
        // Recalculate stats if effects changed
        if (this.temporaryEffects.some(e => !e.active)) {
            this.currentStats = this.calculateStats(this.upgrades);
        }
    }

    constrainToArena(arena) {
        const margin = this.radius;
        this.x = Math.max(margin, Math.min(arena.width - margin, this.x));
        this.y = Math.max(margin, Math.min(arena.height - margin, this.y));
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    takeDamage(amount, damageType = 'normal') {
        if (this.invulnerable) return 0;
        
        // Apply armor reduction
        let finalDamage = amount * (1 - this.currentStats.armor);
        
        // Apply to shield first
        if (this.shield > 0) {
            const shieldDamage = Math.min(this.shield, finalDamage);
            this.shield -= shieldDamage;
            finalDamage -= shieldDamage;
        }
        
        // Apply remaining to health
        this.health -= finalDamage;
        this.stats.damageTaken += finalDamage;
        
        // Check for death
        if (this.health <= 0) {
            this.health = 0;
            this.stats.deaths++;
            return -1; // Bot died
        }
        
        return finalDamage;
    }

    heal(amount) {
        const healed = Math.min(amount, this.maxHealth - this.health);
        this.health += healed;
        return healed;
    }

    canUseMelee() {
        const now = Date.now();
        const cooldown = this.currentStats.meleeCooldown * (this.currentStats.cooldownReduction || 1);
        return now - this.lastMeleeTime > cooldown;
    }

    canUseRanged() {
        const now = Date.now();
        const cooldown = this.currentStats.rangedCooldown * (this.currentStats.cooldownReduction || 1);
        return now - this.lastRangedTime > cooldown;
    }

    canUseAbility() {
        const now = Date.now();
        const cooldown = this.abilityCooldown * (this.currentStats.abilityCooldown || 1);
        return !this.abilityActive && now - this.lastAbilityTime > cooldown;
    }

    useMelee() {
        if (this.canUseMelee()) {
            this.lastMeleeTime = Date.now();
            this.isAttacking = true;
            return true;
        }
        return false;
    }

    useRanged() {
        if (this.canUseRanged()) {
            this.lastRangedTime = Date.now();
            return true;
        }
        return false;
    }

    activateAbility() {
        if (this.canUseAbility()) {
            this.abilityActive = true;
            this.abilityStartTime = Date.now();
            this.lastAbilityTime = Date.now();
            
            // Apply ability effects based on type
            this.applyAbilityEffects();
            return true;
        }
        return false;
    }

    deactivateAbility() {
        this.abilityActive = false;
        // Remove ability effects
        this.removeAbilityEffects();
    }

    applyAbilityEffects() {
        switch (this.ability) {
            case 'damageReduction':
                this.currentStats.armor += 0.5; // 50% additional armor
                break;
            case 'dash':
                this.currentStats.speed *= 3;
                break;
            case 'berserk':
                this.currentStats.meleeDamage *= 2;
                this.currentStats.speed *= 1.5;
                break;
            case 'cloak':
                this.cloaked = true;
                break;
            case 'deployShield':
                this.maxShield = 50;
                this.shield = 50;
                break;
            // More abilities to be implemented
        }
    }

    removeAbilityEffects() {
        switch (this.ability) {
            case 'damageReduction':
                this.currentStats = this.calculateStats(this.upgrades);
                break;
            case 'dash':
                this.currentStats = this.calculateStats(this.upgrades);
                break;
            case 'berserk':
                this.currentStats = this.calculateStats(this.upgrades);
                break;
            case 'cloak':
                this.cloaked = false;
                break;
            case 'deployShield':
                // Shield stays but doesn't regenerate
                break;
        }
    }

    addTemporaryEffect(effect) {
        this.temporaryEffects.push({
            ...effect,
            active: true
        });
        this.currentStats = this.calculateStats(this.upgrades);
    }

    getDisplayStats() {
        return {
            health: Math.ceil(this.health),
            maxHealth: this.maxHealth,
            shield: Math.ceil(this.shield),
            maxShield: this.maxShield,
            energy: Math.ceil(this.energy),
            maxEnergy: this.maxEnergy,
            kills: this.stats.kills,
            damage: this.stats.damageDealt
        };
    }

    isAlive() {
        return this.health > 0;
    }

    distanceTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    angleTo(other) {
        return Math.atan2(other.y - this.y, other.x - this.x);
    }
}