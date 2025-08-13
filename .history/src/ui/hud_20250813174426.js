/**
 * HUD System - In-game heads-up display
 */

export class HUDSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // HUD elements visibility
        this.elements = {
            health: true,
            minimap: true,
            score: true,
            abilities: true,
            timer: true,
            killFeed: true,
            crosshair: true,
            speedometer: true,
            damageIndicator: true,
            xpBar: true,
            notifications: true,
            playerList: true,
            controls: true,
            backButton: true
        };
        
        // Visual settings
        this.colors = {
            health: '#4ade80',
            healthLow: '#ef4444',
            shield: '#3b82f6',
            energy: '#fbbf24',
            xp: '#a855f7',
            text: '#ffffff',
            textDim: '#9ca3af',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '#475569',
            enemy: '#ef4444',
            ally: '#3b82f6',
            neutral: '#9ca3af'
        };
        
        // Font settings
        this.fonts = {
            large: 'bold 24px Arial',
            medium: 'bold 18px Arial',
            normal: '16px Arial',
            small: '14px Arial',
            tiny: '12px Arial'
        };
        
        // Layout configuration
        this.layout = {
            padding: 20,
            healthBarWidth: 300,
            healthBarHeight: 30,
            minimapSize: 150,
            abilitySize: 60,
            abilitySpacing: 10
        };
        
        // Game data references
        this.gameData = null;
        this.playerBot = null;
        
        // HUD state
        this.damageNumbers = [];
        this.killFeedMessages = [];
        this.notifications = [];
        this.hitIndicators = [];
        
        // Animation values
        this.animationTime = 0;
        this.healthAnimation = { current: 100, target: 100 };
        this.xpAnimation = { current: 0, target: 0 };
        
        // Minimap configuration
        this.minimap = {
            scale: 0.15,
            alpha: 0.8
        };
        
        // Crosshair settings
        this.crosshair = {
            size: 20,
            gap: 5,
            thickness: 2,
            color: '#ffffff',
            expandOnFire: false,
            currentExpansion: 0
        };
    }
    
    setGameData(gameData) {
        this.gameData = gameData;
    }
    
    setPlayerBot(bot) {
        this.playerBot = bot;
        if (bot) {
            this.healthAnimation.current = bot.health;
            this.healthAnimation.target = bot.health;
        }
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Update health animation
        if (this.playerBot) {
            this.healthAnimation.target = this.playerBot.health;
            const diff = this.healthAnimation.target - this.healthAnimation.current;
            this.healthAnimation.current += diff * 0.1;
        }
        
        // Update XP animation
        if (this.gameData && this.gameData.progression) {
            this.xpAnimation.target = this.gameData.progression.xp;
            const diff = this.xpAnimation.target - this.xpAnimation.current;
            this.xpAnimation.current += diff * 0.1;
        }
        
        // Update damage numbers
        this.damageNumbers = this.damageNumbers.filter(dmg => {
            dmg.lifetime -= deltaTime;
            dmg.y -= deltaTime * 0.05;
            dmg.alpha = Math.min(1, dmg.lifetime / 1000);
            return dmg.lifetime > 0;
        });
        
        // Update kill feed
        this.killFeedMessages = this.killFeedMessages.filter(msg => {
            msg.lifetime -= deltaTime;
            return msg.lifetime > 0;
        });
        
        // Update notifications
        this.notifications = this.notifications.filter(notif => {
            notif.lifetime -= deltaTime;
            return notif.lifetime > 0;
        });
        
        // Update hit indicators
        this.hitIndicators = this.hitIndicators.filter(hit => {
            hit.lifetime -= deltaTime;
            hit.alpha = Math.min(1, hit.lifetime / 500);
            return hit.lifetime > 0;
        });
        
        // Update crosshair expansion
        if (this.crosshair.expandOnFire && this.crosshair.currentExpansion > 0) {
            this.crosshair.currentExpansion -= deltaTime * 0.01;
            this.crosshair.currentExpansion = Math.max(0, this.crosshair.currentExpansion);
        }
    }
    
    render() {
        if (!this.playerBot || !this.gameData) return;
        
        const ctx = this.ctx;
        
        // Render each HUD element
        if (this.elements.health) this.renderHealthBar();
        if (this.elements.minimap) this.renderMinimap();
        if (this.elements.score) this.renderScore();
        if (this.elements.abilities) this.renderAbilities();
        if (this.elements.timer) this.renderTimer();
        if (this.elements.killFeed) this.renderKillFeed();
        if (this.elements.crosshair) this.renderCrosshair();
        if (this.elements.speedometer) this.renderSpeedometer();
        if (this.elements.xpBar) this.renderXPBar();
        if (this.elements.playerList) this.renderPlayerList();

        // Small guidance panel and back button
        if (this.elements.controls) this.renderControlsHint();
        if (this.elements.backButton) this.renderBackButton();
        
        // Render floating elements
        this.renderDamageNumbers();
        this.renderHitIndicators();
        this.renderNotifications();
        
        // Render damage overlay if low health
        if (this.playerBot.health < this.playerBot.maxHealth * 0.3) {
            this.renderLowHealthOverlay();
        }
    }
    
    renderHealthBar() {
        const ctx = this.ctx;
        const x = this.layout.padding;
        const y = this.canvas.height - this.layout.padding - this.layout.healthBarHeight;
        const width = this.layout.healthBarWidth;
        const height = this.layout.healthBarHeight;
        
        // Background
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(x, y, width, height);
        
        // Border
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Health percentage
        const healthPercent = this.healthAnimation.current / this.playerBot.maxHealth;
        const healthColor = healthPercent > 0.3 ? this.colors.health : this.colors.healthLow;
        
        // Health bar
        ctx.fillStyle = healthColor;
        ctx.fillRect(x + 2, y + 2, (width - 4) * healthPercent, height - 4);
        
        // Health bar glow effect
        if (healthPercent <= 0.3) {
            ctx.shadowColor = this.colors.healthLow;
            ctx.shadowBlur = 10 + Math.sin(this.animationTime * 0.01) * 5;
            ctx.fillRect(x + 2, y + 2, (width - 4) * healthPercent, height - 4);
            ctx.shadowBlur = 0;
        }
        
        // Shield bar (if applicable)
        if (this.playerBot.shield && this.playerBot.shield > 0) {
            const shieldPercent = this.playerBot.shield / this.playerBot.maxShield;
            ctx.fillStyle = this.colors.shield;
            ctx.globalAlpha = 0.7;
            ctx.fillRect(x + 2, y + 2, (width - 4) * shieldPercent, height - 4);
            ctx.globalAlpha = 1;
        }
        
        // Health text
        ctx.font = this.fonts.medium;
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            `${Math.floor(this.healthAnimation.current)} / ${this.playerBot.maxHealth}`,
            x + width / 2,
            y + height / 2
        );
        
        // Bot class icon
        ctx.font = this.fonts.small;
        ctx.textAlign = 'left';
        ctx.fillText(this.playerBot.class || 'TITAN', x, y - 5);
    }
    
    renderMinimap() {
        const ctx = this.ctx;
        const size = this.layout.minimapSize;
        const x = this.canvas.width - size - this.layout.padding;
        const y = this.layout.padding;
        
        // Background
        ctx.fillStyle = this.colors.background;
        ctx.globalAlpha = this.minimap.alpha;
        ctx.fillRect(x, y, size, size);
        
        // Border
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);
        ctx.globalAlpha = 1;
        
        // Calculate scale
        const scale = size / Math.max(this.gameData.arenaWidth, this.gameData.arenaHeight);
        
        // Render entities on minimap
        if (this.gameData.bots) {
            this.gameData.bots.forEach(bot => {
                const dotX = x + bot.position.x * scale;
                const dotY = y + bot.position.y * scale;
                
                // Determine color
                let color = this.colors.neutral;
                if (bot.id === this.playerBot.id) {
                    color = this.colors.ally;
                } else if (bot.team !== this.playerBot.team) {
                    color = this.colors.enemy;
                }
                
                // Draw dot
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw direction indicator for player
                if (bot.id === this.playerBot.id) {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(dotX, dotY);
                    ctx.lineTo(
                        dotX + Math.cos(bot.rotation) * 8,
                        dotY + Math.sin(bot.rotation) * 8
                    );
                    ctx.stroke();
                }
            });
        }
        
        // Render hazards on minimap
        if (this.gameData.hazards) {
            ctx.fillStyle = '#fbbf24';
            ctx.globalAlpha = 0.5;
            this.gameData.hazards.forEach(hazard => {
                const hazardX = x + hazard.position.x * scale;
                const hazardY = y + hazard.position.y * scale;
                ctx.fillRect(hazardX - 2, hazardY - 2, 4, 4);
            });
            ctx.globalAlpha = 1;
        }
    }
    
    renderScore() {
        const ctx = this.ctx;
        const x = this.canvas.width / 2;
        const y = this.layout.padding + 30;
        
        // Background panel
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(x - 100, y - 20, 200, 40);
        
        // Score text
        ctx.font = this.fonts.large;
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'center';
        ctx.fillText(`Score: ${this.gameData.score || 0}`, x, y);
        
        // Kills/Deaths
        ctx.font = this.fonts.small;
        ctx.fillStyle = this.colors.textDim;
        ctx.fillText(
            `K: ${this.gameData.kills || 0} / D: ${this.gameData.deaths || 0}`,
            x, y + 15
        );
    }
    
    renderAbilities() {
        if (!this.gameData.abilities) return;
        
        const ctx = this.ctx;
        const startX = this.canvas.width / 2 - (this.layout.abilitySize * 1.5 + this.layout.abilitySpacing);
        const y = this.canvas.height - this.layout.padding - this.layout.abilitySize - 50;
        
        ['primary', 'secondary', 'ultimate'].forEach((type, index) => {
            const ability = this.gameData.abilities[type];
            if (!ability) return;
            
            const x = startX + index * (this.layout.abilitySize + this.layout.abilitySpacing);
            
            // Background
            ctx.fillStyle = this.colors.background;
            ctx.fillRect(x, y, this.layout.abilitySize, this.layout.abilitySize);
            
            // Border
            ctx.strokeStyle = ability.ready ? this.colors.border : '#1f2937';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, this.layout.abilitySize, this.layout.abilitySize);
            
            // Cooldown overlay
            if (!ability.ready && ability.cooldownPercent) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                const cooldownHeight = this.layout.abilitySize * (1 - ability.cooldownPercent);
                ctx.fillRect(x, y, this.layout.abilitySize, cooldownHeight);
            }
            
            // Ability icon/key
            ctx.font = this.fonts.large;
            ctx.fillStyle = ability.ready ? this.colors.text : this.colors.textDim;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                ability.key || ['Q', 'E', 'R'][index],
                x + this.layout.abilitySize / 2,
                y + this.layout.abilitySize / 2
            );
            
            // Cooldown text
            if (!ability.ready && ability.cooldownRemaining) {
                ctx.font = this.fonts.small;
                ctx.fillStyle = this.colors.text;
                ctx.fillText(
                    Math.ceil(ability.cooldownRemaining / 1000) + 's',
                    x + this.layout.abilitySize / 2,
                    y + this.layout.abilitySize - 10
                );
            }
            
            // Ability name
            ctx.font = this.fonts.tiny;
            ctx.fillStyle = this.colors.textDim;
            ctx.fillText(
                ability.name,
                x + this.layout.abilitySize / 2,
                y + this.layout.abilitySize + 10
            );
        });
    }
    
    renderTimer() {
        if (!this.gameData.matchTime) return;
        
        const ctx = this.ctx;
        const x = this.canvas.width / 2;
        const y = 60;
        
        // Format time
        const totalSeconds = Math.floor(this.gameData.matchTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Timer text
        ctx.font = this.fonts.medium;
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'center';
        ctx.fillText(timeString, x, y);
    }
    
    renderKillFeed() {
        const ctx = this.ctx;
        const x = this.canvas.width - this.layout.padding - 250;
        const startY = 200;
        
        this.killFeedMessages.forEach((msg, index) => {
            const y = startY + index * 25;
            const alpha = Math.min(1, msg.lifetime / 1000);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // Background
            ctx.fillStyle = this.colors.background;
            ctx.fillRect(x, y, 250, 22);
            
            // Message
            ctx.font = this.fonts.small;
            ctx.fillStyle = msg.isKill ? this.colors.health : this.colors.enemy;
            ctx.textAlign = 'left';
            ctx.fillText(msg.text, x + 5, y + 14);
            
            ctx.restore();
        });
    }
    
    renderCrosshair() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const size = this.crosshair.size + this.crosshair.currentExpansion * 10;
        const gap = this.crosshair.gap;
        
        ctx.strokeStyle = this.crosshair.color;
        ctx.lineWidth = this.crosshair.thickness;
        
        // Top line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - size);
        ctx.lineTo(centerX, centerY - gap);
        ctx.stroke();
        
        // Bottom line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + gap);
        ctx.lineTo(centerX, centerY + size);
        ctx.stroke();
        
        // Left line
        ctx.beginPath();
        ctx.moveTo(centerX - size, centerY);
        ctx.lineTo(centerX - gap, centerY);
        ctx.stroke();
        
        // Right line
        ctx.beginPath();
        ctx.moveTo(centerX + gap, centerY);
        ctx.lineTo(centerX + size, centerY);
        ctx.stroke();
        
        // Center dot
        ctx.fillStyle = this.crosshair.color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 1, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderSpeedometer() {
        const ctx = this.ctx;
        const x = this.layout.padding;
        const y = this.canvas.height - 100;

        // Support both {vx, vy} and {velocity:{x,y}}
        const vx = (typeof this.playerBot.vx === 'number') ? this.playerBot.vx :
                   (this.playerBot.velocity && typeof this.playerBot.velocity.x === 'number') ? this.playerBot.velocity.x : 0;
        const vy = (typeof this.playerBot.vy === 'number') ? this.playerBot.vy :
                   (this.playerBot.velocity && typeof this.playerBot.velocity.y === 'number') ? this.playerBot.velocity.y : 0;

        const speed = Math.sqrt(vx * vx + vy * vy);
        const maxSpeed = (this.playerBot.currentStats && this.playerBot.currentStats.speed) ||
                         this.playerBot.maxSpeed || 5;
        const speedPercent = Math.min(1, speed / Math.max(0.0001, maxSpeed));
        
        // Speed bar background
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(x, y, 150, 20);
        
        // Speed bar fill
        const speedColor = speedPercent > 0.8 ? '#ef4444' : '#3b82f6';
        ctx.fillStyle = speedColor;
        ctx.fillRect(x + 2, y + 2, 146 * speedPercent, 16);
        
        // Speed text
        ctx.font = this.fonts.tiny;
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(speed * 20)} km/h`, x + 75, y + 13);
    }
    
    renderXPBar() {
        if (!this.gameData.progression) return;
        
        const ctx = this.ctx;
        const x = this.layout.padding;
        const y = this.canvas.height - 140;
        const width = 200;
        const height = 8;
        
        const xpPercent = this.xpAnimation.current / this.gameData.progression.nextLevelXP;
        
        // Background
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(x, y, width, height);
        
        // XP fill
        ctx.fillStyle = this.colors.xp;
        ctx.fillRect(x, y, width * xpPercent, height);
        
        // Level text
        ctx.font = this.fonts.small;
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'left';
        ctx.fillText(`Level ${this.gameData.progression.level}`, x, y - 5);
        
        // XP text
        ctx.font = this.fonts.tiny;
        ctx.fillStyle = this.colors.textDim;
        ctx.fillText(
            `${Math.floor(this.xpAnimation.current)} / ${this.gameData.progression.nextLevelXP} XP`,
            x, y + height + 12
        );
    }
    
    renderControlsHint() {
        const ctx = this.ctx;
        const width = 190;
        const height = 140;
        const x = this.canvas.width - width - this.layout.padding;
        const y = this.canvas.height / 2 - height / 2;

        // Background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(x, y, width, height);

        // Border
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Title
        ctx.font = this.fonts.small;
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'left';
        ctx.fillText('Controls', x + 10, y + 20);

        // Lines
        ctx.font = this.fonts.tiny;
        ctx.fillStyle = this.colors.textDim;
        const lines = [
            'Move: WASD or Click',
            'Aim: Mouse',
            'Primary: Left Click',
            'Secondary: Right Click',
            'Ability: Space',
            'Pause: ESC',
            'Menu: M'
        ];
        lines.forEach((t, i) => ctx.fillText(t, x + 10, y + 40 + i * 16));
    }

    renderBackButton() {
        const ctx = this.ctx;
        const w = 100;
        const h = 28;
        const x = this.canvas.width - this.layout.padding - w;
        const y = this.layout.padding;

        // Button background
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(x, y, w, h);

        // Border
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);

        // Text
        ctx.font = this.fonts.small;
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Menu', x + w / 2, y + h / 2);

        // Cache rect for hit-testing this frame
        this._backBtnRect = { x, y, w, h };
    }

    renderPlayerList() {
        if (!this.gameData.players || this.gameData.players.length <= 1) return;
        
        const ctx = this.ctx;
        const x = this.layout.padding;
        const y = 100;
        
        ctx.font = this.fonts.small;
        ctx.textAlign = 'left';
        
        this.gameData.players.forEach((player, index) => {
            const playerY = y + index * 25;
            
            // Player indicator
            const isCurrentPlayer = player.id === this.playerBot.id;
            ctx.fillStyle = isCurrentPlayer ? this.colors.ally : this.colors.enemy;
            ctx.beginPath();
            ctx.arc(x + 5, playerY, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Player name
            ctx.fillStyle = this.colors.text;
            ctx.fillText(player.name || `Player ${index + 1}`, x + 15, playerY + 4);
            
            // Player stats
            ctx.fillStyle = this.colors.textDim;
            ctx.fillText(`${player.kills}/${player.deaths}`, x + 120, playerY + 4);
            
            // Health bar
            if (player.health && player.maxHealth) {
                const healthPercent = player.health / player.maxHealth;
                ctx.fillStyle = this.colors.background;
                ctx.fillRect(x + 15, playerY + 8, 100, 4);
                ctx.fillStyle = healthPercent > 0.3 ? this.colors.health : this.colors.healthLow;
                ctx.fillRect(x + 15, playerY + 8, 100 * healthPercent, 4);
            }
        });
    }
    
    renderDamageNumbers() {
        const ctx = this.ctx;
        
        this.damageNumbers.forEach(dmg => {
            ctx.save();
            ctx.globalAlpha = dmg.alpha;
            
            // Determine color based on damage type
            let color = this.colors.enemy;
            if (dmg.type === 'heal') color = this.colors.health;
            if (dmg.type === 'critical') color = '#fbbf24';
            
            ctx.font = dmg.type === 'critical' ? this.fonts.large : this.fonts.medium;
            ctx.fillStyle = color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.textAlign = 'center';
            
            // Draw text with outline
            ctx.strokeText(dmg.text, dmg.x, dmg.y);
            ctx.fillText(dmg.text, dmg.x, dmg.y);
            
            ctx.restore();
        });
    }
    
    renderHitIndicators() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.hitIndicators.forEach(hit => {
            ctx.save();
            ctx.globalAlpha = hit.alpha * 0.5;
            
            // Calculate direction to damage source
            const angle = Math.atan2(hit.y - centerY, hit.x - centerX);
            const distance = 100;
            
            // Draw directional indicator
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            
            ctx.fillStyle = this.colors.enemy;
            ctx.beginPath();
            ctx.moveTo(distance, -20);
            ctx.lineTo(distance + 30, 0);
            ctx.lineTo(distance, 20);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    renderNotifications() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const startY = 150;
        
        this.notifications.forEach((notif, index) => {
            const y = startY + index * 40;
            const alpha = Math.min(1, notif.lifetime / 1000);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // Background
            ctx.fillStyle = this.colors.background;
            ctx.fillRect(centerX - 150, y, 300, 35);
            
            // Border
            ctx.strokeStyle = notif.color || this.colors.border;
            ctx.lineWidth = 2;
            ctx.strokeRect(centerX - 150, y, 300, 35);
            
            // Icon
            if (notif.icon) {
                ctx.font = this.fonts.medium;
                ctx.fillStyle = notif.color || this.colors.text;
                ctx.textAlign = 'center';
                ctx.fillText(notif.icon, centerX - 120, y + 22);
            }
            
            // Text
            ctx.font = this.fonts.normal;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'center';
            ctx.fillText(notif.text, centerX, y + 22);
            
            ctx.restore();
        });
    }
    
    handleClick(x, y) {
        // Back button click area
        const rect = this._backBtnRect || {
            x: this.canvas.width - this.layout.padding - 100,
            y: this.layout.padding,
            w: 100,
            h: 28
        };
        if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
            if (typeof this.onBack === 'function') {
                this.onBack();
            }
        }
    }

    renderLowHealthOverlay() {
        const ctx = this.ctx;
        const healthPercent = this.playerBot.health / this.playerBot.maxHealth;
        const alpha = (0.3 - healthPercent) * 2;
        
        // Red vignette effect
        const gradient = ctx.createRadialGradient(
            this.canvas.width / 2,
            this.canvas.height / 2,
            0,
            this.canvas.width / 2,
            this.canvas.height / 2,
            Math.max(this.canvas.width, this.canvas.height) / 2
        );
        
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
        gradient.addColorStop(0.7, `rgba(239, 68, 68, ${alpha * 0.2})`);
        gradient.addColorStop(1, `rgba(239, 68, 68, ${alpha * 0.4})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Pulse effect on edges
        const pulse = Math.sin(this.animationTime * 0.01) * 0.2 + 0.8;
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * pulse})`;
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Public methods for game integration
    addDamageNumber(x, y, damage, type = 'normal') {
        this.damageNumbers.push({
            x: x,
            y: y,
            text: Math.floor(damage).toString(),
            type: type,
            lifetime: 1500,
            alpha: 1
        });
    }
    
    addKillFeedMessage(text, isKill = false) {
        this.killFeedMessages.push({
            text: text,
            isKill: isKill,
            lifetime: 5000
        });
        
        // Keep only last 5 messages
        if (this.killFeedMessages.length > 5) {
            this.killFeedMessages.shift();
        }
    }
    
    addNotification(text, icon = null, color = null) {
        this.notifications.push({
            text: text,
            icon: icon,
            color: color,
            lifetime: 3000
        });
        
        // Keep only last 3 notifications
        if (this.notifications.length > 3) {
            this.notifications.shift();
        }
    }
    
    addHitIndicator(x, y) {
        this.hitIndicators.push({
            x: x,
            y: y,
            lifetime: 1000,
            alpha: 1
        });
    }
    
    onFire() {
        this.crosshair.expandOnFire = true;
        this.crosshair.currentExpansion = 1;
    }
    
    setElementVisibility(element, visible) {
        if (this.elements.hasOwnProperty(element)) {
            this.elements[element] = visible;
        }
    }
    
    reset() {
        this.damageNumbers = [];
        this.killFeedMessages = [];
        this.notifications = [];
        this.hitIndicators = [];
        this.healthAnimation = { current: 100, target: 100 };
        this.xpAnimation = { current: 0, target: 0 };
        this.crosshair.currentExpansion = 0;
    }
}

// Export singleton instance
export default HUDSystem;
