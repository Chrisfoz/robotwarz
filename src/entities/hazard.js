import { GAME_CONFIG, COLORS } from '../config/constants.js';

/**
 * Base Hazard class for all arena hazards
 * Provides common functionality for area-based environmental dangers
 */
export class Hazard {
    constructor(x, y, config = {}) {
        // Basic properties
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.active = true;
        this.type = config.type || 'generic';
        
        // Area of effect
        this.radius = config.radius || 40;
        this.shape = config.shape || 'circle'; // 'circle', 'rectangle'
        this.width = config.width || this.radius * 2;
        this.height = config.height || this.radius * 2;
        
        // Damage properties
        this.damage = config.damage || 10;
        this.damageType = config.damageType || 'hazard';
        this.damageInterval = config.damageInterval || 500; // ms between damage ticks
        this.lastDamageTime = new Map(); // Track last damage time per bot
        
        // Visual properties
        this.color = config.color || COLORS.WARNING;
        this.warningColor = config.warningColor || COLORS.DAMAGE;
        this.opacity = config.opacity || 0.6;
        this.pulseSpeed = config.pulseSpeed || 0.002;
        this.pulseAmount = config.pulseAmount || 0.2;
        
        // Lifecycle
        this.lifespan = config.lifespan || Infinity; // ms, Infinity = permanent
        this.createdAt = Date.now();
        this.warmupTime = config.warmupTime || 1000; // ms before hazard becomes active
        
        // Animation
        this.animationTime = 0;
        this.warningAnimation = 0;
        
        // Physics interaction
        this.applyForce = config.applyForce || false;
        this.forceStrength = config.forceStrength || 0;
        this.slowEffect = config.slowEffect || 1.0; // Speed multiplier when in hazard
    }
    
    /**
     * Update hazard state
     * @param {number} deltaTime - Time since last update in ms
     * @param {Object} game - Game instance for accessing bots and physics
     */
    update(deltaTime, game) {
        // Update animation
        this.animationTime += deltaTime;
        this.warningAnimation += this.pulseSpeed * deltaTime;
        
        // Check lifespan
        const age = Date.now() - this.createdAt;
        if (this.lifespan !== Infinity && age > this.lifespan) {
            this.active = false;
            return;
        }
        
        // Check if hazard is active (past warmup)
        if (age < this.warmupTime) {
            return; // Still warming up
        }
        
        // Apply effects to bots in range
        if (game && game.bots) {
            game.bots.forEach(bot => {
                if (bot.isAlive() && this.isEntityInHazard(bot)) {
                    this.applyEffect(bot, deltaTime, game);
                }
            });
        }
    }
    
    /**
     * Check if entity is within hazard area
     * @param {Object} entity - Entity to check (bot or projectile)
     * @returns {boolean} True if entity is in hazard
     */
    isEntityInHazard(entity) {
        if (this.shape === 'circle') {
            const dx = entity.x - this.x;
            const dy = entity.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < this.radius + (entity.radius || 0);
        } else if (this.shape === 'rectangle') {
            const halfWidth = this.width / 2;
            const halfHeight = this.height / 2;
            const entityRadius = entity.radius || 0;
            
            return entity.x + entityRadius > this.x - halfWidth &&
                   entity.x - entityRadius < this.x + halfWidth &&
                   entity.y + entityRadius > this.y - halfHeight &&
                   entity.y - entityRadius < this.y + halfHeight;
        }
        return false;
    }
    
    /**
     * Apply hazard effects to entity
     * @param {Object} entity - Entity affected by hazard
     * @param {number} deltaTime - Time since last update
     * @param {Object} game - Game instance
     */
    applyEffect(entity, deltaTime, game) {
        // Apply damage at intervals
        const now = Date.now();
        const lastDamage = this.lastDamageTime.get(entity.id) || 0;
        
        if (now - lastDamage >= this.damageInterval) {
            this.lastDamageTime.set(entity.id, now);
            entity.takeDamage(this.damage, this.damageType);
            
            // Visual feedback
            if (game && game.effectsSystem) {
                game.effectsSystem.addHazardDamage(entity.x, entity.y, this.type);
            }
        }
        
        // Apply movement effects
        if (this.slowEffect < 1.0) {
            // Temporarily slow the entity
            entity.currentStats.speed *= this.slowEffect;
        }
        
        // Apply force if configured
        if (this.applyForce && game && game.physics) {
            const dx = entity.x - this.x;
            const dy = entity.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const forceX = (dx / distance) * this.forceStrength;
                const forceY = (dy / distance) * this.forceStrength;
                game.physics.applyForce(entity, forceX, forceY, deltaTime);
            }
        }
    }
    
    /**
     * Get visual opacity based on current state
     * @returns {number} Current opacity value
     */
    getOpacity() {
        const age = Date.now() - this.createdAt;
        
        // Fade in during warmup
        if (age < this.warmupTime) {
            return (age / this.warmupTime) * this.opacity * 0.5;
        }
        
        // Pulse when active
        const pulse = Math.sin(this.warningAnimation) * this.pulseAmount;
        return Math.min(1, this.opacity + pulse);
    }
    
    /**
     * Check if hazard is still warming up
     * @returns {boolean} True if in warmup phase
     */
    isWarming() {
        return (Date.now() - this.createdAt) < this.warmupTime;
    }
    
    /**
     * Clean up hazard resources
     */
    destroy() {
        this.active = false;
        this.lastDamageTime.clear();
    }
}

/**
 * Lava Pool - Continuous damage area
 */
class LavaPool extends Hazard {
    constructor(x, y, config = {}) {
        super(x, y, {
            type: 'lava',
            damage: config.damage || 15,
            damageInterval: config.damageInterval || 500,
            radius: config.radius || 60,
            color: '#ff4444',
            warningColor: '#ff8888',
            opacity: 0.7,
            pulseAmount: 0.15,
            lifespan: config.lifespan || Infinity,
            warmupTime: config.warmupTime || 2000,
            ...config
        });
        
        // Lava-specific properties
        this.bubbles = [];
        this.maxBubbles = 5;
        this.bubbleSpawnRate = 0.002;
    }
    
    update(deltaTime, game) {
        super.update(deltaTime, game);
        
        // Spawn bubbles
        if (Math.random() < this.bubbleSpawnRate * deltaTime) {
            this.spawnBubble();
        }
        
        // Update bubbles
        this.bubbles = this.bubbles.filter(bubble => {
            bubble.life -= deltaTime * 0.001;
            bubble.y -= bubble.speed * deltaTime * 0.06;
            bubble.radius *= 0.99;
            return bubble.life > 0;
        });
    }
    
    spawnBubble() {
        if (this.bubbles.length < this.maxBubbles) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.radius * 0.8;
            
            this.bubbles.push({
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                radius: 3 + Math.random() * 5,
                speed: 0.5 + Math.random() * 0.5,
                life: 1.0
            });
        }
    }
}

/**
 * Energy Field - Slows movement and drains energy
 */
class EnergyField extends Hazard {
    constructor(x, y, config = {}) {
        super(x, y, {
            type: 'energy',
            damage: config.damage || 5,
            damageInterval: config.damageInterval || 250,
            radius: config.radius || 80,
            color: '#6666ff',
            warningColor: '#9999ff',
            opacity: 0.4,
            pulseAmount: 0.3,
            pulseSpeed: 0.003,
            slowEffect: config.slowEffect || 0.5,
            lifespan: config.lifespan || Infinity,
            warmupTime: config.warmupTime || 1500,
            ...config
        });
        
        // Energy field specific
        this.energyDrain = config.energyDrain || 10; // Energy drained per second
        this.lightningBolts = [];
        this.lightningSpawnRate = 0.003;
    }
    
    applyEffect(entity, deltaTime, game) {
        super.applyEffect(entity, deltaTime, game);
        
        // Drain energy
        if (entity.energy !== undefined) {
            entity.energy = Math.max(0, entity.energy - this.energyDrain * (deltaTime / 1000));
        }
        
        // Chance to create lightning effect
        if (Math.random() < this.lightningSpawnRate * deltaTime) {
            this.createLightning(entity);
        }
    }
    
    createLightning(target) {
        this.lightningBolts.push({
            startX: this.x,
            startY: this.y,
            endX: target.x,
            endY: target.y,
            life: 0.2,
            segments: this.generateLightningPath(this.x, this.y, target.x, target.y)
        });
    }
    
    generateLightningPath(x1, y1, x2, y2) {
        const segments = [];
        const steps = 5;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            
            // Add random offset for lightning effect
            const offset = (1 - Math.abs(t - 0.5) * 2) * 15;
            segments.push({
                x: x + (Math.random() - 0.5) * offset,
                y: y + (Math.random() - 0.5) * offset
            });
        }
        
        return segments;
    }
    
    update(deltaTime, game) {
        super.update(deltaTime, game);
        
        // Update lightning bolts
        this.lightningBolts = this.lightningBolts.filter(bolt => {
            bolt.life -= deltaTime * 0.005;
            return bolt.life > 0;
        });
    }
}

/**
 * Crusher - Periodic high damage in area
 */
class Crusher extends Hazard {
    constructor(x, y, config = {}) {
        super(x, y, {
            type: 'crusher',
            damage: config.damage || 50,
            damageInterval: config.crushInterval || 3000,
            shape: 'rectangle',
            width: config.width || 100,
            height: config.height || 100,
            color: '#666666',
            warningColor: '#ff0000',
            opacity: 0.8,
            lifespan: config.lifespan || Infinity,
            warmupTime: 0, // Crushers start immediately
            ...config
        });
        
        // Crusher specific
        this.crushInterval = config.crushInterval || 3000;
        this.crushDuration = config.crushDuration || 500;
        this.warningDuration = config.warningDuration || 1000;
        this.lastCrushTime = Date.now();
        this.state = 'idle'; // 'idle', 'warning', 'crushing', 'retracting'
        this.crushProgress = 0;
        this.shadowOffset = 50;
    }
    
    update(deltaTime, game) {
        const now = Date.now();
        const timeSinceLastCrush = now - this.lastCrushTime;
        
        // State machine for crusher
        switch (this.state) {
            case 'idle':
                if (timeSinceLastCrush >= this.crushInterval - this.warningDuration) {
                    this.state = 'warning';
                }
                break;
                
            case 'warning':
                if (timeSinceLastCrush >= this.crushInterval) {
                    this.state = 'crushing';
                    this.lastCrushTime = now;
                    this.performCrush(game);
                }
                break;
                
            case 'crushing':
                this.crushProgress = Math.min(1, (now - this.lastCrushTime) / this.crushDuration);
                if (this.crushProgress >= 1) {
                    this.state = 'retracting';
                }
                break;
                
            case 'retracting':
                this.crushProgress = Math.max(0, 1 - ((now - this.lastCrushTime - this.crushDuration) / 500));
                if (this.crushProgress <= 0) {
                    this.state = 'idle';
                }
                break;
        }
        
        // Update animation
        this.animationTime += deltaTime;
        
        // Don't apply continuous damage - crusher only damages on impact
    }
    
    performCrush(game) {
        if (!game || !game.bots) return;
        
        // Deal massive damage to all bots in crusher area
        game.bots.forEach(bot => {
            if (bot.isAlive() && this.isEntityInHazard(bot)) {
                bot.takeDamage(this.damage, this.damageType);
                
                // Apply knockback
                if (game.physics) {
                    const forceX = (Math.random() - 0.5) * 200;
                    const forceY = (Math.random() - 0.5) * 200;
                    game.physics.applyImpulse(bot, forceX, forceY);
                }
                
                // Visual feedback
                if (game.effectsSystem) {
                    game.effectsSystem.addCrushImpact(this.x, this.y);
                }
            }
        });
    }
    
    getWarningIntensity() {
        if (this.state === 'warning') {
            const timeUntilCrush = this.crushInterval - (Date.now() - this.lastCrushTime);
            return 1 - (timeUntilCrush / this.warningDuration);
        }
        return 0;
    }
}

/**
 * Turret - Automated projectile hazard
 */
class Turret extends Hazard {
    constructor(x, y, config = {}) {
        super(x, y, {
            type: 'turret',
            damage: config.damage || 20,
            radius: config.radius || 30,
            color: '#444444',
            warningColor: '#ff6666',
            opacity: 1.0,
            lifespan: config.lifespan || Infinity,
            warmupTime: config.warmupTime || 2000,
            ...config
        });
        
        // Turret specific
        this.range = config.range || 250;
        this.fireRate = config.fireRate || 1500; // ms between shots
        this.lastFireTime = 0;
        this.rotationSpeed = config.rotationSpeed || 0.05;
        this.angle = 0;
        this.targetAngle = 0;
        this.barrelLength = 25;
        this.projectileSpeed = config.projectileSpeed || 8;
        this.tracking = config.tracking !== false; // Track nearest target
        this.currentTarget = null;
        
        // Don't apply damage directly - turret fires projectiles
        this.damage = 0;
    }
    
    update(deltaTime, game) {
        this.animationTime += deltaTime;
        
        // Check lifespan
        const age = Date.now() - this.createdAt;
        if (this.lifespan !== Infinity && age > this.lifespan) {
            this.active = false;
            return;
        }
        
        // Skip if warming up
        if (age < this.warmupTime) return;
        
        // Find and track target
        if (this.tracking && game && game.bots) {
            this.updateTarget(game.bots);
        }
        
        // Rotate towards target
        if (this.currentTarget) {
            this.targetAngle = Math.atan2(
                this.currentTarget.y - this.y,
                this.currentTarget.x - this.x
            );
        }
        
        // Smooth rotation
        const angleDiff = this.normalizeAngle(this.targetAngle - this.angle);
        this.angle += angleDiff * this.rotationSpeed;
        
        // Fire projectile
        const now = Date.now();
        if (this.currentTarget && now - this.lastFireTime >= this.fireRate) {
            this.fire(game);
            this.lastFireTime = now;
        }
    }
    
    updateTarget(bots) {
        let nearestBot = null;
        let nearestDistance = this.range;
        
        bots.forEach(bot => {
            if (bot.isAlive()) {
                const dx = bot.x - this.x;
                const dy = bot.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestBot = bot;
                }
            }
        });
        
        this.currentTarget = nearestBot;
    }
    
    fire(game) {
        if (!game || !game.projectiles) return;
        
        // Calculate barrel end position
        const barrelX = this.x + Math.cos(this.angle) * this.barrelLength;
        const barrelY = this.y + Math.sin(this.angle) * this.barrelLength;
        
        // Import projectile class dynamically to avoid circular dependency
        import('./Projectile.js').then(({ TurretShot }) => {
            const projectile = new TurretShot(
                barrelX,
                barrelY,
                this.angle,
                this.damage || 20,
                'hazard_turret'
            );
            
            game.projectiles.push(projectile);
            
            // Muzzle flash effect
            if (game.effectsSystem) {
                game.effectsSystem.addMuzzleFlash(barrelX, barrelY, this.angle);
            }
        });
    }
    
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }
    
    // Override to prevent damage application (turret uses projectiles)
    applyEffect(entity, deltaTime, game) {
        // Turrets don't apply direct effects
    }
}

/**
 * Mine - Triggered explosion hazard
 */
class Mine extends Hazard {
    constructor(x, y, config = {}) {
        super(x, y, {
            type: 'mine',
            damage: config.damage || 75,
            radius: config.radius || 25,
            color: '#ff0000',
            warningColor: '#ffaa00',
            opacity: 0.8,
            lifespan: config.lifespan || Infinity,
            warmupTime: config.warmupTime || 2000,
            ...config
        });
        
        // Mine specific
        this.triggerRadius = config.triggerRadius || 40;
        this.explosionRadius = config.explosionRadius || 100;
        this.explosionForce = config.explosionForce || 300;
        this.triggered = false;
        this.exploded = false;
        this.triggerDelay = config.triggerDelay || 500; // ms before explosion
        this.triggerTime = 0;
        
        // Visual
        this.blinkSpeed = 0.005;
        this.blinkIntensity = 0;
    }
    
    update(deltaTime, game) {
        this.animationTime += deltaTime;
        
        // Check lifespan
        const age = Date.now() - this.createdAt;
        if (this.lifespan !== Infinity && age > this.lifespan) {
            this.active = false;
            return;
        }
        
        // Skip if warming up
        if (age < this.warmupTime) return;
        
        // Check for explosion
        if (this.triggered && !this.exploded) {
            const timeSinceTrigger = Date.now() - this.triggerTime;
            
            // Increase blink rate as explosion approaches
            this.blinkIntensity = timeSinceTrigger / this.triggerDelay;
            
            if (timeSinceTrigger >= this.triggerDelay) {
                this.explode(game);
            }
        } else if (!this.triggered && game && game.bots) {
            // Check for nearby bots to trigger
            game.bots.forEach(bot => {
                if (bot.isAlive()) {
                    const dx = bot.x - this.x;
                    const dy = bot.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < this.triggerRadius + bot.radius) {
                        this.trigger();
                    }
                }
            });
        }
    }
    
    trigger() {
        if (!this.triggered && !this.exploded) {
            this.triggered = true;
            this.triggerTime = Date.now();
        }
    }
    
    explode(game) {
        if (this.exploded) return;
        
        this.exploded = true;
        this.active = false;
        
        if (!game) return;
        
        // Deal damage to all bots in explosion radius
        if (game.bots) {
            game.bots.forEach(bot => {
                if (bot.isAlive()) {
                    const dx = bot.x - this.x;
                    const dy = bot.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < this.explosionRadius) {
                        // Damage falloff based on distance
                        const falloff = 1 - (distance / this.explosionRadius);
                        const damage = this.damage * falloff;
                        
                        bot.takeDamage(damage, 'explosion');
                    }
                }
            });
        }
        
        // Apply explosion force
        if (game.physics) {
            const entities = [...(game.bots || []), ...(game.projectiles || [])];
            game.physics.applyExplosionForce(
                this.x,
                this.y,
                this.explosionForce,
                this.explosionRadius,
                entities
            );
        }
        
        // Visual effect
        if (game.effectsSystem) {
            game.effectsSystem.addExplosion(this.x, this.y, this.explosionRadius);
        }
    }
    
    getOpacity() {
        if (this.triggered) {
            // Blink when triggered
            const blink = Math.sin(this.animationTime * this.blinkSpeed * (1 + this.blinkIntensity * 10));
            return this.opacity * (0.5 + blink * 0.5);
        }
        return super.getOpacity();
    }
}

/**
 * Hazard Factory - Creates hazards with proper configuration
 */
export class HazardFactory {
    static createLavaPool(x, y, config = {}) {
        return new LavaPool(x, y, config);
    }
    
    static createEnergyField(x, y, config = {}) {
        return new EnergyField(x, y, config);
    }
    
    static createCrusher(x, y, config = {}) {
        return new Crusher(x, y, config);
    }
    
    static createTurret(x, y, config = {}) {
        return new Turret(x, y, config);
    }
    
    static createMine(x, y, config = {}) {
        return new Mine(x, y, config);
    }
    
    /**
     * Create a random hazard at specified position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Array} allowedTypes - Array of allowed hazard types
     * @returns {Hazard} Created hazard instance
     */
    static createRandom(x, y, allowedTypes = ['lava', 'energy', 'crusher', 'turret', 'mine']) {
        const type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
        
        switch (type) {
            case 'lava':
                return this.createLavaPool(x, y);
            case 'energy':
                return this.createEnergyField(x, y);
            case 'crusher':
                return this.createCrusher(x, y);
            case 'turret':
                return this.createTurret(x, y);
            case 'mine':
                return this.createMine(x, y);
            default:
                return new Hazard(x, y);
        }
    }
    
    /**
     * Create hazards for a level/arena
     * @param {Object} arena - Arena configuration
     * @param {Array} hazardConfig - Array of hazard configurations
     * @returns {Array} Array of created hazards
     */
    static createLevelHazards(arena, hazardConfig) {
        const hazards = [];
        
        hazardConfig.forEach(config => {
            let hazard;
            
            switch (config.type) {
                case 'lava':
                    hazard = this.createLavaPool(config.x, config.y, config);
                    break;
                case 'energy':
                    hazard = this.createEnergyField(config.x, config.y, config);
                    break;
                case 'crusher':
                    hazard = this.createCrusher(config.x, config.y, config);
                    break;
                case 'turret':
                    hazard = this.createTurret(config.x, config.y, config);
                    break;
                case 'mine':
                    hazard = this.createMine(config.x, config.y, config);
                    break;
            }
            
            if (hazard) {
                hazards.push(hazard);
            }
        });
        
        return hazards;
    }
}

/**
 * HazardSystem - Manages all hazards in the game
 */
export class HazardSystem {
    constructor() {
        this.hazards = [];
        this.factory = new HazardFactory();
        this.spawnTimer = 0;
        this.spawnInterval = 10000; // Spawn new hazard every 10 seconds
    }

    update(deltaTime) {
        // Update spawn timer
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnRandomHazard();
            this.spawnTimer = 0;
        }

        // Update all hazards
        for (let i = this.hazards.length - 1; i >= 0; i--) {
            const hazard = this.hazards[i];
            hazard.update(deltaTime);
            
            if (!hazard.active) {
                this.hazards.splice(i, 1);
            }
        }
    }

    render(ctx) {
        this.hazards.forEach(hazard => hazard.render(ctx));
    }

    spawnRandomHazard() {
        const types = ['lava', 'energy', 'crusher', 'turret', 'mine'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = Math.random() * 700 + 50;
        const y = Math.random() * 500 + 50;
        
        const hazard = this.factory.createHazard(type, x, y);
        if (hazard) {
            this.hazards.push(hazard);
        }
    }

    spawnHazard(type, x, y, config = {}) {
        const hazard = this.factory.createHazard(type, x, y, config);
        if (hazard) {
            this.hazards.push(hazard);
            return hazard;
        }
        return null;
    }

    getHazards() {
        return this.hazards;
    }

    clear() {
        this.hazards = [];
        this.spawnTimer = 0;
    }

    checkCollision(entity) {
        for (const hazard of this.hazards) {
            if (hazard.active && hazard.checkCollision(entity)) {
                return hazard;
            }
        }
        return null;
    }
}

// Export all hazard types
export { LavaPool, EnergyField, Crusher, Turret, Mine };