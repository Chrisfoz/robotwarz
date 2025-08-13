/**
 * Controls Overlay System - Always-visible control hints for players
 */

export class ControlsOverlay {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Display settings
        this.enabled = true;
        this.position = 'bottom-left'; // 'bottom-left', 'bottom-right', 'top-left', 'top-right'
        this.style = 'compact'; // 'compact', 'full', 'minimal'
        this.opacity = 1.0;
        this.fadeAfterTime = 30000; // Start fading after 30 seconds
        this.fadeStartTime = null;
        
        // Check if player wants controls hidden
        this.userPreference = localStorage.getItem('battlebots_show_controls') !== 'false';
        
        // Visual settings
        this.colors = {
            background: 'rgba(15, 23, 42, 0.85)',
            border: '#56CCF2',
            text: '#ffffff',
            textDim: '#94a3b8',
            keyBackground: 'rgba(86, 204, 242, 0.2)',
            keyBorder: '#56CCF2',
            keyText: '#56CCF2',
            headerText: '#56CCF2',
            iconColor: '#fbbf24'
        };
        
        // Control definitions
        this.controls = {
            movement: {
                icon: '🎮',
                title: 'MOVEMENT',
                keys: [
                    { key: 'W', action: 'Up' },
                    { key: 'A', action: 'Left' },
                    { key: 'S', action: 'Down' },
                    { key: 'D', action: 'Right' },
                    { key: 'Click', action: 'Move to' }
                ]
            },
            combat: {
                icon: '⚔️',
                title: 'COMBAT',
                keys: [
                    { key: 'Q', action: 'Melee', color: '#ef4444' },
                    { key: 'E', action: 'Ranged', color: '#3b82f6' },
                    { key: 'Space', action: 'Ability', color: '#a855f7' }
                ]
            },
            utility: {
                icon: '⚙️',
                title: 'UTILITY',
                keys: [
                    { key: 'ESC', action: 'Pause' },
                    { key: 'M', action: 'Menu' },
                    { key: 'Tab', action: 'Score' }
                ]
            }
        };
        
        // Animation
        this.pulseAnimation = 0;
        this.showAnimation = 0;
        
        // Tracking
        this.keysPressed = new Set();
        this.lastKeyPressTime = {};
        
        // Setup event listeners for visual feedback
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keysPressed.add(key);
            this.lastKeyPressTime[key] = Date.now();
            
            // Reset fade timer when player uses controls
            this.fadeStartTime = Date.now();
        });
        
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keysPressed.delete(key);
        });
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('battlebots_show_controls', enabled ? 'true' : 'false');
    }
    
    setStyle(style) {
        this.style = style;
    }
    
    setPosition(position) {
        this.position = position;
    }
    
    update(deltaTime) {
        if (!this.enabled || !this.userPreference) return;
        
        // Update animations
        this.pulseAnimation += deltaTime * 0.002;
        this.showAnimation = Math.min(1, this.showAnimation + deltaTime * 0.005);
        
        // Handle fading
        if (!this.fadeStartTime) {
            this.fadeStartTime = Date.now();
        }
        
        const timeSinceStart = Date.now() - this.fadeStartTime;
        if (timeSinceStart > this.fadeAfterTime) {
            const fadeTime = timeSinceStart - this.fadeAfterTime;
            this.opacity = Math.max(0.3, 1 - (fadeTime / 10000)); // Fade to 30% over 10 seconds
        } else {
            this.opacity = 1.0;
        }
    }
    
    render() {
        if (!this.enabled || !this.userPreference || this.showAnimation < 0.1) return;
        
        const ctx = this.ctx;
        ctx.save();
        
        // Apply overall opacity
        ctx.globalAlpha = this.opacity * this.showAnimation;
        
        switch (this.style) {
            case 'compact':
                this.renderCompact();
                break;
            case 'full':
                this.renderFull();
                break;
            case 'minimal':
                this.renderMinimal();
                break;
        }
        
        ctx.restore();
    }
    
    renderCompact() {
        const ctx = this.ctx;
        const padding = 20;
        const boxWidth = 280;
        const boxHeight = 180;
        
        // Calculate position
        let x, y;
        switch (this.position) {
            case 'bottom-left':
                x = padding;
                y = this.canvas.height - boxHeight - padding;
                break;
            case 'bottom-right':
                x = this.canvas.width - boxWidth - padding;
                y = this.canvas.height - boxHeight - padding;
                break;
            case 'top-left':
                x = padding;
                y = padding + 60; // Account for other UI
                break;
            case 'top-right':
                x = this.canvas.width - boxWidth - padding;
                y = padding + 60;
                break;
        }
        
        // Background
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(x, y, boxWidth, boxHeight);
        
        // Border
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, boxWidth, boxHeight);
        
        // Title
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = this.colors.headerText;
        ctx.textAlign = 'center';
        ctx.fillText('CONTROLS', x + boxWidth / 2, y + 25);
        
        // Compact layout - two columns
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';
        
        // Movement column
        let currentY = y + 50;
        ctx.fillStyle = this.colors.iconColor;
        ctx.fillText('🎮', x + 15, currentY);
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Move: WASD/Click', x + 35, currentY);
        
        // Combat rows
        currentY += 25;
        ctx.fillStyle = this.colors.iconColor;
        ctx.fillText('⚔️', x + 15, currentY);
        
        // Melee
        this.renderKey(ctx, 'Q', x + 35, currentY - 10, this.isKeyPressed('q'), '#ef4444');
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Melee', x + 60, currentY);
        
        // Ranged
        this.renderKey(ctx, 'E', x + 110, currentY - 10, this.isKeyPressed('e'), '#3b82f6');
        ctx.fillText('Ranged', x + 135, currentY);
        
        // Ability
        currentY += 25;
        this.renderKey(ctx, 'Space', x + 35, currentY - 10, this.isKeyPressed(' '), '#a855f7');
        ctx.fillStyle = this.colors.text;
        ctx.fillText('Special Ability', x + 85, currentY);
        
        // Utility
        currentY += 25;
        ctx.fillStyle = this.colors.iconColor;
        ctx.fillText('⚙️', x + 15, currentY);
        ctx.fillStyle = this.colors.textDim;
        ctx.font = '12px Arial';
        ctx.fillText('ESC: Pause • M: Menu • Tab: Score', x + 35, currentY);
        
        // Tip at bottom
        currentY += 20;
        ctx.fillStyle = this.colors.textDim;
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Controls fade after 30s (Press H to toggle)', x + boxWidth / 2, currentY);
    }
    
    renderMinimal() {
        const ctx = this.ctx;
        const padding = 15;
        
        // Just show key hints inline
        ctx.font = '12px Arial';
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'left';
        
        const y = this.canvas.height - padding - 20;
        const x = padding;
        
        // Single line of controls
        const controls = 'Move: WASD • Melee: Q • Ranged: E • Ability: Space • Pause: ESC';
        
        // Background strip
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        const textWidth = ctx.measureText(controls).width;
        ctx.fillRect(x - 5, y - 15, textWidth + 10, 25);
        
        ctx.fillStyle = this.colors.text;
        ctx.fillText(controls, x, y);
    }
    
    renderFull() {
        const ctx = this.ctx;
        const padding = 20;
        const boxWidth = 350;
        const boxHeight = 280;
        
        // Position (always bottom-left for full)
        const x = padding;
        const y = this.canvas.height - boxHeight - padding;
        
        // Background with gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + boxHeight);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, boxWidth, boxHeight);
        
        // Animated border
        const pulse = Math.sin(this.pulseAnimation) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(86, 204, 242, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, boxWidth, boxHeight);
        
        // Title with icon
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = this.colors.headerText;
        ctx.textAlign = 'center';
        ctx.fillText('🎮 BATTLE CONTROLS 🎮', x + boxWidth / 2, y + 30);
        
        // Render each section
        let currentY = y + 60;
        
        // Movement section
        this.renderControlSection(ctx, x + 20, currentY, this.controls.movement);
        currentY += 80;
        
        // Combat section
        this.renderControlSection(ctx, x + 20, currentY, this.controls.combat);
        currentY += 70;
        
        // Utility section
        this.renderControlSection(ctx, x + 20, currentY, this.controls.utility);
    }
    
    renderControlSection(ctx, x, y, section) {
        // Section header
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = this.colors.headerText;
        ctx.textAlign = 'left';
        ctx.fillText(section.icon + ' ' + section.title, x, y);
        
        // Keys
        ctx.font = '12px Arial';
        let currentX = x + 10;
        let currentY = y + 20;
        
        section.keys.forEach((control, index) => {
            if (index > 0 && index % 3 === 0) {
                currentY += 25;
                currentX = x + 10;
            }
            
            const isPressed = this.isKeyPressed(control.key.toLowerCase());
            const color = control.color || this.colors.keyBorder;
            
            this.renderKey(ctx, control.key, currentX, currentY, isPressed, color);
            
            ctx.fillStyle = this.colors.text;
            ctx.font = '11px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(control.action, currentX + 30, currentY + 10);
            
            currentX += 100;
        });
    }
    
    renderKey(ctx, key, x, y, isPressed, color = this.colors.keyBorder) {
        const width = key.length > 3 ? 45 : 20;
        const height = 20;
        
        // Key background
        if (isPressed) {
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(x, y, width, height);
            ctx.globalAlpha = this.opacity * this.showAnimation;
        } else {
            ctx.fillStyle = this.colors.keyBackground;
            ctx.fillRect(x, y, width, height);
        }
        
        // Key border
        ctx.strokeStyle = isPressed ? color : this.colors.keyBorder;
        ctx.lineWidth = isPressed ? 2 : 1;
        ctx.strokeRect(x, y, width, height);
        
        // Key text
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = isPressed ? color : this.colors.keyText;
        ctx.textAlign = 'center';
        ctx.fillText(key, x + width / 2, y + 14);
    }
    
    isKeyPressed(key) {
        // Check if key was pressed recently (for visual feedback)
        const lastPress = this.lastKeyPressTime[key];
        if (lastPress && Date.now() - lastPress < 200) {
            return true;
        }
        return this.keysPressed.has(key);
    }
    
    toggleVisibility() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }
    
    cycleStyle() {
        const styles = ['compact', 'full', 'minimal'];
        const currentIndex = styles.indexOf(this.style);
        this.style = styles[(currentIndex + 1) % styles.length];
        return this.style;
    }
    
    cyclePosition() {
        const positions = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];
        const currentIndex = positions.indexOf(this.position);
        this.position = positions[(currentIndex + 1) % positions.length];
        return this.position;
    }
}