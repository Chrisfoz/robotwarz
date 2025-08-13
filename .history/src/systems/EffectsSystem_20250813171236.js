export class EffectsSystem {
    constructor(canvas) {
        if (!canvas) {
            throw new Error('EffectsSystem requires a canvas element');
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Particle pools
        this.particlePools = {
            sparks: [],
            explosion: [],
            energy: [],
            debris: [],
            smoke: []
        };
        
        // Active effects
        this.activeEffects = [];
        // Back-compat alias for callers expecting 'effects'
        this.effects = this.activeEffects;
        
        // Screen shake
        this.screenShake = {
            intensity: 0,
            duration: 0,
            decay: 0.95
        };
        
        // Initialize particle pools
        this.initializeParticlePools();
        
        // Effect configurations
        this.effectConfigs = {
            explosion: {
                particleCount: 30,
                baseSpeed: 8,
                speedVariance: 4,
                baseSize: 4,
                sizeVariance: 3,
                lifetime: 800,
                colors: ['#FF6B1A', '#FFD93D', '#FF4444', '#FF8800', '#FFAA00'],
                glowIntensity: 1.5
            },
            hitSpark: {
                particleCount: 12,
                baseSpeed: 6,
                speedVariance: 3,
                baseSize: 2,
                sizeVariance: 1,
                lifetime: 400,
                colors: ['#FFE066', '#FFD93D', '#FFF8DC', '#FFFACD'],
                glowIntensity: 1.2
            },
            energyAura: {
                particleCount: 20,
                baseSpeed: 2,
                speedVariance: 1,
                baseSize: 3,
                sizeVariance: 2,
                lifetime: 1000,
                colors: ['#00D9FF', '#00A8E8', '#0077CC', '#66E0FF'],
                glowIntensity: 1.8
            },
            dashStreak: {
                particleCount: 15,
                baseSpeed: 1,
                speedVariance: 0.5,
                baseSize: 4,
                sizeVariance: 2,
                lifetime: 600,
                colors: ['#00FF88', '#00CC66', '#00AA55'],
                glowIntensity: 1.4
            }
        };
    }
    
    initializeParticlePools() {
        const poolSize = 200;
        
        Object.keys(this.particlePools).forEach(type => {
            for (let i = 0; i < poolSize; i++) {
                this.particlePools[type].push(this.createParticle());
            }
        });
    }
    
    createParticle() {
        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            size: 0,
            color: '#FFFFFF',
            alpha: 1,
            lifetime: 0,
            maxLifetime: 0,
            active: false,
            type: null,
            rotation: 0,
            rotationSpeed: 0,
            scale: 1,
            gravity: 0,
            friction: 0.98,
            glow: false,
            trail: []
        };
    }
    
    getParticle(type) {
        const pool = this.particlePools[type];
        let particle = pool.find(p => !p.active);
        
        if (!particle) {
            particle = this.createParticle();
            pool.push(particle);
        }
        
        particle.active = true;
        particle.type = type;
        particle.trail = [];
        return particle;
    }
    
    createExplosion(x, y, intensity = 1) {
        const config = this.effectConfigs.explosion;
        const particleCount = Math.floor(config.particleCount * intensity);
        
        // Create flash effect
        this.activeEffects.push({
            type: 'flash',
            x,
            y,
            radius: 20 * intensity,
            maxRadius: 60 * intensity,
            alpha: 0.8,
            color: '#FFAA00',
            lifetime: 200
        });
        
        // Create shockwave
        this.activeEffects.push({
            type: 'shockwave',
            x,
            y,
            radius: 0,
            maxRadius: 100 * intensity,
            alpha: 0.6,
            lifetime: 300,
            color: '#FF6B1A'
        });
        
        // Create explosion particles
        for (let i = 0; i < particleCount; i++) {
            const particle = this.getParticle('explosion');
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const speed = config.baseSpeed + Math.random() * config.speedVariance;
            
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed * intensity;
            particle.vy = Math.sin(angle) * speed * intensity;
            particle.size = (config.baseSize + Math.random() * config.sizeVariance) * intensity;
            particle.color = config.colors[Math.floor(Math.random() * config.colors.length)];
            particle.lifetime = config.lifetime;
            particle.maxLifetime = config.lifetime;
            particle.gravity = 0.3;
            particle.friction = 0.96;
            particle.glow = true;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.2;
        }
        
        // Create smoke particles
        for (let i = 0; i < particleCount / 2; i++) {
            const particle = this.getParticle('smoke');
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            
            particle.x = x + (Math.random() - 0.5) * 20;
            particle.y = y + (Math.random() - 0.5) * 20;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed - 1;
            particle.size = 8 + Math.random() * 6;
            particle.color = '#333333';
            particle.lifetime = 1000;
            particle.maxLifetime = 1000;
            particle.gravity = -0.1;
            particle.friction = 0.98;
        }
        
        // Add screen shake
        this.addScreenShake(10 * intensity, 300);
    }
    
    createHitSpark(x, y, angle) {
        const config = this.effectConfigs.hitSpark;
        
        // Create spark particles
        for (let i = 0; i < config.particleCount; i++) {
            const particle = this.getParticle('sparks');
            const sparkAngle = angle + (Math.random() - 0.5) * Math.PI * 0.5;
            const speed = config.baseSpeed + Math.random() * config.speedVariance;
            
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(sparkAngle) * speed;
            particle.vy = Math.sin(sparkAngle) * speed;
            particle.size = config.baseSize + Math.random() * config.sizeVariance;
            particle.color = config.colors[Math.floor(Math.random() * config.colors.length)];
            particle.lifetime = config.lifetime;
            particle.maxLifetime = config.lifetime;
            particle.gravity = 0.4;
            particle.friction = 0.94;
            particle.glow = true;
        }
        
        // Create impact flash
        this.activeEffects.push({
            type: 'flash',
            x,
            y,
            radius: 10,
            maxRadius: 25,
            alpha: 0.6,
            color: '#FFFACD',
            lifetime: 100
        });
        
        // Small screen shake
        this.addScreenShake(3, 100);
    }
    
    createEnergyAura(x, y, radius = 50) {
        const config = this.effectConfigs.energyAura;
        
        // Create energy ring
        this.activeEffects.push({
            type: 'energyRing',
            x,
            y,
            radius: radius * 0.8,
            maxRadius: radius * 1.2,
            alpha: 0.8,
            lifetime: 1000,
            color: '#00D9FF',
            pulseSpeed: 0.05
        });
        
        // Create orbiting particles
        for (let i = 0; i < config.particleCount; i++) {
            const particle = this.getParticle('energy');
            const angle = (Math.PI * 2 * i) / config.particleCount;
            const orbitRadius = radius + Math.random() * 20;
            
            particle.x = x + Math.cos(angle) * orbitRadius;
            particle.y = y + Math.sin(angle) * orbitRadius;
            particle.vx = Math.cos(angle + Math.PI / 2) * config.baseSpeed;
            particle.vy = Math.sin(angle + Math.PI / 2) * config.baseSpeed;
            particle.size = config.baseSize + Math.random() * config.sizeVariance;
            particle.color = config.colors[Math.floor(Math.random() * config.colors.length)];
            particle.lifetime = config.lifetime;
            particle.maxLifetime = config.lifetime;
            particle.glow = true;
            particle.trail = [];
            
            // Orbital data
            particle.orbitCenter = { x, y };
            particle.orbitRadius = orbitRadius;
            particle.orbitAngle = angle;
            particle.orbitSpeed = 0.03 + Math.random() * 0.02;
        }
    }
    
    createDashStreak(startX, startY, endX, endY) {
        const config = this.effectConfigs.dashStreak;
        const distance = Math.hypot(endX - startX, endY - startY);
        const angle = Math.atan2(endY - startY, endX - startX);
        
        // Create trail effect
        this.activeEffects.push({
            type: 'dashTrail',
            startX,
            startY,
            endX,
            endY,
            width: 30,
            alpha: 0.7,
            lifetime: 400,
            color: '#00FF88'
        });
        
        // Create particle trail
        const particlesPerUnit = 0.2;
        const particleCount = Math.floor(distance * particlesPerUnit);
        
        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;
            const particle = this.getParticle('energy');
            
            particle.x = startX + (endX - startX) * t + (Math.random() - 0.5) * 10;
            particle.y = startY + (endY - startY) * t + (Math.random() - 0.5) * 10;
            particle.vx = (Math.random() - 0.5) * 2;
            particle.vy = (Math.random() - 0.5) * 2;
            particle.size = config.baseSize + Math.random() * config.sizeVariance;
            particle.color = config.colors[Math.floor(Math.random() * config.colors.length)];
            particle.lifetime = config.lifetime * (1 - t * 0.5);
            particle.maxLifetime = particle.lifetime;
            particle.glow = true;
        }
    }
    
    createDebris(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const particle = this.getParticle('debris');
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 4;
            
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed - 2;
            particle.size = 3 + Math.random() * 3;
            particle.color = Math.random() > 0.5 ? '#666666' : '#888888';
            particle.lifetime = 1000;
            particle.maxLifetime = 1000;
            particle.gravity = 0.5;
            particle.friction = 0.95;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.3;
        }
    }
    
    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }
    
    updateParticles(deltaTime) {
        Object.values(this.particlePools).forEach(pool => {
            pool.forEach(particle => {
                if (!particle.active) return;
                
                // Update lifetime
                particle.lifetime -= deltaTime;
                if (particle.lifetime <= 0) {
                    particle.active = false;
                    return;
                }
                
                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // Apply physics
                particle.vy += particle.gravity || 0;
                particle.vx *= particle.friction || 1;
                particle.vy *= particle.friction || 1;
                
                // Update rotation
                particle.rotation += particle.rotationSpeed || 0;
                
                // Update alpha
                particle.alpha = particle.lifetime / particle.maxLifetime;
                
                // Update trail
                if (particle.trail && particle.trail.length > 0 || particle.type === 'energy') {
                    particle.trail.push({ x: particle.x, y: particle.y });
                    if (particle.trail.length > 10) {
                        particle.trail.shift();
                    }
                }
                
                // Special behavior for energy particles
                if (particle.orbitCenter) {
                    particle.orbitAngle += particle.orbitSpeed;
                    particle.x = particle.orbitCenter.x + Math.cos(particle.orbitAngle) * particle.orbitRadius;
                    particle.y = particle.orbitCenter.y + Math.sin(particle.orbitAngle) * particle.orbitRadius;
                }
            });
        });
    }
    
    updateEffects(deltaTime) {
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.lifetime -= deltaTime;
            
            if (effect.lifetime <= 0) {
                return false;
            }
            
            // Update effect-specific properties
            switch (effect.type) {
                case 'shockwave':
                    effect.radius += (effect.maxRadius - effect.radius) * 0.2;
                    effect.alpha *= 0.95;
                    break;
                    
                case 'flash':
                    effect.radius += (effect.maxRadius - effect.radius) * 0.3;
                    effect.alpha *= 0.9;
                    break;
                    
                case 'energyRing':
                    effect.radius = effect.maxRadius + Math.sin(Date.now() * effect.pulseSpeed) * 10;
                    effect.alpha = 0.6 + Math.sin(Date.now() * effect.pulseSpeed * 2) * 0.2;
                    break;
                    
                case 'dashTrail':
                    effect.alpha *= 0.92;
                    break;
            }
            
            return true;
        });
    }
    
    updateScreenShake(deltaTime) {
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            this.screenShake.intensity *= this.screenShake.decay;
            
            if (this.screenShake.duration <= 0) {
                this.screenShake.intensity = 0;
            }
        }
    }
    
    update(deltaTime) {
        this.updateParticles(deltaTime);
        this.updateEffects(deltaTime);
        this.updateScreenShake(deltaTime);
    }
    
    renderParticle(particle) {
        if (!particle.active || particle.alpha <= 0) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = particle.alpha;
        
        // Render trail
        if (particle.trail && particle.trail.length > 1) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = particle.color;
            this.ctx.lineWidth = particle.size * 0.5;
            this.ctx.lineCap = 'round';
            
            particle.trail.forEach((point, index) => {
                if (index === 0) {
                    this.ctx.moveTo(point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            });
            
            this.ctx.stroke();
        }
        
        // Apply glow effect
        if (particle.glow) {
            this.ctx.shadowBlur = particle.size * 2;
            this.ctx.shadowColor = particle.color;
        }
        
        // Translate and rotate
        this.ctx.translate(particle.x, particle.y);
        if (particle.rotation) {
            this.ctx.rotate(particle.rotation);
        }
        
        // Draw particle
        if (particle.type === 'debris') {
            // Draw as rectangle
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        } else if (particle.type === 'smoke') {
            // Draw as gradient circle
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
            gradient.addColorStop(0, `${particle.color}88`);
            gradient.addColorStop(1, `${particle.color}00`);
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Draw as circle
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    renderEffect(effect) {
        this.ctx.save();
        this.ctx.globalAlpha = effect.alpha;
        
        switch (effect.type) {
            case 'shockwave':
                this.ctx.strokeStyle = effect.color;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                break;
                
            case 'flash':
                const gradient = this.ctx.createRadialGradient(
                    effect.x, effect.y, 0,
                    effect.x, effect.y, effect.radius
                );
                gradient.addColorStop(0, effect.color);
                gradient.addColorStop(1, `${effect.color}00`);
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'energyRing':
                this.ctx.strokeStyle = effect.color;
                this.ctx.lineWidth = 4;
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = effect.color;
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Inner glow
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.globalAlpha = effect.alpha * 0.5;
                this.ctx.stroke();
                break;
                
            case 'dashTrail':
                const trailGradient = this.ctx.createLinearGradient(
                    effect.startX, effect.startY,
                    effect.endX, effect.endY
                );
                trailGradient.addColorStop(0, `${effect.color}00`);
                trailGradient.addColorStop(0.5, effect.color);
                trailGradient.addColorStop(1, `${effect.color}00`);
                
                this.ctx.strokeStyle = trailGradient;
                this.ctx.lineWidth = effect.width;
                this.ctx.lineCap = 'round';
                this.ctx.shadowBlur = 20;
                this.ctx.shadowColor = effect.color;
                
                this.ctx.beginPath();
                this.ctx.moveTo(effect.startX, effect.startY);
                this.ctx.lineTo(effect.endX, effect.endY);
                this.ctx.stroke();
                break;
        }
        
        this.ctx.restore();
    }
    
    render() {
        // Apply screen shake
        if (this.screenShake.intensity > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake.intensity;
            const shakeY = (Math.random() - 0.5) * this.screenShake.intensity;
            this.ctx.save();
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Render effects in order
        this.activeEffects.filter(e => e.type === 'dashTrail').forEach(e => this.renderEffect(e));
        this.activeEffects.filter(e => e.type === 'energyRing').forEach(e => this.renderEffect(e));
        
        // Render particles
        Object.values(this.particlePools).forEach(pool => {
            pool.forEach(particle => this.renderParticle(particle));
        });
        
        // Render other effects
        this.activeEffects.filter(e => 
            e.type !== 'dashTrail' && e.type !== 'energyRing'
        ).forEach(e => this.renderEffect(e));
        
        // Restore screen shake transform
        if (this.screenShake.intensity > 0) {
            this.ctx.restore();
        }
    }
    
    // Utility method to create custom effects
    createCustomEffect(x, y, type, options = {}) {
        switch (type) {
            case 'powerup':
                this.createEnergyAura(x, y, options.radius || 40);
                break;
                
            case 'victory':
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        this.createExplosion(
                            x + (Math.random() - 0.5) * 100,
                            y + (Math.random() - 0.5) * 100,
                            0.5 + Math.random() * 0.5
                        );
                    }, i * 200);
                }
                break;
                
            case 'charge':
                const particleCount = options.particleCount || 30;
                for (let i = 0; i < particleCount; i++) {
                    const particle = this.getParticle('energy');
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 50 + Math.random() * 50;
                    
                    particle.x = x + Math.cos(angle) * distance;
                    particle.y = y + Math.sin(angle) * distance;
                    particle.vx = -Math.cos(angle) * 3;
                    particle.vy = -Math.sin(angle) * 3;
                    particle.size = 2 + Math.random() * 2;
                    particle.color = options.color || '#00D9FF';
                    particle.lifetime = 500 + Math.random() * 500;
                    particle.maxLifetime = particle.lifetime;
                    particle.glow = true;
                }
                break;
        }
    }
    
    // Clear all effects (useful for game state changes)
    clearAllEffects() {
        Object.values(this.particlePools).forEach(pool => {
            pool.forEach(particle => {
                particle.active = false;
            });
        });
        
        this.activeEffects = [];
        this.screenShake.intensity = 0;
        this.screenShake.duration = 0;
    }
    
    // Hazard-specific effects
    addHazardDamage(x, y, hazardType) {
        const config = {
            lava: { color: '#ff4444', particleCount: 8, baseSpeed: 2 },
            energy: { color: '#6666ff', particleCount: 5, baseSpeed: 1.5 },
            explosion: { color: '#ff8800', particleCount: 12, baseSpeed: 4 }
        };
        
        const settings = config[hazardType] || config.explosion;
        
        for (let i = 0; i < settings.particleCount; i++) {
            const particle = this.getParticle('sparks');
            const angle = Math.random() * Math.PI * 2;
            const speed = settings.baseSpeed + Math.random() * 2;
            
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed - 1;
            particle.size = 2 + Math.random() * 2;
            particle.color = settings.color;
            particle.lifetime = 300 + Math.random() * 200;
            particle.maxLifetime = particle.lifetime;
            particle.glow = true;
            particle.gravity = 0.2;
            particle.friction = 0.98;
        }
    }
    
    addCrushImpact(x, y) {
        // Screen shake for crusher impact
        this.addScreenShake(15, 400);
        
        // Dust cloud effect
        for (let i = 0; i < 20; i++) {
            const particle = this.getParticle('smoke');
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            
            particle.x = x + (Math.random() - 0.5) * 40;
            particle.y = y + (Math.random() - 0.5) * 40;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.size = 10 + Math.random() * 10;
            particle.color = '#888888';
            particle.lifetime = 600;
            particle.maxLifetime = 600;
            particle.alpha = 0.6;
            particle.friction = 0.95;
        }
        
        // Debris particles
        this.createDebris(x, y, 10);
    }
    
    addMuzzleFlash(x, y, angle) {
        // Create muzzle flash effect
        this.activeEffects.push({
            type: 'flash',
            x: x,
            y: y,
            angle: angle,
            radius: 5,
            maxRadius: 20,
            alpha: 1,
            lifetime: 100,
            color: '#ffff00'
        });
        
        // Spark particles
        for (let i = 0; i < 3; i++) {
            const particle = this.getParticle('sparks');
            const spread = (Math.random() - 0.5) * 0.3;
            const particleAngle = angle + spread;
            const speed = 4 + Math.random() * 2;
            
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(particleAngle) * speed;
            particle.vy = Math.sin(particleAngle) * speed;
            particle.size = 1 + Math.random();
            particle.color = '#ffee00';
            particle.lifetime = 200;
            particle.maxLifetime = 200;
            particle.glow = true;
        }
    }
    
    addExplosion(x, y, radius = 100) {
        // Use existing explosion method
        this.createExplosion(x, y, radius / 100);
    }
    
    addMeleeHit(x, y) {
        // Use existing hit sparks
        this.createHitSparks(x, y);
    }
    
    addProjectileHit(x, y, projectileType) {
        // Use appropriate effect based on projectile type
        if (projectileType === 'plasma' || projectileType === 'energy') {
            this.createEnergyAura(x, y, 20);
        } else {
            this.createHitSparks(x, y);
        }
    }
    
    addAbilityActivation(x, y, abilityType) {
        // Create ability-specific activation effects
        switch (abilityType) {
            case 'damageReduction':
                this.createEnergyAura(x, y, 50);
                break;
            case 'dash':
                this.createDashTrail(x, y, x, y);
                break;
            case 'berserk':
                this.createExplosion(x, y, 0.3);
                this.createEnergyAura(x, y, 40);
                break;
            case 'cloak':
                this.createCustomEffect(x, y, 'charge', { color: '#8855ff', particleCount: 20 });
                break;
            case 'deployShield':
                this.createShockwave(x, y, 60);
                break;
            default:
                this.createEnergyAura(x, y, 30);
        }
    }
}
