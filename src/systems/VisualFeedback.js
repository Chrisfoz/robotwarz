/**
 * Visual Feedback System - Enhanced visual effects for combat feedback
 */

export class VisualFeedbackSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Effect arrays
        this.hitFlashes = [];
        this.damageNumbers = [];
        this.hitMarkers = [];
        this.deathExplosions = [];
        this.killNotifications = [];
        this.streakNotifications = [];
        this.criticalHits = [];
        
        // Kill tracking
        this.killStreak = 0;
        this.lastKillTime = 0;
        this.multiKillWindow = 3000; // 3 seconds for multi-kills
        
        // Visual settings
        this.colors = {
            damage: '#ff4444',
            heal: '#44ff44',
            critical: '#ffaa00',
            shield: '#4444ff',
            ability: '#aa44ff',
            killStreak: '#ffdd00',
            hitMarker: '#ffffff',
            explosion: ['#ff6600', '#ffaa00', '#ffdd00', '#ffffff']
        };
        
        // Screen effects
        this.screenFlash = {
            active: false,
            color: 'rgba(255, 255, 255, 0)',
            duration: 0,
            maxDuration: 100
        };
        
        this.screenShake = {
            active: false,
            intensity: 0,
            duration: 0,
            maxDuration: 200,
            offsetX: 0,
            offsetY: 0
        };
        
        // Hit marker settings
        this.hitMarkerSize = 20;
        this.hitMarkerDuration = 300;
        
        // Damage number settings
        this.damageNumberDuration = 1500;
        this.damageNumberSpeed = 50;
    }
    
    // Add damage number that floats up
    addDamageNumber(x, y, damage, type = 'normal') {
        const colors = {
            normal: this.colors.damage,
            critical: this.colors.critical,
            heal: this.colors.heal,
            shield: this.colors.shield,
            ability: this.colors.ability
        };
        
        this.damageNumbers.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y,
            originalY: y,
            damage: Math.round(damage),
            type: type,
            color: colors[type] || this.colors.damage,
            size: type === 'critical' ? 28 : 20,
            duration: 0,
            maxDuration: this.damageNumberDuration,
            velocity: {
                x: (Math.random() - 0.5) * 30,
                y: -this.damageNumberSpeed
            }
        });
        
        // Add screen effect for critical hits
        if (type === 'critical') {
            this.addScreenFlash('#ffaa00', 150);
            this.addScreenShake(5, 150);
        }
    }
    
    // Add hit marker (X mark) at position
    addHitMarker(x, y, isKill = false) {
        this.hitMarkers.push({
            x: x,
            y: y,
            duration: 0,
            maxDuration: isKill ? 500 : this.hitMarkerDuration,
            size: isKill ? 30 : this.hitMarkerSize,
            color: isKill ? this.colors.critical : this.colors.hitMarker,
            isKill: isKill
        });
        
        // Play hit sound if available
        if (window.audioSystem) {
            window.audioSystem.playSound(isKill ? 'kill' : 'hit');
        }
    }
    
    // Add death explosion effect
    addDeathExplosion(x, y, botColor = '#ffffff') {
        const explosion = {
            x: x,
            y: y,
            particles: [],
            shockwave: {
                radius: 0,
                maxRadius: 100,
                alpha: 1
            },
            duration: 0,
            maxDuration: 1000
        };
        
        // Create explosion particles
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 100 + Math.random() * 200;
            explosion.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                color: Math.random() > 0.5 ? botColor : this.colors.explosion[Math.floor(Math.random() * 4)],
                alpha: 1,
                decay: 0.02
            });
        }
        
        this.deathExplosions.push(explosion);
        
        // Add screen shake for nearby explosions
        const distanceToCenter = Math.sqrt(
            Math.pow(x - this.canvas.width / 2, 2) + 
            Math.pow(y - this.canvas.height / 2, 2)
        );
        
        if (distanceToCenter < 300) {
            const intensity = 10 * (1 - distanceToCenter / 300);
            this.addScreenShake(intensity, 300);
        }
    }
    
    // Add kill notification
    addKillNotification(killerName, victimName, weaponType = 'ranged') {
        const now = Date.now();
        
        // Check for multi-kills
        if (now - this.lastKillTime < this.multiKillWindow) {
            this.killStreak++;
        } else {
            this.killStreak = 1;
        }
        this.lastKillTime = now;
        
        // Add kill feed entry
        this.killNotifications.push({
            killer: killerName,
            victim: victimName,
            weapon: weaponType,
            duration: 0,
            maxDuration: 3000,
            y: 100
        });
        
        // Add streak notification if applicable
        if (this.killStreak >= 2) {
            this.addStreakNotification(this.killStreak);
        }
        
        // Limit kill feed to 5 entries
        if (this.killNotifications.length > 5) {
            this.killNotifications.shift();
        }
    }
    
    // Add kill streak notification
    addStreakNotification(streak) {
        const messages = {
            2: 'DOUBLE KILL!',
            3: 'TRIPLE KILL!',
            4: 'QUAD KILL!',
            5: 'PENTA KILL!',
            6: 'HEXA KILL!',
            7: 'LEGENDARY!',
            8: 'GODLIKE!',
            9: 'UNSTOPPABLE!',
            10: 'ANNIHILATION!'
        };
        
        const message = messages[Math.min(streak, 10)] || 'MONSTER KILL!';
        
        this.streakNotifications.push({
            message: message,
            streak: streak,
            x: this.canvas.width / 2,
            y: this.canvas.height / 3,
            scale: 0,
            targetScale: 1.5,
            duration: 0,
            maxDuration: 2000,
            color: this.colors.killStreak
        });
        
        // Add epic screen flash for high streaks
        if (streak >= 3) {
            this.addScreenFlash(this.colors.killStreak, 200);
        }
    }
    
    // Add bot hit flash effect
    addHitFlash(bot) {
        this.hitFlashes.push({
            bot: bot,
            duration: 0,
            maxDuration: 200,
            color: 'rgba(255, 100, 100, 0.6)'
        });
    }
    
    // Add critical hit effect
    addCriticalHit(x, y) {
        this.criticalHits.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 50,
            duration: 0,
            maxDuration: 300,
            rings: []
        });
        
        // Create expanding rings
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (this.criticalHits.length > 0) {
                    const crit = this.criticalHits[this.criticalHits.length - 1];
                    if (crit) {
                        crit.rings.push({
                            radius: 0,
                            maxRadius: 30 + i * 10,
                            alpha: 1
                        });
                    }
                }
            }, i * 50);
        }
    }
    
    // Screen effects
    addScreenFlash(color, duration) {
        this.screenFlash = {
            active: true,
            color: color,
            duration: 0,
            maxDuration: duration
        };
    }
    
    addScreenShake(intensity, duration) {
        this.screenShake = {
            active: true,
            intensity: intensity,
            duration: 0,
            maxDuration: duration,
            offsetX: 0,
            offsetY: 0
        };
    }
    
    // Update all effects
    update(deltaTime) {
        // Update damage numbers
        this.damageNumbers = this.damageNumbers.filter(num => {
            num.duration += deltaTime;
            num.x += num.velocity.x * deltaTime / 1000;
            num.y += num.velocity.y * deltaTime / 1000;
            num.velocity.y += 30; // Gravity
            num.velocity.x *= 0.95; // Friction
            return num.duration < num.maxDuration;
        });
        
        // Update hit markers
        this.hitMarkers = this.hitMarkers.filter(marker => {
            marker.duration += deltaTime;
            return marker.duration < marker.maxDuration;
        });
        
        // Update death explosions
        this.deathExplosions = this.deathExplosions.filter(explosion => {
            explosion.duration += deltaTime;
            
            // Update shockwave
            explosion.shockwave.radius += deltaTime * 0.3;
            explosion.shockwave.alpha = 1 - (explosion.shockwave.radius / explosion.shockwave.maxRadius);
            
            // Update particles
            explosion.particles.forEach(particle => {
                particle.x += particle.vx * deltaTime / 1000;
                particle.y += particle.vy * deltaTime / 1000;
                particle.vy += 200; // Gravity
                particle.vx *= 0.98; // Friction
                particle.alpha -= particle.decay;
            });
            
            return explosion.duration < explosion.maxDuration;
        });
        
        // Update kill notifications
        this.killNotifications = this.killNotifications.filter(notif => {
            notif.duration += deltaTime;
            return notif.duration < notif.maxDuration;
        });
        
        // Update streak notifications
        this.streakNotifications = this.streakNotifications.filter(notif => {
            notif.duration += deltaTime;
            notif.scale += (notif.targetScale - notif.scale) * 0.1;
            return notif.duration < notif.maxDuration;
        });
        
        // Update critical hits
        this.criticalHits = this.criticalHits.filter(crit => {
            crit.duration += deltaTime;
            crit.radius += deltaTime * 0.1;
            
            crit.rings.forEach(ring => {
                ring.radius += deltaTime * 0.2;
                ring.alpha = Math.max(0, 1 - (ring.radius / ring.maxRadius));
            });
            
            return crit.duration < crit.maxDuration;
        });
        
        // Update hit flashes
        this.hitFlashes = this.hitFlashes.filter(flash => {
            flash.duration += deltaTime;
            return flash.duration < flash.maxDuration;
        });
        
        // Update screen flash
        if (this.screenFlash.active) {
            this.screenFlash.duration += deltaTime;
            if (this.screenFlash.duration >= this.screenFlash.maxDuration) {
                this.screenFlash.active = false;
            }
        }
        
        // Update screen shake
        if (this.screenShake.active) {
            this.screenShake.duration += deltaTime;
            if (this.screenShake.duration >= this.screenShake.maxDuration) {
                this.screenShake.active = false;
                this.screenShake.offsetX = 0;
                this.screenShake.offsetY = 0;
            } else {
                const decay = 1 - (this.screenShake.duration / this.screenShake.maxDuration);
                this.screenShake.offsetX = (Math.random() - 0.5) * this.screenShake.intensity * decay;
                this.screenShake.offsetY = (Math.random() - 0.5) * this.screenShake.intensity * decay;
            }
        }
    }
    
    // Render all effects
    render() {
        const ctx = this.ctx;
        
        // Apply screen shake
        if (this.screenShake.active) {
            ctx.save();
            ctx.translate(this.screenShake.offsetX, this.screenShake.offsetY);
        }
        
        // Render death explosions
        this.deathExplosions.forEach(explosion => {
            // Render shockwave
            ctx.strokeStyle = `rgba(255, 255, 255, ${explosion.shockwave.alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.shockwave.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Render particles
            explosion.particles.forEach(particle => {
                if (particle.alpha > 0) {
                    ctx.fillStyle = particle.color;
                    ctx.globalAlpha = particle.alpha;
                    ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
                }
            });
            ctx.globalAlpha = 1;
        });
        
        // Render critical hit effects
        this.criticalHits.forEach(crit => {
            crit.rings.forEach(ring => {
                if (ring.alpha > 0) {
                    ctx.strokeStyle = `rgba(255, 170, 0, ${ring.alpha})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(crit.x, crit.y, ring.radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
        });
        
        // Render hit markers
        this.hitMarkers.forEach(marker => {
            const alpha = 1 - (marker.duration / marker.maxDuration);
            ctx.strokeStyle = marker.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = marker.isKill ? 4 : 2;
            
            const size = marker.size * (1 + marker.duration / marker.maxDuration * 0.5);
            
            // Draw X
            ctx.beginPath();
            ctx.moveTo(marker.x - size / 2, marker.y - size / 2);
            ctx.lineTo(marker.x + size / 2, marker.y + size / 2);
            ctx.moveTo(marker.x + size / 2, marker.y - size / 2);
            ctx.lineTo(marker.x - size / 2, marker.y + size / 2);
            ctx.stroke();
            
            ctx.globalAlpha = 1;
        });
        
        // Render damage numbers
        this.damageNumbers.forEach(num => {
            const alpha = 1 - (num.duration / num.maxDuration);
            ctx.font = `bold ${num.size}px Arial`;
            ctx.textAlign = 'center';
            
            // Outline
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.globalAlpha = alpha;
            ctx.strokeText(num.damage, num.x, num.y);
            
            // Fill
            ctx.fillStyle = num.color;
            ctx.fillText(num.damage, num.x, num.y);
            
            // Add "CRIT!" text for critical hits
            if (num.type === 'critical') {
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = '#ffaa00';
                ctx.fillText('CRIT!', num.x, num.y - 20);
            }
            
            ctx.globalAlpha = 1;
        });
        
        // Render kill feed
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        let killFeedY = 100;
        
        this.killNotifications.forEach(notif => {
            const alpha = notif.duration < 2500 ? 1 : 1 - ((notif.duration - 2500) / 500);
            ctx.globalAlpha = alpha;
            
            // Background
            const text = `${notif.killer} ⚔ ${notif.victim}`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(this.canvas.width - textWidth - 30, killFeedY - 15, textWidth + 20, 25);
            
            // Text
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, this.canvas.width - 20, killFeedY);
            
            killFeedY += 30;
        });
        ctx.globalAlpha = 1;
        
        // Render streak notifications
        this.streakNotifications.forEach(notif => {
            const alpha = notif.duration < 1500 ? 1 : 1 - ((notif.duration - 1500) / 500);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(notif.x, notif.y);
            ctx.scale(notif.scale, notif.scale);
            
            // Text shadow
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 5;
            ctx.strokeText(notif.message, 0, 0);
            
            // Gradient fill
            const gradient = ctx.createLinearGradient(-100, 0, 100, 0);
            gradient.addColorStop(0, '#ff6600');
            gradient.addColorStop(0.5, notif.color);
            gradient.addColorStop(1, '#ff6600');
            ctx.fillStyle = gradient;
            ctx.fillText(notif.message, 0, 0);
            
            ctx.restore();
        });
        
        // Reset screen shake translation
        if (this.screenShake.active) {
            ctx.restore();
        }
        
        // Render screen flash
        if (this.screenFlash.active) {
            const alpha = 1 - (this.screenFlash.duration / this.screenFlash.maxDuration);
            ctx.fillStyle = this.screenFlash.color;
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.globalAlpha = 1;
        }
    }
    
    // Clear all effects
    clear() {
        this.hitFlashes = [];
        this.damageNumbers = [];
        this.hitMarkers = [];
        this.deathExplosions = [];
        this.killNotifications = [];
        this.streakNotifications = [];
        this.criticalHits = [];
        this.killStreak = 0;
        this.screenFlash.active = false;
        this.screenShake.active = false;
    }
}