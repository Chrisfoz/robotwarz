export class Projectile {
    constructor(x, y, angle, damage, speed, ownerId, type = 'bullet', piercing = false) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.damage = damage;
        this.speed = speed;
        this.ownerId = ownerId;
        this.type = type;
        this.piercing = piercing;
        this.radius = this.getRadiusByType();
        this.lifetime = 3000; // 3 seconds
        this.age = 0;
        this.active = true;
        this.hitTargets = new Set(); // For piercing projectiles
        
        // Visual properties
        this.color = this.getColorByType();
        this.trail = [];
        this.maxTrailLength = type === 'sniper' ? 15 : type === 'plasma' ? 10 : 5;
        this.glowIntensity = type === 'plasma' ? 1.5 : type === 'sniper' ? 1.2 : 1.0;
    }

    getRadiusByType() {
        switch (this.type) {
            case 'bullet': return 3;
            case 'plasma': return 5;
            case 'sniper': return 2;
            case 'multishot': return 2.5;
            case 'turret': return 3;
            default: return 3;
        }
    }

    getColorByType() {
        switch (this.type) {
            case 'bullet': return '#f6e05e';
            case 'plasma': return '#9f7aea';
            case 'sniper': return '#fc8181';
            case 'multishot': return '#ed8936';
            case 'turret': return '#38b2ac';
            default: return '#ffffff';
        }
    }

    update(deltaTime, arena) {
        if (!this.active) return;

        // Position update will be handled by Physics system
        // Update trail after position has been updated by physics
        this.updateTrail();

        // Update age
        this.age += deltaTime;
        if (this.age >= this.lifetime) {
            this.active = false;
        }

        // Arena bounds collision will be handled by Physics system
        // The Physics system will set this.active = false or handle bouncing
    }

    updateTrail() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    checkBoundsCollision(arena) {
        return (
            this.x - this.radius <= 0 ||
            this.x + this.radius >= arena.width ||
            this.y - this.radius <= 0 ||
            this.y + this.radius >= arena.height
        );
    }

    bounce(arena) {
        // Simple bounce physics
        if (this.x - this.radius <= 0 || this.x + this.radius >= arena.width) {
            this.vx = -this.vx * 0.8; // Lose some speed on bounce
            this.x = Math.max(this.radius, Math.min(arena.width - this.radius, this.x));
        }
        if (this.y - this.radius <= 0 || this.y + this.radius >= arena.height) {
            this.vy = -this.vy * 0.8;
            this.y = Math.max(this.radius, Math.min(arena.height - this.radius, this.y));
        }
        this.angle = Math.atan2(this.vy, this.vx);
    }

    checkCollision(target) {
        if (!this.active) return false;
        
        // Don't hit the owner
        if (target.id === this.ownerId) return false;
        
        // Check if already hit (for piercing projectiles)
        if (this.hitTargets.has(target.id)) return false;

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < this.radius + target.radius;
    }

    onHit(target) {
        // Apply damage to target
        const damageDealt = target.takeDamage(this.damage, this.type);
        
        // Mark as hit for piercing projectiles
        this.hitTargets.add(target.id);
        
        // Deactivate if not piercing
        if (!this.piercing) {
            this.active = false;
        }
        
        return damageDealt;
    }

    isActive() {
        return this.active;
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();

        // Enhanced trail with gradient
        if (this.trail.length > 1) {
            // Draw trail segments with fading opacity
            for (let i = 1; i < this.trail.length; i++) {
                const alpha = (i / this.trail.length) * 0.6;
                const width = this.radius * (i / this.trail.length);
                
                // Create gradient for each segment
                const gradient = ctx.createLinearGradient(
                    this.trail[i-1].x, this.trail[i-1].y,
                    this.trail[i].x, this.trail[i].y
                );
                gradient.addColorStop(0, `${this.color}00`);
                gradient.addColorStop(1, `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = width;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.trail[i-1].x, this.trail[i-1].y);
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
                ctx.stroke();
            }
        }

        // Draw projectile with enhanced glow
        ctx.translate(this.x, this.y);
        
        // Outer glow
        if (this.glowIntensity > 1) {
            const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 3);
            glowGradient.addColorStop(0, this.color);
            glowGradient.addColorStop(0.5, `${this.color}80`);
            glowGradient.addColorStop(1, `${this.color}00`);
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Glow effect
        ctx.shadowBlur = 10 * this.glowIntensity;
        ctx.shadowColor = this.color;
        
        // Main projectile with gradient
        const mainGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        mainGradient.addColorStop(0, '#ffffff');
        mainGradient.addColorStop(0.5, this.color);
        mainGradient.addColorStop(1, this.color);
        
        ctx.fillStyle = mainGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright core with pulse effect
        const pulseScale = 1 + Math.sin(Date.now() * 0.01) * 0.2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.4 * pulseScale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Special projectile types
export class SniperShot extends Projectile {
    constructor(x, y, angle, damage, ownerId) {
        super(x, y, angle, damage * 1.5, 15, ownerId, 'sniper', true); // Piercing
        this.maxTrailLength = 10;
    }
}

export class MultiShot extends Projectile {
    static create(x, y, angle, damage, ownerId, count = 5) {
        const projectiles = [];
        const spreadAngle = Math.PI / 8; // 22.5 degrees spread
        
        for (let i = 0; i < count; i++) {
            const offsetAngle = angle - spreadAngle / 2 + (spreadAngle / (count - 1)) * i;
            projectiles.push(new Projectile(x, y, offsetAngle, damage * 0.7, 8, ownerId, 'multishot'));
        }
        
        return projectiles;
    }
}

export class TurretShot extends Projectile {
    constructor(x, y, angle, damage, ownerId) {
        super(x, y, angle, damage, 8, ownerId, 'turret');
        this.lifetime = 2000; // Shorter lifetime for turret shots
    }

}

/**
 * ProjectileSystem - Manages all projectiles in the game
 */
export class ProjectileSystem {
    constructor() {
        this.projectiles = [];
    }

    add(projectile) {
        this.projectiles.push(projectile);
    }

    update(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaTime);
            
            if (!projectile.active) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        this.projectiles.forEach(projectile => projectile.render(ctx));
    }

    getProjectiles() {
        return this.projectiles;
    }

    clear() {
        this.projectiles = [];
    }

    checkCollision(entity) {
        for (const projectile of this.projectiles) {
            if (projectile.active && projectile.checkCollision(entity)) {
                return projectile;
            }
        }
        return null;
    }
}
