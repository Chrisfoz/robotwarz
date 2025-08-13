/**
 * Menu System - Main menu and navigation UI
 */

export class MenuSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Menu states
        this.currentMenu = 'MAIN';
        this.previousMenu = null;
        
        // Menu options
        this.menus = {
            MAIN: {
                title: '',
                options: [
                    { text: 'Single Player', action: 'START_SINGLE' },
                    { text: 'Multiplayer', action: 'MULTIPLAYER_MENU' },
                    { text: 'Bot Selection', action: 'BOT_SELECT' },
                    { text: 'Upgrades', action: 'UPGRADES_MENU' },
                    { text: 'Profile', action: 'PROFILE_MENU' },
                    { text: 'Settings', action: 'SETTINGS_MENU' },
                    { text: 'Credits', action: 'CREDITS_MENU' },
                    { text: 'Exit', action: 'EXIT' }
                ]
            },
            MULTIPLAYER: {
                title: 'MULTIPLAYER',
                options: [
                    { text: 'Host Game', action: 'HOST_GAME' },
                    { text: 'Join Game', action: 'JOIN_GAME' },
                    { text: 'Quick Match', action: 'QUICK_MATCH' },
                    { text: 'Private Match', action: 'PRIVATE_MATCH' },
                    { text: 'Tournament', action: 'TOURNAMENT_MENU' },
                    { text: 'Back', action: 'BACK' }
                ]
            },
            BOT_SELECT: {
                title: 'SELECT YOUR BOT',
                options: [
                    { text: 'TITAN - Heavy Tank', action: 'SELECT_TITAN', locked: false },
                    { text: 'VIPER - Speed Assassin', action: 'SELECT_VIPER', locked: false },
                    { text: 'SNIPER - Long Range', action: 'SELECT_SNIPER', locked: false },
                    { text: 'TANK - Fortress', action: 'SELECT_TANK', locked: true, unlockLevel: 10 },
                    { text: 'ASSASSIN - Stealth', action: 'SELECT_ASSASSIN', locked: true, unlockLevel: 15 },
                    { text: 'Customize Loadout', action: 'LOADOUT_MENU' },
                    { text: 'Back', action: 'BACK' }
                ]
            },
            PROFILE: {
                title: 'PLAYER PROFILE',
                options: [
                    { text: 'Statistics', action: 'STATS_VIEW' },
                    { text: 'Achievements', action: 'ACHIEVEMENTS_VIEW' },
                    { text: 'Match History', action: 'HISTORY_VIEW' },
                    { text: 'Leaderboards', action: 'LEADERBOARDS' },
                    { text: 'Reset Progress', action: 'RESET_CONFIRM' },
                    { text: 'Back', action: 'BACK' }
                ]
            },
            SETTINGS: {
                title: 'SETTINGS',
                options: [
                    { text: 'Graphics', action: 'GRAPHICS_SETTINGS' },
                    { text: 'Audio', action: 'AUDIO_SETTINGS' },
                    { text: 'Controls', action: 'CONTROLS_SETTINGS' },
                    { text: 'Gameplay', action: 'GAMEPLAY_SETTINGS' },
                    { text: 'Back', action: 'BACK' }
                ]
            },
            PAUSE: {
                title: 'PAUSED',
                options: [
                    { text: 'Resume', action: 'RESUME' },
                    { text: 'Restart', action: 'RESTART' },
                    { text: 'Settings', action: 'SETTINGS_MENU' },
                    { text: 'Main Menu', action: 'MAIN_MENU' }
                ]
            },
            GAME_OVER: {
                title: 'GAME OVER',
                options: [
                    { text: 'Play Again', action: 'RESTART' },
                    { text: 'View Stats', action: 'MATCH_STATS' },
                    { text: 'Change Bot', action: 'BOT_SELECT' },
                    { text: 'Main Menu', action: 'MAIN_MENU' }
                ]
            },
            VICTORY: {
                title: 'VICTORY!',
                options: [
                    { text: 'Next Match', action: 'NEXT_MATCH' },
                    { text: 'View Rewards', action: 'REWARDS_VIEW' },
                    { text: 'Upgrade Bot', action: 'UPGRADES_MENU' },
                    { text: 'Main Menu', action: 'MAIN_MENU' }
                ]
            }
        };
        
        // Selected option index
        this.selectedIndex = 0;
        
        // Animation values
        this.animationTime = 0;
        this.transitionProgress = 0;
        this.isTransitioning = false;
        
        // Logo images
        this.logo = null;
        this.carnage = null;
        this.loadLogo();
        
        // Visual settings
        this.colors = {
            background: '#0f1419',
            primary: '#56CCF2',
            secondary: '#3a4c67',
            accent: '#2F80ED',
            text: '#ffffff',
            textDim: '#888888',
            locked: '#444444',
            hover: '#6BD3F3',
            selected: '#8DE5FF'
        };
        
        // Font settings
        this.fonts = {
            title: 'bold 48px Arial',
            subtitle: 'bold 32px Arial',
            option: 'bold 24px Arial',
            small: '16px Arial',
            tiny: '12px Arial'
        };
        
        // Layout
        this.layout = {
            titleY: 120,
            optionsStartY: 250,
            optionSpacing: 60,
            optionWidth: 400,
            optionHeight: 50
        };
        
        // Background particles
        this.backgroundParticles = this.createBackgroundParticles();
        
        // Sound settings (for future audio implementation)
        this.sounds = {
            hover: null,
            select: null,
            back: null,
            locked: null
        };
        
        // Input handling
        this.setupInputHandlers();
        
        // Menu stack for navigation
        this.menuStack = [];
        
        // Additional UI elements
        this.notifications = [];
        this.tooltips = new Map();
    }
    
    loadLogo() {
        // Load battle bot logo
        this.logo = new Image();
        this.logo.onload = () => {
            console.log('✅ Menu logo loaded');
        };
        this.logo.onerror = () => {
            console.warn('⚠️ Failed to load menu logo');
        };
        this.logo.src = 'battle bot logo.png';
        
        // Load carnage image
        this.carnage = new Image();
        this.carnage.onload = () => {
            console.log('✅ Carnage decoration loaded');
        };
        this.carnage.onerror = () => {
            console.warn('⚠️ Failed to load carnage decoration');
        };
        this.carnage.src = 'Carnage.png';
    }
    
    createBackgroundParticles() {
        const particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.1
            });
        }
        return particles;
    }
    
    setupInputHandlers() {
        // Store bound handlers for removal
        this.boundHandlers = {
            keydown: this.handleKeyDown.bind(this),
            mousemove: this.handleMouseMove.bind(this),
            mousedown: this.handleMouseDown.bind(this)
        };
    }
    
    activate() {
        // Add event listeners when menu is active
        document.addEventListener('keydown', this.boundHandlers.keydown);
        this.canvas.addEventListener('mousemove', this.boundHandlers.mousemove);
        this.canvas.addEventListener('mousedown', this.boundHandlers.mousedown);
    }
    
    deactivate() {
        // Remove event listeners when menu is inactive
        document.removeEventListener('keydown', this.boundHandlers.keydown);
        this.canvas.removeEventListener('mousemove', this.boundHandlers.mousemove);
        this.canvas.removeEventListener('mousedown', this.boundHandlers.mousedown);
    }
    
    handleKeyDown(e) {
        const menu = this.menus[this.currentMenu];
        if (!menu) return;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.selectedIndex = (this.selectedIndex - 1 + menu.options.length) % menu.options.length;
                this.playSound('hover');
                e.preventDefault();
                break;
                
            case 'ArrowDown':
            case 's':
            case 'S':
                this.selectedIndex = (this.selectedIndex + 1) % menu.options.length;
                this.playSound('hover');
                e.preventDefault();
                break;
                
            case 'Enter':
            case ' ':
                this.selectOption(this.selectedIndex);
                e.preventDefault();
                break;
                
            case 'Escape':
                this.handleAction('BACK');
                e.preventDefault();
                break;
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const menu = this.menus[this.currentMenu];
        if (!menu) return;
        
        // Check if mouse is over any option
        menu.options.forEach((option, index) => {
            const optionY = this.layout.optionsStartY + index * this.layout.optionSpacing;
            const optionX = this.canvas.width / 2 - this.layout.optionWidth / 2;
            
            if (x >= optionX && x <= optionX + this.layout.optionWidth &&
                y >= optionY && y <= optionY + this.layout.optionHeight) {
                if (this.selectedIndex !== index) {
                    this.selectedIndex = index;
                    this.playSound('hover');
                }
            }
        });
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const menu = this.menus[this.currentMenu];
        if (!menu) return;
        
        // Check if click is on any option
        menu.options.forEach((option, index) => {
            const optionY = this.layout.optionsStartY + index * this.layout.optionSpacing;
            const optionX = this.canvas.width / 2 - this.layout.optionWidth / 2;
            
            if (x >= optionX && x <= optionX + this.layout.optionWidth &&
                y >= optionY && y <= optionY + this.layout.optionHeight) {
                this.selectedIndex = index;
                this.selectOption(index);
            }
        });
    }
    
    selectOption(index) {
        const menu = this.menus[this.currentMenu];
        if (!menu || index >= menu.options.length) return;
        
        const option = menu.options[index];
        
        // Check if option is locked
        if (option.locked) {
            this.playSound('locked');
            this.addNotification(`Unlocks at level ${option.unlockLevel}`, 'warning');
            return;
        }
        
        this.playSound('select');
        this.handleAction(option.action);
    }
    
    handleAction(action) {
        // Return the action to be handled by the game
        const callback = this.actionCallback;
        if (callback) {
            callback(action);
        }
        
        // Handle internal navigation
        switch(action) {
            case 'BACK':
                this.goBack();
                break;
                
            case 'MULTIPLAYER_MENU':
                this.navigateTo('MULTIPLAYER');
                break;
                
            case 'BOT_SELECT':
                this.navigateTo('BOT_SELECT');
                break;
                
            case 'PROFILE_MENU':
                this.navigateTo('PROFILE');
                break;
                
            case 'SETTINGS_MENU':
                this.navigateTo('SETTINGS');
                break;
                
            case 'UPGRADES_MENU':
                this.navigateTo('UPGRADES');
                break;
                
            case 'MAIN_MENU':
                this.navigateTo('MAIN');
                break;
        }
    }
    
    navigateTo(menuName) {
        if (this.currentMenu !== menuName) {
            this.menuStack.push(this.currentMenu);
            this.previousMenu = this.currentMenu;
            this.currentMenu = menuName;
            this.selectedIndex = 0;
            this.startTransition();
        }
    }
    
    goBack() {
        if (this.menuStack.length > 0) {
            this.previousMenu = this.currentMenu;
            this.currentMenu = this.menuStack.pop();
            this.selectedIndex = 0;
            this.startTransition();
        }
    }
    
    startTransition() {
        this.isTransitioning = true;
        this.transitionProgress = 0;
    }
    
    update(deltaTime) {
        // Update animation time
        this.animationTime += deltaTime;
        
        // Update transition
        if (this.isTransitioning) {
            this.transitionProgress += deltaTime * 0.005;
            if (this.transitionProgress >= 1) {
                this.transitionProgress = 1;
                this.isTransitioning = false;
            }
        }
        
        // Update background particles
        this.updateBackgroundParticles(deltaTime);
        
        // Update notifications
        this.updateNotifications(deltaTime);
    }
    
    updateBackgroundParticles(deltaTime) {
        this.backgroundParticles.forEach(particle => {
            particle.x += particle.vx * deltaTime * 0.1;
            particle.y += particle.vy * deltaTime * 0.1;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
        });
    }
    
    updateNotifications(deltaTime) {
        this.notifications = this.notifications.filter(notif => {
            notif.lifetime -= deltaTime;
            return notif.lifetime > 0;
        });
    }
    
    render() {
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render background
        this.renderBackground();
        
        // Render current menu with transition
        if (this.isTransitioning) {
            this.renderMenuTransition();
        } else {
            this.renderMenu(this.currentMenu);
        }
        
        // Render notifications
        this.renderNotifications();
        
        // Render version info
        this.renderVersionInfo();
    }
    
    renderBackground() {
        const ctx = this.ctx;
        
        // Render background particles
        ctx.save();
        this.backgroundParticles.forEach(particle => {
            ctx.fillStyle = `rgba(86, 204, 242, ${particle.opacity})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        
        // Add gradient overlay
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(15, 20, 25, 0.3)');
        gradient.addColorStop(1, 'rgba(15, 20, 25, 0.7)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderMenu(menuName) {
        const menu = this.menus[menuName];
        if (!menu) return;
        
        const ctx = this.ctx;
        
        // Draw logo in top-left corner if loaded (main menu only)
        if (menuName === 'MAIN' && this.logo && this.logo.complete) {
            ctx.save();
            ctx.globalAlpha = 0.8;
            const logoScale = 0.15;
            const logoWidth = this.logo.naturalWidth * logoScale;
            const logoHeight = this.logo.naturalHeight * logoScale;
            ctx.drawImage(this.logo, 20, 20, logoWidth, logoHeight);
            ctx.restore();
        }
        
        // Draw carnage decoration in bottom-right corner
        if (this.carnage && this.carnage.complete) {
            ctx.save();
            ctx.globalAlpha = 0.2;
            const carnageScale = 0.2;
            const carnageWidth = this.carnage.naturalWidth * carnageScale;
            const carnageHeight = this.carnage.naturalHeight * carnageScale;
            ctx.drawImage(this.carnage, 
                this.canvas.width - carnageWidth - 20, 
                this.canvas.height - carnageHeight - 20, 
                carnageWidth, carnageHeight);
            ctx.restore();
        }
        
        // Render title (optional)
        if (menu.title) {
            ctx.save();
            ctx.font = this.fonts.title;
            ctx.fillStyle = this.colors.primary;
            ctx.textAlign = 'center';
            ctx.shadowColor = this.colors.accent;
            ctx.shadowBlur = 20;
            
            // Animate title
            const titleY = this.layout.titleY + Math.sin(this.animationTime * 0.002) * 5;
            ctx.fillText(menu.title, this.canvas.width / 2, titleY);
            ctx.restore();
        }
        
        // Render options
        menu.options.forEach((option, index) => {
            this.renderOption(option, index);
        });
    }
    
    renderOption(option, index) {
        const ctx = this.ctx;
        const isSelected = index === this.selectedIndex;
        const optionY = this.layout.optionsStartY + index * this.layout.optionSpacing;
        const optionX = this.canvas.width / 2;
        
        ctx.save();
        
        // Draw option background if selected
        if (isSelected) {
            const bgX = optionX - this.layout.optionWidth / 2;
            const gradient = ctx.createLinearGradient(bgX, optionY, bgX + this.layout.optionWidth, optionY);
            gradient.addColorStop(0, 'rgba(86, 204, 242, 0.1)');
            gradient.addColorStop(0.5, 'rgba(86, 204, 242, 0.3)');
            gradient.addColorStop(1, 'rgba(86, 204, 242, 0.1)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(bgX, optionY, this.layout.optionWidth, this.layout.optionHeight);
            
            // Draw selection border
            ctx.strokeStyle = this.colors.primary;
            ctx.lineWidth = 2;
            ctx.strokeRect(bgX, optionY, this.layout.optionWidth, this.layout.optionHeight);
            
            // Add glow effect
            ctx.shadowColor = this.colors.primary;
            ctx.shadowBlur = 10;
        }
        
        // Set text properties
        ctx.font = this.fonts.option;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Set color based on state
        if (option.locked) {
            ctx.fillStyle = this.colors.locked;
        } else if (isSelected) {
            ctx.fillStyle = this.colors.selected;
            // Add pulsing effect for selected
            const pulse = Math.sin(this.animationTime * 0.005) * 0.2 + 0.8;
            ctx.globalAlpha = pulse;
        } else {
            ctx.fillStyle = this.colors.text;
        }
        
        // Draw text
        ctx.fillText(option.text, optionX, optionY + this.layout.optionHeight / 2);
        
        // Draw lock icon if locked
        if (option.locked) {
            ctx.font = this.fonts.small;
            ctx.fillStyle = this.colors.locked;
            ctx.fillText('🔒', optionX + this.layout.optionWidth / 2 - 30, optionY + this.layout.optionHeight / 2);
        }
        
        // Draw unlock level if applicable
        if (option.locked && option.unlockLevel) {
            ctx.font = this.fonts.tiny;
            ctx.fillStyle = this.colors.textDim;
            ctx.fillText(`Level ${option.unlockLevel}`, optionX, optionY + this.layout.optionHeight - 5);
        }
        
        ctx.restore();
    }
    
    renderMenuTransition() {
        const ctx = this.ctx;
        const progress = this.easeInOutCubic(this.transitionProgress);
        
        // Fade out previous menu
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.translate(-this.canvas.width * progress * 0.2, 0);
        this.renderMenu(this.previousMenu);
        ctx.restore();
        
        // Fade in current menu
        ctx.save();
        ctx.globalAlpha = progress;
        ctx.translate(this.canvas.width * (1 - progress) * 0.2, 0);
        this.renderMenu(this.currentMenu);
        ctx.restore();
    }
    
    renderNotifications() {
        const ctx = this.ctx;
        
        this.notifications.forEach((notif, index) => {
            ctx.save();
            
            const alpha = Math.min(1, notif.lifetime / 1000);
            ctx.globalAlpha = alpha;
            
            const y = 100 + index * 40;
            
            // Background
            ctx.fillStyle = notif.type === 'warning' ? 'rgba(255, 165, 0, 0.2)' : 'rgba(86, 204, 242, 0.2)';
            ctx.fillRect(this.canvas.width - 320, y, 300, 35);
            
            // Border
            ctx.strokeStyle = notif.type === 'warning' ? '#FFA500' : this.colors.primary;
            ctx.lineWidth = 1;
            ctx.strokeRect(this.canvas.width - 320, y, 300, 35);
            
            // Text
            ctx.font = this.fonts.small;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(notif.text, this.canvas.width - 170, y + 17);
            
            ctx.restore();
        });
    }
    
    renderVersionInfo() {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.font = this.fonts.tiny;
        ctx.fillStyle = this.colors.textDim;
        ctx.textAlign = 'right';
        ctx.fillText('v1.0.0', this.canvas.width - 10, this.canvas.height - 10);
        ctx.restore();
    }
    
    addNotification(text, type = 'info') {
        this.notifications.push({
            text: text,
            type: type,
            lifetime: 3000
        });
    }
    
    playSound(soundName) {
        // Placeholder for sound effects
        if (this.sounds[soundName]) {
            // this.sounds[soundName].play();
        }
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    setActionCallback(callback) {
        this.actionCallback = callback;
    }
    
    showPauseMenu() {
        this.navigateTo('PAUSE');
    }
    
    showGameOverMenu(victory = false) {
        this.navigateTo(victory ? 'VICTORY' : 'GAME_OVER');
    }
    
    reset() {
        this.currentMenu = 'MAIN';
        this.selectedIndex = 0;
        this.menuStack = [];
        this.notifications = [];
    }
    
    // Get current menu state
    getCurrentMenu() {
        return this.currentMenu;
    }
    
    // Check if menu is active
    isActive() {
        return this.currentMenu !== null;
    }
    
    // Update bot selection menu based on unlocks
    updateBotUnlocks(unlockedBots) {
        const botMenu = this.menus.BOT_SELECT;
        if (!botMenu) return;
        
        botMenu.options.forEach(option => {
            if (option.action && option.action.startsWith('SELECT_')) {
                const botName = option.action.replace('SELECT_', '');
                option.locked = !unlockedBots.includes(botName);
            }
        });
    }
}

// Export singleton instance
export default MenuSystem;
