export class CollisionSystem {
    constructor() {
        this.quadTree = null;
        this.collisionPairs = new Set();
    }

    checkCollisions(bots, projectiles, hazards) {
        this.collisionPairs.clear();
        
        // Bot vs Bot collisions
        for (let i = 0; i < bots.length; i++) {
            for (let j = i + 1; j < bots.length; j++) {
                if (this.checkBotBotCollision(bots[i], bots[j])) {
                    this.resolveBotBotCollision(bots[i], bots[j]);
                }
            }
        }
        
        // Projectile vs Bot collisions (handled in Game.js update)
        // Just return collision data for now
        const collisions = {
            botBot: [],
            projectileBot: [],
            botHazard: []
        };
        
        return collisions;
    }

    checkBotBotCollision(bot1, bot2) {
        if (!bot1.isAlive() || !bot2.isAlive()) return false;
        
        const dx = bot2.x - bot1.x;
        const dy = bot2.y - bot1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = bot1.radius + bot2.radius;
        
        return distance < minDistance;
    }

    resolveBotBotCollision(bot1, bot2) {
        const dx = bot2.x - bot1.x;
        const dy = bot2.y - bot1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = bot1.radius + bot2.radius;
        
        if (distance === 0) {
            // Bots are exactly on top of each other, push them apart randomly
            const angle = Math.random() * Math.PI * 2;
            bot1.x -= Math.cos(angle) * minDistance / 2;
            bot1.y -= Math.sin(angle) * minDistance / 2;
            bot2.x += Math.cos(angle) * minDistance / 2;
            bot2.y += Math.sin(angle) * minDistance / 2;
        } else {
            // Calculate overlap
            const overlap = minDistance - distance;
            
            // Normalize the direction vector
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Calculate push based on mass (heavier bots push lighter ones more)
            const mass1 = bot1.currentStats.health / 100;
            const mass2 = bot2.currentStats.health / 100;
            const totalMass = mass1 + mass2;
            
            const push1 = (overlap * mass2) / totalMass;
            const push2 = (overlap * mass1) / totalMass;
            
            // Apply separation
            bot1.x -= nx * push1;
            bot1.y -= ny * push1;
            bot2.x += nx * push2;
            bot2.y += ny * push2;
            
            // Apply knockback velocity
            const knockbackForce = 0.5;
            bot1.vx -= nx * knockbackForce * mass2;
            bot1.vy -= ny * knockbackForce * mass2;
            bot2.vx += nx * knockbackForce * mass1;
            bot2.vy += ny * knockbackForce * mass1;
        }
    }

    checkProjectileCollision(projectile, target) {
        if (!projectile.active || !target.isAlive()) return false;
        
        const dx = target.x - projectile.x;
        const dy = target.y - projectile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < projectile.radius + target.radius;
    }

    checkHazardCollision(entity, hazard) {
        // To be implemented with hazard system
        return false;
    }

    // AABB collision check for rectangular objects
    checkAABB(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    // Circle collision check
    checkCircleCollision(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < a.radius + b.radius;
    }

    // Line-circle intersection for laser weapons
    checkLineCircleCollision(lineStart, lineEnd, circle) {
        const d = {
            x: lineEnd.x - lineStart.x,
            y: lineEnd.y - lineStart.y
        };
        const f = {
            x: lineStart.x - circle.x,
            y: lineStart.y - circle.y
        };
        
        const a = d.x * d.x + d.y * d.y;
        const b = 2 * (f.x * d.x + f.y * d.y);
        const c = (f.x * f.x + f.y * f.y) - circle.radius * circle.radius;
        
        let discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0) {
            return false;
        }
        
        discriminant = Math.sqrt(discriminant);
        
        const t1 = (-b - discriminant) / (2 * a);
        const t2 = (-b + discriminant) / (2 * a);
        
        if (t1 >= 0 && t1 <= 1) {
            return true;
        }
        
        if (t2 >= 0 && t2 <= 1) {
            return true;
        }
        
        return false;
    }
}