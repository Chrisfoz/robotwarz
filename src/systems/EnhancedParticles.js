/**
 * EnhancedParticles - Advanced particle effects with trails and physics
 */
export class EnhancedParticles {
    constructor() {
        this.particles = [];
        this.maxParticles = 500;
        this.gravity = 0.3;
        this.wind = 0;
    }

    /**
     * Create explosion effect
     */
    createExplosion(x, y, config = {}) {
        const {
            count = 30,
            speed = 8,
            color = '#ff6b6b',
            secondaryColor = '#ffa500',
            size = 4,
            lifetime = 1500,
            spread = Math.PI * 2
        } = config;

        // Core explosion particles
        for (let i = 0; i < count; i++) {
            const angle = (spread / count) * i + Math.random() * 0.2;
            const velocity = speed * (0.5 + Math.random() * 0.5);
            
            this.addParticle({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: size + Math.random() * 2,
                color: Math.random() > 0.5 ? color : secondaryColor,
                lifetime,
                type: 'explosion',
                gravity: true,
                fade: true,
                shrink: true,
                trail: true,
                glow: true
            });
        }

        // Smoke particles
        for (let i = 0; i < count / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = speed * 0.3;
            
            this.addParticle({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - 1,
                size: 8 + Math.random() * 4,
                color: `rgba(100, 100, 100, 0.6)`,
                lifetime: lifetime * 1.5,
                type: 'smoke',
                gravity: false,
                fade: true,
                grow: true,
                wind: true
            });
        }

        // Sparks
        for (let i = 0; i < count * 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = speed * 1.5 * (0.5 + Math.random() * 0.5);
            
            this.addParticle({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: 1,
                color: '#ffff00',
                lifetime: lifetime * 0.5,
                type: 'spark',
                gravity: true,
                fade: true,
                trail: true,
                sparkle: true
            });
        }
    }

    /**
     * Create impact effect
     */
    createImpact(x, y, config = {}) {
        const {
            count = 15,
            speed = 5,
            color = '#56CCF2',
            size = 3
        } = config;

        // Impact burst
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const velocity = speed * (0.8 + Math.random() * 0.4);
            
            this.addParticle({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size,
                color,
                lifetime: 500,
                type: 'impact',
                gravity: false,
                fade: true,
                shrink: true,
                glow: true
            });
        }

        // Shockwave ring
        this.addParticle({
            x,
            y,
            vx: 0,
            vy: 0,
            size: 1,
            maxSize: 50,
            color: `rgba(86, 204, 242, 0.5)`,
            lifetime: 300,
            type: 'shockwave',
            gravity: false,
            fade: true,
            expand: true
        });
    }

    /**
     * Create projectile trail
     */
    createTrail(x, y, config = {}) {
        const {
            color = '#ffa500',
            size = 2,
            vx = 0,
            vy = 0
        } = config;

        this.addParticle({
            x: x + (Math.random() - 0.5) * 2,
            y: y + (Math.random() - 0.5) * 2,
            vx: vx * 0.1 + (Math.random() - 0.5) * 0.5,
            vy: vy * 0.1 + (Math.random() - 0.5) * 0.5,
            size,
            color,
            lifetime: 300,
            type: 'trail',
            gravity: false,
            fade: true,
            shrink: true
        });
    }

    /**
     * Create healing effect
     */
    createHeal(x, y, config = {}) {
        const count = config.count || 20;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const radius = 20 + Math.random() * 10;
            
            this.addParticle({
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: -Math.cos(angle) * 2,
                vy: -Math.sin(angle) * 2 - 1,
                size: 3,
                color: '#68d391',
                lifetime: 1000,
                type: 'heal',
                gravity: false,
                fade: true,
                pulse: true,
                orbit: { x, y, radius: radius }
            });
        }
    }

    /**
     * Create damage numbers
     */
    createDamageNumber(x, y, damage, config = {}) {
        const {
            color = damage > 50 ? '#ff0000' : damage > 25 ? '#ffa500' : '#ffff00',
            size = damage > 50 ? 24 : damage > 25 ? 20 : 16,
            critical = false
        } = config;

        this.addParticle({
            x: x + (Math.random() - 0.5) * 10,
            y,
            vx: (Math.random() - 0.5) * 2,
            vy: -3,
            size,
            color: critical ? '#ff00ff' : color,
            text: critical ? `${damage}!` : `${damage}`,
            lifetime: 1000,
            type: 'text',
            gravity: false,
            fade: true,
            bounce: critical
        });
    }

    /**
     * Add particle to system
     */
    addParticle(config) {
        if (this.particles.length >= this.maxParticles) {
            // Remove oldest particle
            this.particles.shift();
        }

        const particle = {
            ...config,
            age: 0,
            alpha: 1,
            initialSize: config.size,
            trail: config.trail ? [] : null
        };

        this.particles.push(particle);
        return particle;
    }

    /**
     * Update all particles
     */
    update(deltaTime) {
        const dt = deltaTime / 16.67; // Normalize to 60 FPS

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Age particle
            p.age += deltaTime;
            
            // Remove dead particles
            if (p.age >= p.lifetime) {
                this.particles.splice(i, 1);
                continue;
            }

            // Store trail position
            if (p.trail) {
                p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
                if (p.trail.length > 10) {
                    p.trail.shift();
                }
            }

            // Apply physics
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Gravity
            if (p.gravity) {
                p.vy += this.gravity * dt;
            }

            // Wind
            if (p.wind) {
                p.vx += this.wind * dt;
            }

            // Drag
            p.vx *= 0.99;
            p.vy *= 0.99;

            // Fade
            if (p.fade) {
                p.alpha = 1 - (p.age / p.lifetime);
            }

            // Size changes
            if (p.shrink) {
                p.size = p.initialSize * (1 - p.age / p.lifetime);
            } else if (p.grow) {
                p.size = p.initialSize * (1 + p.age / p.lifetime);
            } else if (p.expand) {
                p.size = p.initialSize + (p.maxSize - p.initialSize) * (p.age / p.lifetime);
            }

            // Pulse effect
            if (p.pulse) {
                p.size = p.initialSize * (1 + Math.sin(p.age * 0.01) * 0.3);
            }

            // Bounce effect
            if (p.bounce) {
                p.y += Math.sin(p.age * 0.01) * 0.5;
            }

            // Orbit effect
            if (p.orbit) {
                const angle = p.age * 0.005;
                p.x = p.orbit.x + Math.cos(angle) * p.orbit.radius;
                p.y = p.orbit.y + Math.sin(angle) * p.orbit.radius - p.age * 0.05;
            }

            // Sparkle effect
            if (p.sparkle) {
                p.alpha = 0.5 + Math.random() * 0.5;
            }
        }
    }

    /**
     * Render all particles
     */
    render(ctx) {
        ctx.save();

        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;

            // Draw trail
            if (p.trail && p.trail.length > 1) {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size * 0.5;
                ctx.beginPath();
                
                for (let i = 0; i < p.trail.length; i++) {
                    const point = p.trail[i];
                    ctx.globalAlpha = point.alpha * (i / p.trail.length) * 0.5;
                    
                    if (i === 0) {
                        ctx.moveTo(point.x, point.y);
                    } else {
                        ctx.lineTo(point.x, point.y);
                    }
                }
                
                ctx.stroke();
                ctx.globalAlpha = p.alpha;
            }

            // Draw glow
            if (p.glow) {
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(p.x - p.size * 2, p.y - p.size * 2, p.size * 4, p.size * 4);
            }

            // Draw particle
            if (p.type === 'text') {
                ctx.font = `bold ${p.size}px Arial`;
                ctx.fillStyle = p.color;
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.textAlign = 'center';
                ctx.strokeText(p.text, p.x, p.y);
                ctx.fillText(p.text, p.x, p.y);
            } else if (p.type === 'shockwave') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.stroke();
            } else if (p.type === 'smoke') {
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }

    /**
     * Get particle count
     */
    getCount() {
        return this.particles.length;
    }

    /**
     * Set wind effect
     */
    setWind(strength) {
        this.wind = strength;
    }

    /**
     * Set gravity
     */
    setGravity(strength) {
        this.gravity = strength;
    }
}

// Export singleton
export default new EnhancedParticles();