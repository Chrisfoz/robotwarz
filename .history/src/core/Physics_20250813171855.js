import { GAME_CONFIG } from '../config/constants.js';

/**
 * Physics engine for Battle Bots Arena Evolution
 * Handles all physics calculations including movement, collisions, and projectile physics
 */
export class Physics {
    constructor() {
        // Physics constants
        this.GRAVITY = 0; // Initially disabled, can be enabled for specific projectiles
        this.AIR_DRAG = 0.99; // Air resistance coefficient
        this.GROUND_FRICTION = 0.95; // Ground friction coefficient
        this.WALL_RESTITUTION = 0.8; // Bounce energy retention
        
        // Fixed timestep settings
        this.FIXED_TIMESTEP = GAME_CONFIG.FIXED_TIMESTEP;
        this.MAX_SUBSTEPS = 5; // Maximum physics substeps per frame
        
        // Collision detection optimization
        this.spatialGrid = null;
        this.gridCellSize = 64;
        this.arenaWidth = GAME_CONFIG.CANVAS_WIDTH;
        this.arenaHeight = GAME_CONFIG.CANVAS_HEIGHT;
        
        this.initSpatialGrid();
    }

    /**
     * Initialize spatial grid for collision optimization
     */
    initSpatialGrid() {
        this.gridWidth = Math.ceil(this.arenaWidth / this.gridCellSize);
        this.gridHeight = Math.ceil(this.arenaHeight / this.gridCellSize);
        this.spatialGrid = new Array(this.gridWidth * this.gridHeight);
        
        for (let i = 0; i < this.spatialGrid.length; i++) {
            this.spatialGrid[i] = [];
        }
    }

    /**
     * Clear spatial grid for new frame
     */
    clearSpatialGrid() {
        for (let i = 0; i < this.spatialGrid.length; i++) {
            this.spatialGrid[i].length = 0;
        }
    }

    /**
     * Add entity to spatial grid
     * @param {Object} entity - Entity with x, y, radius properties
     */
    addToSpatialGrid(entity) {
        const minX = Math.max(0, Math.floor((entity.x - entity.radius) / this.gridCellSize));
        const maxX = Math.min(this.gridWidth - 1, Math.floor((entity.x + entity.radius) / this.gridCellSize));
        const minY = Math.max(0, Math.floor((entity.y - entity.radius) / this.gridCellSize));
        const maxY = Math.min(this.gridHeight - 1, Math.floor((entity.y + entity.radius) / this.gridCellSize));

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const index = y * this.gridWidth + x;
                this.spatialGrid[index].push(entity);
            }
        }
    }

    /**
     * Get potential collision candidates from spatial grid
     * @param {Object} entity - Entity to check against
     * @returns {Set} Set of potential collision candidates
     */
    getPotentialCollisions(entity) {
        const candidates = new Set();
        const minX = Math.max(0, Math.floor((entity.x - entity.radius) / this.gridCellSize));
        const maxX = Math.min(this.gridWidth - 1, Math.floor((entity.x + entity.radius) / this.gridCellSize));
        const minY = Math.max(0, Math.floor((entity.y - entity.radius) / this.gridCellSize));
        const maxY = Math.min(this.gridHeight - 1, Math.floor((entity.y + entity.radius) / this.gridCellSize));

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const index = y * this.gridWidth + x;
                const cells = this.spatialGrid[index];
                for (let i = 0; i < cells.length; i++) {
                    const candidate = cells[i];
                    if (candidate !== entity) {
                        candidates.add(candidate);
                    }
                }
            }
        }

        return candidates;
    }

    /**
     * Update entity physics with fixed timestep
     * @param {Object} entity - Entity to update
     * @param {number} deltaTime - Time delta in milliseconds
     * @param {Object} arena - Arena bounds
     */
    updateEntityPhysics(entity, deltaTime, arena) {
        if (!entity.vx && !entity.vy) return;

        // Convert deltaTime to seconds for physics calculations
        const dt = deltaTime / 1000;

        // Apply gravity if enabled
        if (entity.hasGravity && this.GRAVITY > 0) {
            entity.vy += this.GRAVITY * dt;
        }

        // Apply air drag
        if (entity.hasDrag !== false) {
            entity.vx *= Math.pow(this.AIR_DRAG, dt);
            entity.vy *= Math.pow(this.AIR_DRAG, dt);
        }

        // Apply ground friction for bots
        if (entity.hasFriction !== false) {
            entity.vx *= Math.pow(this.GROUND_FRICTION, dt);
            entity.vy *= Math.pow(this.GROUND_FRICTION, dt);
        }

        // Update position
        entity.x += entity.vx * dt * 60; // Scale for 60 FPS baseline
        entity.y += entity.vy * dt * 60;

        // Constrain to arena bounds
        this.constrainToArena(entity, arena);
    }

    /**
     * Update projectile physics with advanced features
     * @param {Object} projectile - Projectile to update
     * @param {number} deltaTime - Time delta in milliseconds
     * @param {Object} arena - Arena bounds
     */
    updateProjectilePhysics(projectile, deltaTime, arena) {
        // Convert deltaTime to seconds
        const dt = deltaTime / 1000;

        // Apply projectile-specific physics
        if (projectile.hasGravity) {
            projectile.vy += this.GRAVITY * dt;
        }

        // Apply drag based on projectile type
        const dragFactor = this.getProjectileDrag(projectile.type);
        if (dragFactor < 1) {
            projectile.vx *= Math.pow(dragFactor, dt);
            projectile.vy *= Math.pow(dragFactor, dt);
        }

        // Update position
        projectile.x += projectile.vx * dt * 60;
        projectile.y += projectile.vy * dt * 60;

        // Update angle for trail rendering
        projectile.angle = Math.atan2(projectile.vy, projectile.vx);

        // Check for arena bounds collision
        this.checkProjectileArenaCollision(projectile, arena);
    }

    /**
     * Get drag coefficient for projectile type
     * @param {string} type - Projectile type
     * @returns {number} Drag coefficient
     */
    getProjectileDrag(type) {
        switch (type) {
            case 'bullet': return 0.995;
            case 'plasma': return 0.99;
            case 'sniper': return 0.998;
            case 'multishot': return 0.992;
            case 'turret': return 0.99;
            case 'grenade': return 0.985;
            default: return 0.995;
        }
    }

    /**
     * Check and handle projectile collision with arena bounds
     * @param {Object} projectile - Projectile to check
     * @param {Object} arena - Arena bounds
     */
    checkProjectileArenaCollision(projectile, arena) {
        const margin = projectile.radius || 3;
        
        // Left/Right walls
        if (projectile.x - margin <= 0 || projectile.x + margin >= arena.width) {
            if (this.canProjectileBounce(projectile)) {
                this.bounceProjectileX(projectile, arena);
            } else {
                projectile.active = false;
            }
        }
        
        // Top/Bottom walls
        if (projectile.y - margin <= 0 || projectile.y + margin >= arena.height) {
            if (this.canProjectileBounce(projectile)) {
                this.bounceProjectileY(projectile, arena);
            } else {
                projectile.active = false;
            }
        }
    }

    /**
     * Check if projectile can bounce off walls
     * @param {Object} projectile - Projectile to check
     * @returns {boolean} True if projectile can bounce
     */
    canProjectileBounce(projectile) {
        const bouncingTypes = ['plasma', 'sniper', 'grenade'];
        return bouncingTypes.includes(projectile.type) || projectile.canBounce;
    }

    /**
     * Handle projectile bounce on X axis (vertical walls)
     * @param {Object} projectile - Projectile to bounce
     * @param {Object} arena - Arena bounds
     */
    bounceProjectileX(projectile, arena) {
        const margin = projectile.radius || 3;
        
        // Reverse X velocity with restitution
        projectile.vx = -projectile.vx * this.WALL_RESTITUTION;
        
        // Correct position to prevent wall penetration
        if (projectile.x - margin <= 0) {
            projectile.x = margin;
        } else {
            projectile.x = arena.width - margin;
        }
        
        // Apply energy loss
        this.applyBounceEnergyLoss(projectile);
    }

    /**
     * Handle projectile bounce on Y axis (horizontal walls)
     * @param {Object} projectile - Projectile to bounce
     * @param {Object} arena - Arena bounds
     */
    bounceProjectileY(projectile, arena) {
        const margin = projectile.radius || 3;
        
        // Reverse Y velocity with restitution
        projectile.vy = -projectile.vy * this.WALL_RESTITUTION;
        
        // Correct position to prevent wall penetration
        if (projectile.y - margin <= 0) {
            projectile.y = margin;
        } else {
            projectile.y = arena.height - margin;
        }
        
        // Apply energy loss
        this.applyBounceEnergyLoss(projectile);
    }

    /**
     * Apply energy loss from bouncing
     * @param {Object} projectile - Projectile that bounced
     */
    applyBounceEnergyLoss(projectile) {
        // Reduce damage on bounce
        if (projectile.damage > 1) {
            projectile.damage *= 0.9;
        }
        
        // Track bounce count
        projectile.bounceCount = (projectile.bounceCount || 0) + 1;
        
        // Deactivate after too many bounces
        if (projectile.bounceCount > 5) {
            projectile.active = false;
        }
    }

    /**
     * Calculate ricochet angle for advanced bounce physics
     * @param {Object} projectile - Projectile that hit surface
     * @param {Object} surface - Surface normal vector
     * @returns {number} New angle in radians
     */
    calculateRicochetAngle(projectile, surface) {
        const incident = { x: projectile.vx, y: projectile.vy };
        const normal = this.normalizeVector(surface);
        
        // Calculate reflection vector: R = I - 2(I·N)N
        const dotProduct = incident.x * normal.x + incident.y * normal.y;
        const reflection = {
            x: incident.x - 2 * dotProduct * normal.x,
            y: incident.y - 2 * dotProduct * normal.y
        };
        
        return Math.atan2(reflection.y, reflection.x);
    }

    /**
     * Normalize a vector
     * @param {Object} vector - Vector with x, y properties
     * @returns {Object} Normalized vector
     */
    normalizeVector(vector) {
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (magnitude === 0) return { x: 0, y: 0 };
        return { x: vector.x / magnitude, y: vector.y / magnitude };
    }

    /**
     * Check collision between two circular entities
     * @param {Object} entity1 - First entity
     * @param {Object} entity2 - Second entity
     * @returns {boolean} True if collision detected
     */
    checkCircleCollision(entity1, entity2) {
        const dx = entity2.x - entity1.x;
        const dy = entity2.y - entity1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = entity1.radius + entity2.radius;
        
        return distance < minDistance;
    }

    /**
     * Resolve collision between two bots with momentum transfer
     * @param {Object} bot1 - First bot
     * @param {Object} bot2 - Second bot
     */
    resolveBotCollision(bot1, bot2) {
        const dx = bot2.x - bot1.x;
        const dy = bot2.y - bot1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) {
            // Handle edge case of identical positions
            const angle = Math.random() * Math.PI * 2;
            const separation = (bot1.radius + bot2.radius) / 2;
            bot1.x -= Math.cos(angle) * separation;
            bot1.y -= Math.sin(angle) * separation;
            bot2.x += Math.cos(angle) * separation;
            bot2.y += Math.sin(angle) * separation;
            return;
        }

        const minDistance = bot1.radius + bot2.radius;
        const overlap = minDistance - distance;
        
        if (overlap <= 0) return;

        // Normalize collision vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Calculate masses (based on health for now)
        const mass1 = this.calculateEntityMass(bot1);
        const mass2 = this.calculateEntityMass(bot2);
        const totalMass = mass1 + mass2;
        
        // Position correction (separate objects)
        const separation1 = (overlap * mass2) / totalMass;
        const separation2 = (overlap * mass1) / totalMass;
        
        bot1.x -= nx * separation1;
        bot1.y -= ny * separation1;
        bot2.x += nx * separation2;
        bot2.y += ny * separation2;
        
        // Momentum transfer
        this.applyCollisionMomentum(bot1, bot2, nx, ny, mass1, mass2);
    }

    /**
     * Calculate effective mass of an entity
     * @param {Object} entity - Entity to calculate mass for
     * @returns {number} Calculated mass
     */
    calculateEntityMass(entity) {
        // Base mass on health and size
        const healthFactor = entity.currentStats ? entity.currentStats.health : entity.health || 100;
        const sizeFactor = entity.radius || 20;
        return (healthFactor / 100) * (sizeFactor / 20);
    }

    /**
     * Apply momentum transfer between colliding entities
     * @param {Object} entity1 - First entity
     * @param {Object} entity2 - Second entity
     * @param {number} nx - Normalized collision X vector
     * @param {number} ny - Normalized collision Y vector
     * @param {number} mass1 - Mass of first entity
     * @param {number} mass2 - Mass of second entity
     */
    applyCollisionMomentum(entity1, entity2, nx, ny, mass1, mass2) {
        // Get relative velocity
        const dvx = entity2.vx - entity1.vx;
        const dvy = entity2.vy - entity1.vy;
        
        // Calculate relative velocity in collision normal direction
        const dvn = dvx * nx + dvy * ny;
        
        // Don't resolve if velocities are separating
        if (dvn > 0) return;
        
        // Calculate collision impulse
        const restitution = 0.6; // Energy retention coefficient
        const impulse = -(1 + restitution) * dvn / (mass1 + mass2);
        
        // Apply momentum change
        const impulseMagnitude1 = impulse * mass2;
        const impulseMagnitude2 = impulse * mass1;
        
        entity1.vx -= impulseMagnitude1 * nx;
        entity1.vy -= impulseMagnitude1 * ny;
        entity2.vx += impulseMagnitude2 * nx;
        entity2.vy += impulseMagnitude2 * ny;
        
        // Apply damping to prevent jittering
        const dampingFactor = 0.8;
        entity1.vx *= dampingFactor;
        entity1.vy *= dampingFactor;
        entity2.vx *= dampingFactor;
        entity2.vy *= dampingFactor;
    }

    /**
     * Constrain entity to arena bounds
     * @param {Object} entity - Entity to constrain
     * @param {Object} arena - Arena bounds
     */
    constrainToArena(entity, arena) {
        const margin = entity.radius || 20;
        
        // Constrain X
        if (entity.x - margin < 0) {
            entity.x = margin;
            if (entity.vx < 0) entity.vx = 0;
        } else if (entity.x + margin > arena.width) {
            entity.x = arena.width - margin;
            if (entity.vx > 0) entity.vx = 0;
        }
        
        // Constrain Y
        if (entity.y - margin < 0) {
            entity.y = margin;
            if (entity.vy < 0) entity.vy = 0;
        } else if (entity.y + margin > arena.height) {
            entity.y = arena.height - margin;
            if (entity.vy > 0) entity.vy = 0;
        }
    }

    /**
     * Calculate trajectory for projectile with gravity
     * @param {number} x - Start X position
     * @param {number} y - Start Y position
     * @param {number} angle - Launch angle in radians
     * @param {number} speed - Initial speed
     * @param {number} gravity - Gravity acceleration
     * @returns {Array} Array of trajectory points
     */
    calculateTrajectory(x, y, angle, speed, gravity = 0) {
        const trajectory = [];
        const vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed;
        
        let currentX = x;
        let currentY = y;
        const timeStep = 0.016; // ~60 FPS
        
        for (let t = 0; t < 3; t += timeStep) {
            trajectory.push({ x: currentX, y: currentY });
            
            currentX += vx * timeStep * 60;
            currentY += vy * timeStep * 60;
            vy += gravity * timeStep;
            
            // Stop if out of bounds
            if (currentX < 0 || currentX > this.arenaWidth || 
                currentY < 0 || currentY > this.arenaHeight) {
                break;
            }
        }
        
        return trajectory;
    }

    /**
     * Apply force to an entity
     * @param {Object} entity - Entity to apply force to
     * @param {number} forceX - Force X component
     * @param {number} forceY - Force Y component
     * @param {number} deltaTime - Time delta in milliseconds
     */
    applyForce(entity, forceX, forceY, deltaTime) {
        const mass = this.calculateEntityMass(entity);
        const dt = deltaTime / 1000;
        
        // F = ma, so a = F/m
        const accelerationX = forceX / mass;
        const accelerationY = forceY / mass;
        
        // Update velocity
        entity.vx += accelerationX * dt * 60;
        entity.vy += accelerationY * dt * 60;
        
        // Apply maximum velocity limits
        const maxVelocity = entity.currentStats?.speed || 10;
        const currentSpeed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
        
        if (currentSpeed > maxVelocity) {
            const factor = maxVelocity / currentSpeed;
            entity.vx *= factor;
            entity.vy *= factor;
        }
    }

    /**
     * Apply impulse (instant velocity change) to an entity
     * @param {Object} entity - Entity to apply impulse to
     * @param {number} impulseX - Impulse X component
     * @param {number} impulseY - Impulse Y component
     */
    applyImpulse(entity, impulseX, impulseY) {
        const mass = this.calculateEntityMass(entity);
        
        // Apply impulse directly to velocity
        entity.vx += impulseX / mass;
        entity.vy += impulseY / mass;
    }

    /**
     * Create explosion force effect
     * @param {number} explosionX - Explosion center X
     * @param {number} explosionY - Explosion center Y
     * @param {number} force - Explosion force magnitude
     * @param {number} radius - Explosion radius
     * @param {Array} entities - Entities to affect
     */
    applyExplosionForce(explosionX, explosionY, force, radius, entities) {
        entities.forEach(entity => {
            const dx = entity.x - explosionX;
            const dy = entity.y - explosionY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < radius && distance > 0) {
                // Calculate force falloff
                const falloff = 1 - (distance / radius);
                const effectiveForce = force * falloff * falloff;
                
                // Apply force away from explosion center
                const forceX = (dx / distance) * effectiveForce;
                const forceY = (dy / distance) * effectiveForce;
                
                this.applyImpulse(entity, forceX, forceY);
            }
        });
    }

    /**
     * Update all physics systems for a frame
     * @param {Array} bots - Array of bots
     * @param {Array} projectiles - Array of projectiles
     * @param {number} deltaTime - Time delta in milliseconds
     * @param {Object} arena - Arena bounds
     */
    updatePhysics(bots, projectiles, deltaTime, arena) {
        // Clear spatial grid
        this.clearSpatialGrid();
        
        // Update bot physics
        bots.forEach(bot => {
            if (bot.isAlive()) {
                this.updateEntityPhysics(bot, deltaTime, arena);
                this.addToSpatialGrid(bot);
            }
        });
        
        // Update projectile physics
        projectiles.forEach(projectile => {
            if (projectile.active) {
                this.updateProjectilePhysics(projectile, deltaTime, arena);
                this.addToSpatialGrid(projectile);
            }
        });
        
        // Handle bot-bot collisions with spatial optimization
        this.handleBotCollisions(bots);
    }

    /**
     * Handle bot-bot collisions using spatial grid
     * @param {Array} bots - Array of bots
     */
    handleBotCollisions(bots) {
        const processedPairs = new Set();
        
        bots.forEach(bot => {
            if (!bot.isAlive()) return;
            
            const candidates = this.getPotentialCollisions(bot);
            
            candidates.forEach(other => {
                if (other === bot) return;
                
                // Only consider bot-like entities (exclude projectiles and others in spatial grid)
                const isBotLike = typeof other?.isAlive === 'function' && typeof other?.radius === 'number';
                if (!isBotLike || !other.isAlive()) return;
                
                // Create unique pair identifier
                const pairId = bot.id < other.id ? `${bot.id}-${other.id}` : `${other.id}-${bot.id}`;
                
                if (!processedPairs.has(pairId)) {
                    processedPairs.add(pairId);
                    
                    if (this.checkCircleCollision(bot, other)) {
                        this.resolveBotCollision(bot, other);
                    }
                }
            });
        });
    }

    /**
     * Get physics debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            spatialGrid: {
                width: this.gridWidth,
                height: this.gridHeight,
                cellSize: this.gridCellSize,
                totalCells: this.spatialGrid.length
            },
            constants: {
                gravity: this.GRAVITY,
                airDrag: this.AIR_DRAG,
                groundFriction: this.GROUND_FRICTION,
                wallRestitution: this.WALL_RESTITUTION
            },
            performance: {
                fixedTimestep: this.FIXED_TIMESTEP,
                maxSubsteps: this.MAX_SUBSTEPS
            }
        };
    }
}
