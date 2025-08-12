import { COLORS as GAME_COLORS } from '../config/constants.js';

/**
 * Base Particle class for visual effects
 */
export class Particle {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        this.vx = config.vx || (Math.random() - 0.5) * 2;
        this.vy = config.vy || (Math.random() - 0.5) * 2;
        this.ax = config.ax || 0;
        this.ay = config.ay || 0;
        this.size = config.size || 3;
        this.color = config.color || '#ffffff';
        this.alpha = config.alpha || 1;
        this.alphaDecay = config.alphaDecay || 0.02;
        this.sizeDecay = config.sizeDecay || 0;
        this.lifespan = config.lifespan || 60;
        this.age = 0;
        this.friction = config.friction || 0.98;
        this.gravity = config.gravity || 0;
        this.trail = config.trail || false;
        this.trailLength = config.trailLength || 5;
        this.positions = [];
        this.alive = true;
    }

    update(deltaTime) {
        if (!this.alive) return;

        this.age++;
        
        if (this.trail) {
            this.positions.push({ x: this.x, y: this.y, alpha: this.alpha });
            if (this.positions.length > this.trailLength) {
                this.positions.shift();
            }
        }

        this.vx += this.ax * deltaTime;
        this.vy += this.ay * deltaTime + this.gravity * deltaTime;
        
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        this.alpha -= this.alphaDecay * deltaTime;
        this.size = Math.max(0, this.size - this.sizeDecay * deltaTime);
        
        if (this.alpha <= 0 || this.size <= 0 || this.age >= this.lifespan) {
            this.alive = false;
        }
    }

    render(ctx) {
        if (!this.alive) return;

        ctx.save();
        
        if (this.trail && this.positions.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.positions[0].x, this.positions[0].y);
            for (let i = 1; i < this.positions.length; i++) {
                const pos = this.positions[i];
                ctx.lineTo(pos.x, pos.y);
            }
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size;
            ctx.globalAlpha = this.alpha * 0.5;
            ctx.stroke();
        }
        
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

/**
 * Spark particle for impact effects
 */
export class SparkParticle extends Particle {
    constructor(x, y, angle) {
        const speed = 3 + Math.random() * 5;
        super(x, y, {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 2,
            color: '#FFD700',
            alphaDecay: 0.03,
            friction: 0.95,
            trail: true,
            trailLength: 8,
            lifespan: 30
        });
    }

    render(ctx) {
        if (!this.alive) return;

        ctx.save();
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        super.render(ctx);
        
        ctx.restore();
    }
}

/**
 * Smoke particle for explosions
 */
export class SmokeParticle extends Particle {
    constructor(x, y) {
        super(x, y, {
            vx: (Math.random() - 0.5) * 1,
            vy: -Math.random() * 2,
            size: 10 + Math.random() * 10,
            color: `rgba(100, 100, 100, ${0.3 + Math.random() * 0.3})`,
            alphaDecay: 0.01,
            sizeDecay: -0.2,
            friction: 0.99,
            gravity: -0.05,
            lifespan: 100
        });
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.rotation += this.rotationSpeed * deltaTime;
    }

    render(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, 'rgba(80, 80, 80, 0.4)');
        gradient.addColorStop(0.5, 'rgba(100, 100, 100, 0.2)');
        gradient.addColorStop(1, 'rgba(120, 120, 120, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

/**
 * Fire particle for flame effects
 */
export class FireParticle extends Particle {
    constructor(x, y) {
        super(x, y, {
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 1,
            size: 4 + Math.random() * 4,
            alphaDecay: 0.025,
            sizeDecay: 0.1,
            friction: 0.98,
            gravity: -0.1,
            lifespan: 40
        });
        this.hue = Math.random() * 30;
    }

    render(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, `hsla(${this.hue}, 100%, 70%, 1)`);
        gradient.addColorStop(0.4, `hsla(${this.hue + 20}, 100%, 50%, 0.8)`);
        gradient.addColorStop(1, `hsla(${this.hue + 40}, 100%, 30%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

/**
 * Debris particle for destruction effects
 */
export class DebrisParticle extends Particle {
    constructor(x, y, color = '#888888') {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        super(x, y, {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 3,
            color: color,
            alphaDecay: 0.005,
            friction: 0.96,
            gravity: 0.3,
            lifespan: 120
        });
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.shape = Math.random() > 0.5 ? 'rect' : 'triangle';
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.rotation += this.rotationSpeed * deltaTime;
        
        if (this.y > 580) {
            this.vy *= -0.6;
            this.y = 580;
            this.rotationSpeed *= 0.8;
        }
    }

    render(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        if (this.shape === 'rect') {
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        } else {
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(-this.size, this.size);
            ctx.lineTo(this.size, this.size);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
}

/**
 * Energy particle for power-up effects
 */
export class EnergyParticle extends Particle {
    constructor(x, y, targetX, targetY, color = '#63b3ed') {
        const angle = Math.atan2(targetY - y, targetX - x) + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 2;
        super(x, y, {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 2,
            color: color,
            alphaDecay: 0.02,
            trail: true,
            trailLength: 10,
            lifespan: 60
        });
        this.oscillation = Math.random() * Math.PI * 2;
        this.oscillationSpeed = 0.2;
        this.oscillationAmount = 2;
    }

    update(deltaTime) {
        this.oscillation += this.oscillationSpeed * deltaTime;
        const perpX = -this.vy / Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const perpY = this.vx / Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        
        const oscOffset = Math.sin(this.oscillation) * this.oscillationAmount;
        this.x += perpX * oscOffset * deltaTime;
        this.y += perpY * oscOffset * deltaTime;
        
        super.update(deltaTime);
    }

    render(ctx) {
        if (!this.alive) return;

        ctx.save();
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.globalAlpha = this.alpha;
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, this.color);
        gradient.addColorStop(1, 'rgba(99, 179, 237, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

/**
 * Heal particle for repair effects
 */
export class HealParticle extends Particle {
    constructor(x, y) {
        super(x, y, {
            vx: (Math.random() - 0.5) * 1,
            vy: -Math.random() * 2 - 0.5,
            size: 3 + Math.random() * 2,
            color: '#68d391',
            alphaDecay: 0.015,
            friction: 0.99,
            gravity: -0.05,
            lifespan: 80
        });
        this.pulse = 0;
        this.pulseSpeed = 0.1;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.pulse += this.pulseSpeed * deltaTime;
    }

    render(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        const pulseSize = this.size * (1 + Math.sin(this.pulse) * 0.3);
        
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(this.x - pulseSize, this.y);
        ctx.lineTo(this.x + pulseSize, this.y);
        ctx.moveTo(this.x, this.y - pulseSize);
        ctx.lineTo(this.x, this.y + pulseSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

/**
 * Particle system manager
 */
export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 1000;
    }

    addParticle(particle) {
        if (this.particles.length < this.maxParticles) {
            this.particles.push(particle);
        }
    }

    createExplosion(x, y, intensity = 1) {
        const particleCount = Math.floor(20 * intensity);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            this.addParticle(new SparkParticle(x, y, angle));
        }
        
        for (let i = 0; i < particleCount / 2; i++) {
            this.addParticle(new SmokeParticle(x, y));
        }
        
        for (let i = 0; i < particleCount / 3; i++) {
            this.addParticle(new FireParticle(x, y));
        }
    }

    createImpact(x, y, color = '#FFD700') {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.5;
            this.addParticle(new SparkParticle(x, y, angle));
        }
    }

    createDestruction(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.addParticle(new DebrisParticle(x, y, color));
        }
        
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            this.addParticle(new SparkParticle(x, y, angle));
        }
    }

    createEnergyBurst(x, y, targetX, targetY, count = 10) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.addParticle(new EnergyParticle(x, y, targetX, targetY));
            }, i * 50);
        }
    }

    createHealEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            const offsetX = x + (Math.random() - 0.5) * 20;
            const offsetY = y + (Math.random() - 0.5) * 20;
            this.addParticle(new HealParticle(offsetX, offsetY));
        }
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            
            if (!particle.alive) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        for (const particle of this.particles) {
            particle.render(ctx);
        }
        
        ctx.restore();
    }

    clear() {
        this.particles = [];
    }

    getParticleCount() {
        return this.particles.length;
    }
}