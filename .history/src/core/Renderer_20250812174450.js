import { COLORS, BOT_CLASSES } from '../config/constants.js';

export class Renderer {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.camera = { x: 0, y: 0, zoom: 1 };
    }

    init() {
        // Set default styles
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    clear() {
        this.ctx.fillStyle = COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    renderGame(bots, projectiles, hazards, effects, playerBot) {
        // Draw arena
        this.renderArena();
        
        // Draw hazards
        hazards.forEach(hazard => this.renderHazard(hazard));
        
        // Draw projectiles
        projectiles.forEach(projectile => this.renderProjectile(projectile));
        
        // Draw bots
        bots.forEach(bot => this.renderBot(bot));
        
        // Draw effects
        effects.forEach(effect => this.renderEffect(effect));
        
        // Draw HUD
        if (playerBot) {
            this.renderHUD(playerBot);
        }
        
        // Draw minimap
        this.renderMinimap(bots, playerBot);
    }

    renderArena() {
        // Arena border
        this.ctx.strokeStyle = COLORS.UI_BORDER;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, 0, this.width, this.height);
        
        // Grid pattern
        this.ctx.strokeStyle = COLORS.UI_BORDER + '20';
        this.ctx.lineWidth = 1;
        const gridSize = 50;
        
        for (let x = gridSize; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        for (let y = gridSize; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    renderBot(bot) {
        if (!bot.isAlive()) return;
        
        this.ctx.save();
        this.ctx.translate(bot.x, bot.y);
        this.ctx.rotate(bot.angle);
        
        // Draw shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(2, 2, bot.radius * 0.9, bot.radius * 0.7, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw bot body
        const opacity = bot.cloaked ? '40' : '';
        this.ctx.fillStyle = bot.color + opacity;
        this.ctx.strokeStyle = bot.cloaked ? bot.color + '60' : '#000';
        this.ctx.lineWidth = 2;
        
        // Hexagonal shape
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = Math.cos(angle) * bot.radius;
            const y = Math.sin(angle) * bot.radius;
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw direction indicator
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.moveTo(bot.radius * 0.8, 0);
        this.ctx.lineTo(bot.radius * 0.4, -bot.radius * 0.3);
        this.ctx.lineTo(bot.radius * 0.4, bot.radius * 0.3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw ability indicator
        if (bot.abilityActive) {
            this.ctx.strokeStyle = COLORS.ENERGY;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, bot.radius + 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        
        // Draw health bar
        this.renderHealthBar(bot);
        
        // Draw player indicator
        if (bot.playerId === 'player') {
            this.ctx.strokeStyle = COLORS.PRIMARY;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(bot.x, bot.y - bot.radius - 15);
            this.ctx.lineTo(bot.x - 5, bot.y - bot.radius - 25);
            this.ctx.lineTo(bot.x + 5, bot.y - bot.radius - 25);
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }

    renderHealthBar(bot) {
        const barWidth = 40;
        const barHeight = 4;
        const x = bot.x - barWidth / 2;
        const y = bot.y - bot.radius - 10;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // Health
        const healthPercent = bot.health / bot.maxHealth;
        const healthColor = healthPercent > 0.5 ? COLORS.HEAL : 
                          healthPercent > 0.25 ? COLORS.WARNING : COLORS.DAMAGE;
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        // Shield
        if (bot.shield > 0) {
            const shieldPercent = bot.shield / bot.maxShield;
            this.ctx.fillStyle = COLORS.ENERGY;
            this.ctx.fillRect(x, y - 3, barWidth * shieldPercent, 2);
        }
        
        // Border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, barWidth, barHeight);
    }

    renderProjectile(projectile) {
        if (!projectile.active) return;
        
        // Draw trail
        if (projectile.trail.length > 1) {
            this.ctx.strokeStyle = projectile.color + '40';
            this.ctx.lineWidth = projectile.radius;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(projectile.trail[0].x, projectile.trail[0].y);
            for (let i = 1; i < projectile.trail.length; i++) {
                this.ctx.lineTo(projectile.trail[i].x, projectile.trail[i].y);
            }
            this.ctx.stroke();
        }
        
        // Draw projectile
        this.ctx.save();
        this.ctx.translate(projectile.x, projectile.y);
        
        // Glow effect
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, projectile.radius * 3);
        gradient.addColorStop(0, projectile.color);
        gradient.addColorStop(0.5, projectile.color + '60');
        gradient.addColorStop(1, projectile.color + '00');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, projectile.radius * 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Core
        this.ctx.fillStyle = projectile.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, projectile.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner bright core
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, projectile.radius * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    renderHazard(hazard) {
        if (!hazard.active) return;
        
        this.ctx.save();
        
        // Get current opacity
        const opacity = hazard.getOpacity();
        this.ctx.globalAlpha = opacity;
        
        // Render based on hazard type
        switch (hazard.type) {
            case 'lava':
                this.renderLavaPool(hazard);
                break;
            case 'energy':
                this.renderEnergyField(hazard);
                break;
            case 'crusher':
                this.renderCrusher(hazard);
                break;
            case 'turret':
                this.renderTurret(hazard);
                break;
            case 'mine':
                this.renderMine(hazard);
                break;
            default:
                this.renderGenericHazard(hazard);
        }
        
        this.ctx.restore();
    }
    
    renderLavaPool(hazard) {
        // Main lava pool
        const gradient = this.ctx.createRadialGradient(
            hazard.x, hazard.y, 0,
            hazard.x, hazard.y, hazard.radius
        );
        gradient.addColorStop(0, '#ff6666');
        gradient.addColorStop(0.5, '#ff4444');
        gradient.addColorStop(1, '#cc0000');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bubbling effect
        if (hazard.bubbles) {
            hazard.bubbles.forEach(bubble => {
                this.ctx.fillStyle = `rgba(255, 100, 100, ${bubble.life * 0.6})`;
                this.ctx.beginPath();
                this.ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
        
        // Warning glow during warmup
        if (hazard.isWarming()) {
            this.ctx.strokeStyle = hazard.warningColor;
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(hazard.x, hazard.y, hazard.radius + 5, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }
    
    renderEnergyField(hazard) {
        // Animated energy field
        const time = hazard.animationTime * 0.001;
        
        // Multiple layers for depth
        for (let i = 3; i > 0; i--) {
            const layerRadius = hazard.radius * (1 + i * 0.1);
            const gradient = this.ctx.createRadialGradient(
                hazard.x, hazard.y, 0,
                hazard.x, hazard.y, layerRadius
            );
            
            const alpha = 0.2 / i;
            gradient.addColorStop(0, `rgba(102, 102, 255, ${alpha})`);
            gradient.addColorStop(0.7, `rgba(102, 102, 255, ${alpha * 0.5})`);
            gradient.addColorStop(1, 'rgba(102, 102, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(hazard.x, hazard.y, layerRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Lightning bolts
        if (hazard.lightningBolts) {
            hazard.lightningBolts.forEach(bolt => {
                this.ctx.strokeStyle = `rgba(150, 150, 255, ${bolt.life * 2})`;
                this.ctx.lineWidth = 2;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#6666ff';
                
                this.ctx.beginPath();
                bolt.segments.forEach((segment, index) => {
                    if (index === 0) {
                        this.ctx.moveTo(segment.x, segment.y);
                    } else {
                        this.ctx.lineTo(segment.x, segment.y);
                    }
                });
                this.ctx.stroke();
            });
            this.ctx.shadowBlur = 0;
        }
        
        // Inner core
        this.ctx.fillStyle = 'rgba(100, 100, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(hazard.x, hazard.y, hazard.radius * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderCrusher(hazard) {
        const shadowY = hazard.y + hazard.crushProgress * hazard.shadowOffset;
        
        // Shadow on ground
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(
            hazard.x - hazard.width / 2,
            hazard.y - hazard.height / 2,
            hazard.width,
            hazard.height
        );
        
        // Warning area when about to crush
        if (hazard.state === 'warning') {
            const warningIntensity = hazard.getWarningIntensity();
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${warningIntensity})`;
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([10, 5]);
            this.ctx.strokeRect(
                hazard.x - hazard.width / 2 - 5,
                hazard.y - hazard.height / 2 - 5,
                hazard.width + 10,
                hazard.height + 10
            );
            this.ctx.setLineDash([]);
            
            // Flashing fill
            this.ctx.fillStyle = `rgba(255, 0, 0, ${warningIntensity * 0.2})`;
            this.ctx.fillRect(
                hazard.x - hazard.width / 2,
                hazard.y - hazard.height / 2,
                hazard.width,
                hazard.height
            );
        }
        
        // Crusher plate (elevated based on state)
        const plateY = hazard.y - hazard.height / 2 - (1 - hazard.crushProgress) * hazard.shadowOffset;
        
        // 3D effect
        this.ctx.fillStyle = '#444444';
        this.ctx.fillRect(
            hazard.x - hazard.width / 2,
            plateY,
            hazard.width,
            hazard.height
        );
        
        // Highlight
        const gradient = this.ctx.createLinearGradient(
            hazard.x - hazard.width / 2, plateY,
            hazard.x + hazard.width / 2, plateY + hazard.height
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            hazard.x - hazard.width / 2,
            plateY,
            hazard.width,
            hazard.height
        );
        
        // Metal texture lines
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const lineY = plateY + (hazard.height / 4) * (i + 1);
            this.ctx.beginPath();
            this.ctx.moveTo(hazard.x - hazard.width / 2 + 5, lineY);
            this.ctx.lineTo(hazard.x + hazard.width / 2 - 5, lineY);
            this.ctx.stroke();
        }
    }
    
    renderTurret(hazard) {
        // Base
        this.ctx.fillStyle = '#333333';
        this.ctx.beginPath();
        this.ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Range indicator (subtle)
        if (hazard.currentTarget) {
            this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(hazard.x, hazard.y, hazard.range, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Rotating turret top
        this.ctx.save();
        this.ctx.translate(hazard.x, hazard.y);
        this.ctx.rotate(hazard.angle);
        
        // Barrel
        this.ctx.fillStyle = '#555555';
        this.ctx.fillRect(0, -5, hazard.barrelLength, 10);
        
        // Barrel end
        this.ctx.fillStyle = '#222222';
        this.ctx.fillRect(hazard.barrelLength - 5, -6, 5, 12);
        
        this.ctx.restore();
        
        // Center pivot
        this.ctx.fillStyle = '#666666';
        this.ctx.beginPath();
        this.ctx.arc(hazard.x, hazard.y, hazard.radius * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Warning light when warming up
        if (hazard.isWarming()) {
            const pulse = Math.sin(hazard.animationTime * 0.01) * 0.5 + 0.5;
            this.ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
            this.ctx.beginPath();
            this.ctx.arc(hazard.x, hazard.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (hazard.currentTarget) {
            // Active light
            this.ctx.fillStyle = '#00ff00';
            this.ctx.beginPath();
            this.ctx.arc(hazard.x, hazard.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    renderMine(hazard) {
        // Mine body
        const baseColor = hazard.triggered ? '#ff0000' : '#666666';
        
        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();
        this.ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Spikes around mine
        const spikeCount = 8;
        this.ctx.fillStyle = '#444444';
        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / spikeCount) * Math.PI * 2;
            const spikeX = hazard.x + Math.cos(angle) * hazard.radius;
            const spikeY = hazard.y + Math.sin(angle) * hazard.radius;
            const endX = hazard.x + Math.cos(angle) * (hazard.radius + 8);
            const endY = hazard.y + Math.sin(angle) * (hazard.radius + 8);
            
            this.ctx.beginPath();
            this.ctx.moveTo(spikeX, spikeY);
            this.ctx.lineTo(endX, endY);
            this.ctx.lineTo(
                hazard.x + Math.cos(angle + 0.1) * hazard.radius,
                hazard.y + Math.sin(angle + 0.1) * hazard.radius
            );
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        // Warning light
        const lightColor = hazard.triggered ? 
            `rgba(255, 0, 0, ${hazard.getOpacity()})` : 
            `rgba(255, 100, 0, ${0.5 + Math.sin(hazard.animationTime * 0.003) * 0.3})`;
        
        this.ctx.fillStyle = lightColor;
        this.ctx.beginPath();
        this.ctx.arc(hazard.x, hazard.y, hazard.radius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Trigger radius indicator when warming up
        if (hazard.isWarming() && !hazard.triggered) {
            this.ctx.strokeStyle = 'rgba(255, 100, 0, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 10]);
            this.ctx.beginPath();
            this.ctx.arc(hazard.x, hazard.y, hazard.triggerRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }
    
    renderGenericHazard(hazard) {
        // Fallback rendering for custom hazards
        this.ctx.fillStyle = hazard.color;
        
        if (hazard.shape === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (hazard.shape === 'rectangle') {
            this.ctx.fillRect(
                hazard.x - hazard.width / 2,
                hazard.y - hazard.height / 2,
                hazard.width,
                hazard.height
            );
        }
    }

    renderEffect(effect) {
        // Effect rendering will be implemented with effects system
    }

    renderHUD(playerBot) {
        // Top left - Player stats
        this.ctx.fillStyle = COLORS.UI_BG;
        this.ctx.fillRect(10, 10, 200, 80);
        this.ctx.strokeStyle = COLORS.UI_BORDER;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(10, 10, 200, 80);
        
        // Player name and class
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(playerBot.name, 20, 30);
        
        // Health bar
        this.renderBar(20, 40, 180, 10, playerBot.health / playerBot.maxHealth, COLORS.HEAL, COLORS.DAMAGE);
        
        // Energy bar
        this.renderBar(20, 55, 180, 10, playerBot.energy / playerBot.maxEnergy, COLORS.ENERGY, COLORS.WARNING);
        
        // Ability cooldown
        if (!playerBot.canUseAbility()) {
            const cooldownPercent = (Date.now() - playerBot.lastAbilityTime) / playerBot.abilityCooldown;
            this.renderBar(20, 70, 180, 10, cooldownPercent, COLORS.PRIMARY, COLORS.SECONDARY);
        }
        
        // Top right - Score
        this.ctx.fillStyle = COLORS.UI_BG;
        this.ctx.fillRect(this.width - 160, 10, 150, 60);
        this.ctx.strokeStyle = COLORS.UI_BORDER;
        this.ctx.strokeRect(this.width - 160, 10, 150, 60);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Kills: ${playerBot.stats.kills}`, this.width - 150, 30);
        this.ctx.fillText(`Damage: ${Math.floor(playerBot.stats.damageDealt)}`, this.width - 150, 50);
    }

    renderBar(x, y, width, height, percent, color1, color2) {
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, y, width, height);
        
        // Gradient fill
        const gradient = this.ctx.createLinearGradient(x, y, x + width, y);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width * Math.min(1, percent), height);
        
        // Border
        this.ctx.strokeStyle = COLORS.UI_BORDER;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
    }

    renderMinimap(bots, playerBot) {
        const minimapSize = 100;
        const x = this.width - minimapSize - 10;
        const y = this.height - minimapSize - 10;
        const scale = minimapSize / Math.max(this.width, this.height);
        
        // Background
        this.ctx.fillStyle = COLORS.UI_BG;
        this.ctx.fillRect(x, y, minimapSize, minimapSize);
        
        // Bots
        bots.forEach(bot => {
            if (bot.isAlive()) {
                const dotX = x + bot.x * scale;
                const dotY = y + bot.y * scale;
                
                this.ctx.fillStyle = bot === playerBot ? COLORS.PRIMARY : 
                                   bot.playerId.startsWith('ai') ? COLORS.DAMAGE : COLORS.WARNING;
                this.ctx.beginPath();
                this.ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // Border
        this.ctx.strokeStyle = COLORS.UI_BORDER;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, minimapSize, minimapSize);
    }

    renderMenu() {
        this.clear();
        
        // Title
        this.ctx.fillStyle = COLORS.PRIMARY;
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ROBOT WARZ', this.width / 2, 100);
        
        // Subtitle
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Arena Evolution', this.width / 2, 140);
        
        // Menu options
        const options = ['Play', 'Bot Select', 'Upgrades', 'Settings'];
        options.forEach((option, index) => {
            const y = 250 + index * 60;
            
            // Button background
            this.ctx.fillStyle = COLORS.UI_BG;
            this.ctx.fillRect(this.width / 2 - 100, y - 25, 200, 50);
            
            // Button text
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(option, this.width / 2, y + 5);
            
            // Button border
            this.ctx.strokeStyle = COLORS.UI_BORDER;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(this.width / 2 - 100, y - 25, 200, 50);
        });
        
        this.ctx.textAlign = 'left';
    }

    renderBotSelect(playerProfile) {
        this.clear();
        
        // Title
        this.ctx.fillStyle = COLORS.PRIMARY;
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SELECT YOUR BOT', this.width / 2, 50);
        
        // Player info
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Credits: ${playerProfile.credits}`, this.width / 2 - 100, 90);
        this.ctx.fillText(`Level: ${playerProfile.level}`, this.width / 2 + 20, 90);
        
        // Bot grid
        const bots = Object.values(BOT_CLASSES);
        const cols = 4;
        const cardWidth = 150;
        const cardHeight = 180;
        const spacing = 20;
        const startX = (this.width - (cols * cardWidth + (cols - 1) * spacing)) / 2;
        
        bots.forEach((bot, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = startX + col * (cardWidth + spacing);
            const y = 130 + row * (cardHeight + spacing);
            
            // Card background
            const isUnlocked = playerProfile.unlockedBots.includes(bot.id);
            this.ctx.fillStyle = isUnlocked ? COLORS.UI_BG : COLORS.UI_BG + '60';
            this.ctx.fillRect(x, y, cardWidth, cardHeight);
            
            // Bot preview
            this.ctx.save();
            this.ctx.translate(x + cardWidth / 2, y + 50);
            
            if (isUnlocked) {
                // Draw bot shape
                this.ctx.fillStyle = bot.color;
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const px = Math.cos(angle) * 20;
                    const py = Math.sin(angle) * 20;
                    if (i === 0) {
                        this.ctx.moveTo(px, py);
                    } else {
                        this.ctx.lineTo(px, py);
                    }
                }
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                // Lock icon
                this.ctx.fillStyle = COLORS.LOCKED;
                this.ctx.font = '30px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🔒', 0, 10);
            }
            
            this.ctx.restore();
            
            // Bot name
            this.ctx.fillStyle = isUnlocked ? '#fff' : COLORS.LOCKED;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(bot.name, x + cardWidth / 2, y + 100);
            
            // Bot stats
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`HP: ${bot.baseStats.health}`, x + cardWidth / 2, y + 120);
            this.ctx.fillText(`Speed: ${bot.baseStats.speed}`, x + cardWidth / 2, y + 135);
            
            // Price or description
            if (!isUnlocked) {
                this.ctx.fillStyle = COLORS.WARNING;
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillText(`${bot.price} credits`, x + cardWidth / 2, y + 160);
            } else {
                this.ctx.fillStyle = COLORS.UNLOCKED;
                this.ctx.font = '10px Arial';
                this.ctx.fillText(bot.description, x + cardWidth / 2, y + 160);
            }
            
            // Card border
            this.ctx.strokeStyle = isUnlocked ? COLORS.UI_BORDER : COLORS.LOCKED;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, cardWidth, cardHeight);
        });
        
        this.ctx.textAlign = 'left';
    }

    renderGameOver(matchData, playerProfile) {
        this.clear();
        
        // Title
        this.ctx.fillStyle = COLORS.PRIMARY;
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('MATCH COMPLETE', this.width / 2, 100);
        
        // Match stats
        this.ctx.fillStyle = COLORS.UI_BG;
        this.ctx.fillRect(this.width / 2 - 200, 150, 400, 300);
        this.ctx.strokeStyle = COLORS.UI_BORDER;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.width / 2 - 200, 150, 400, 300);
        
        // Stats text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        const stats = [
            `Kills: ${matchData.kills}`,
            `Damage Dealt: ${Math.floor(matchData.damageDealt)}`,
            `Credits Earned: ${matchData.creditsEarned}`,
            `XP Earned: ${matchData.xpEarned}`,
            '',
            `Total Credits: ${playerProfile.credits}`,
            `Level: ${playerProfile.level} (${playerProfile.xp} XP)`
        ];
        
        stats.forEach((stat, index) => {
            this.ctx.fillText(stat, this.width / 2, 200 + index * 35);
        });
        
        // Continue prompt
        this.ctx.fillStyle = COLORS.PRIMARY;
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Press R to return to menu', this.width / 2, 500);
        
        this.ctx.textAlign = 'left';
    }

    renderPauseOverlay() {
        // Darken background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Pause text
        this.ctx.fillStyle = COLORS.PRIMARY;
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Press ESC to resume', this.width / 2, this.height / 2 + 40);
        
        this.ctx.textAlign = 'left';
    }

    renderLobby(roomCode, players) {
        this.clear();
        
        // Title
        this.ctx.fillStyle = COLORS.PRIMARY;
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('MULTIPLAYER LOBBY', this.width / 2, 50);
        
        // Room code
        if (roomCode) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Room Code: ${roomCode}`, this.width / 2, 100);
        }
        
        // Player list
        this.ctx.fillStyle = COLORS.UI_BG;
        this.ctx.fillRect(this.width / 2 - 200, 150, 400, 300);
        this.ctx.strokeStyle = COLORS.UI_BORDER;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.width / 2 - 200, 150, 400, 300);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Players:', this.width / 2, 180);
        
        let playerIndex = 0;
        players.forEach((player, id) => {
            this.ctx.fillText(`${playerIndex + 1}. ${player.name || id}`, this.width / 2 - 150, 220 + playerIndex * 30);
            playerIndex++;
        });
        
        this.ctx.textAlign = 'left';
    }
}