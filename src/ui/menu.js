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
        
        // Menu options with improved hierarchy and styling
        this.menus = {
            MAIN: {
                title: '',
                primaryActions: [
                    { text: 'QUICK PLAY', action: 'QUICK_PLAY', isPrimary: true, description: 'Jump straight into battle!' },
                    { text: 'SINGLE PLAYER', action: 'START_SINGLE', isPrimary: true, description: 'Train against AI opponents' }
                ],
                secondaryActions: [
                    { text: 'Multiplayer', action: 'MULTIPLAYER_MENU', icon: '👥', description: 'Battle other players' },
                    { text: 'Bot Selection', action: 'BOT_SELECT', icon: '🤖', description: 'Choose your fighter' },
                    { text: 'Upgrades', action: 'UPGRADES_MENU', icon: '⚡', description: 'Enhance your bot' },
                    { text: 'Profile', action: 'PROFILE_MENU', icon: '📊', description: 'View your stats' }
                ],
                tertiaryActions: [
                    { text: 'Tutorial', action: 'TUTORIAL', icon: '🎓' },
                    { text: 'Settings', action: 'SETTINGS_MENU', icon: '⚙️' },
                    { text: 'Credits', action: 'CREDITS_MENU', icon: 'ℹ️' }
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
        
        // Enhanced visual settings
        this.colors = {
            background: '#0f1419',
            backgroundOverlay: 'rgba(15, 20, 25, 0.85)',
            primary: '#56CCF2',
            primaryGlow: 'rgba(86, 204, 242, 0.4)',
            secondary: '#3a4c67',
            accent: '#2F80ED',
            accentBright: '#4FC3F7',
            text: '#ffffff',
            textDim: '#888888',
            textBright: '#E3F2FD',
            locked: '#444444',
            hover: '#6BD3F3',
            selected: '#8DE5FF',
            primaryButton: '#FF6B35',
            primaryButtonHover: '#FF8A65',
            primaryButtonGlow: 'rgba(255, 107, 53, 0.6)',
            secondaryButton: 'rgba(86, 204, 242, 0.15)',
            secondaryButtonHover: 'rgba(86, 204, 242, 0.25)',
            border: 'rgba(86, 204, 242, 0.3)',
            borderBright: 'rgba(86, 204, 242, 0.8)'
        };
        
        // Font settings
        this.fonts = {
            title: 'bold 48px Arial',
            subtitle: 'bold 32px Arial',
            option: 'bold 24px Arial',
            small: '16px Arial',
            tiny: '12px Arial'
        };
        
        // Enhanced layout with better spacing and hierarchy
        this.layout = {
            titleY: 120,
            logoMaxHeight: 150,
            primaryButtonsStartY: 280,
            primaryButtonSpacing: 70,
            primaryButtonWidth: 320,
            primaryButtonHeight: 55,
            secondaryButtonsStartY: 420,
            secondaryButtonSpacing: 45,
            secondaryButtonWidth: 280,
            secondaryButtonHeight: 40,
            tertiaryButtonsStartY: 550,
            tertiaryButtonSpacing: 35,
            tertiaryButtonWidth: 120,
            tertiaryButtonHeight: 30,
            sidebarWidth: 250,
            playerStatsX: 50,
            playerStatsY: 80
        };
        
        // Enhanced background elements
        this.backgroundParticles = this.createBackgroundParticles();
        this.floatingBots = this.createFloatingBots();
        this.energyGrid = this.createEnergyGrid();
        this.pulsingElements = [];
        
        // Animation states
        this.logoScale = 1;
        this.logoGlow = 0;
        this.buttonAnimations = new Map();
        
        // Player stats for display
        this.playerStats = {
            level: 1,
            xp: 0,
            totalMatches: 0,
            wins: 0,
            credits: 1000,
            selectedBot: 'TITAN'
        };
        
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
        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                size: Math.random() * 4 + 1,
                opacity: Math.random() * 0.6 + 0.1,
                color: Math.random() > 0.7 ? this.colors.accent : this.colors.primary,
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.002 + Math.random() * 0.003
            });
        }
        return particles;
    }
    
    createFloatingBots() {
        const bots = [];
        for (let i = 0; i < 6; i++) {
            bots.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: 15 + Math.random() * 10,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.002,
                opacity: 0.1 + Math.random() * 0.15,
                color: Object.values(this.colors).filter(c => c.startsWith('#'))[Math.floor(Math.random() * 3)]
            });
        }
        return bots;
    }
    
    createEnergyGrid() {
        const gridLines = [];
        const spacing = 60;
        
        // Vertical lines
        for (let x = 0; x < this.canvas.width; x += spacing) {
            gridLines.push({
                type: 'vertical',
                x: x,
                opacity: 0.05 + Math.random() * 0.1,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
        
        // Horizontal lines
        for (let y = 0; y < this.canvas.height; y += spacing) {
            gridLines.push({
                type: 'horizontal',
                y: y,
                opacity: 0.05 + Math.random() * 0.1,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
        
        return gridLines;
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
        
        const totalOptions = this.getTotalOptionsCount(this.currentMenu);
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.selectedIndex = (this.selectedIndex - 1 + totalOptions) % totalOptions;
                this.playSound('hover');
                e.preventDefault();
                break;
                
            case 'ArrowDown':
            case 's':
            case 'S':
                this.selectedIndex = (this.selectedIndex + 1) % totalOptions;
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
    
    getTotalOptionsCount(menuName) {
        const menu = this.menus[menuName];
        if (!menu) return 0;
        
        if (menuName === 'MAIN') {
            return menu.primaryActions.length + menu.secondaryActions.length + menu.tertiaryActions.length;
        } else {
            return menu.options ? menu.options.length : 0;
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
        
        if (this.currentMenu === 'MAIN') {
            this.handleMainMenuMouseMove(x, y);
        } else {
            this.handleSubMenuMouseMove(x, y);
        }
    }
    
    handleMainMenuMouseMove(x, y) {
        const menu = this.menus.MAIN;
        let currentIndex = 0;
        let newSelectedIndex = -1;
        
        // Check primary buttons
        menu.primaryActions.forEach((action, index) => {
            const buttonY = this.layout.primaryButtonsStartY + index * this.layout.primaryButtonSpacing;
            const buttonX = this.canvas.width / 2 - this.layout.primaryButtonWidth / 2;
            
            if (x >= buttonX && x <= buttonX + this.layout.primaryButtonWidth &&
                y >= buttonY && y <= buttonY + this.layout.primaryButtonHeight) {
                newSelectedIndex = currentIndex;
            }
            currentIndex++;
        });
        
        // Check secondary buttons
        menu.secondaryActions.forEach((action, index) => {
            const buttonY = this.layout.secondaryButtonsStartY + index * this.layout.secondaryButtonSpacing;
            const buttonX = this.canvas.width / 2 - this.layout.secondaryButtonWidth / 2;
            
            if (x >= buttonX && x <= buttonX + this.layout.secondaryButtonWidth &&
                y >= buttonY && y <= buttonY + this.layout.secondaryButtonHeight) {
                newSelectedIndex = currentIndex;
            }
            currentIndex++;
        });
        
        // Check tertiary buttons
        const buttonsPerRow = 3;
        const buttonSpacing = 10;
        const totalWidth = buttonsPerRow * this.layout.tertiaryButtonWidth + (buttonsPerRow - 1) * buttonSpacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        
        menu.tertiaryActions.forEach((action, index) => {
            const buttonX = startX + (index % buttonsPerRow) * (this.layout.tertiaryButtonWidth + buttonSpacing);
            const buttonY = this.layout.tertiaryButtonsStartY + Math.floor(index / buttonsPerRow) * (this.layout.tertiaryButtonHeight + buttonSpacing);
            
            if (x >= buttonX && x <= buttonX + this.layout.tertiaryButtonWidth &&
                y >= buttonY && y <= buttonY + this.layout.tertiaryButtonHeight) {
                newSelectedIndex = currentIndex;
            }
            currentIndex++;
        });
        
        if (newSelectedIndex !== -1 && this.selectedIndex !== newSelectedIndex) {
            // Update button animations
            const oldKey = this.getButtonKey(this.selectedIndex);
            if (oldKey && this.buttonAnimations.has(oldKey)) {
                this.buttonAnimations.get(oldKey).type = 'unhover';
            }
            
            const newKey = this.getButtonKey(newSelectedIndex);
            if (newKey) {
                this.buttonAnimations.set(newKey, { type: 'hover', progress: 0 });
            }
            
            this.selectedIndex = newSelectedIndex;
            this.playSound('hover');
        }
    }
    
    handleSubMenuMouseMove(x, y) {
        const menu = this.menus[this.currentMenu];
        const startY = this.layout.primaryButtonsStartY;
        
        menu.options.forEach((option, index) => {
            const optionY = startY + index * 60;
            const optionX = this.canvas.width / 2 - 200;
            
            if (x >= optionX && x <= optionX + 400 &&
                y >= optionY && y <= optionY + 50) {
                if (this.selectedIndex !== index) {
                    this.selectedIndex = index;
                    this.playSound('hover');
                }
            }
        });
    }
    
    getButtonKey(index) {
        const menu = this.menus.MAIN;
        let currentIndex = 0;
        
        // Primary actions
        for (let i = 0; i < menu.primaryActions.length; i++) {
            if (currentIndex === index) {
                const action = menu.primaryActions[i];
                const buttonY = this.layout.primaryButtonsStartY + i * this.layout.primaryButtonSpacing;
                const buttonX = this.canvas.width / 2 - this.layout.primaryButtonWidth / 2;
                return `${action.text}_${buttonX}_${buttonY}`;
            }
            currentIndex++;
        }
        
        // Secondary actions
        for (let i = 0; i < menu.secondaryActions.length; i++) {
            if (currentIndex === index) {
                const action = menu.secondaryActions[i];
                const buttonY = this.layout.secondaryButtonsStartY + i * this.layout.secondaryButtonSpacing;
                const buttonX = this.canvas.width / 2 - this.layout.secondaryButtonWidth / 2;
                return `${action.text}_${buttonX}_${buttonY}`;
            }
            currentIndex++;
        }
        
        // Tertiary actions
        for (let i = 0; i < menu.tertiaryActions.length; i++) {
            if (currentIndex === index) {
                const action = menu.tertiaryActions[i];
                return `${action.text}_tertiary_${i}`;
            }
            currentIndex++;
        }
        
        return null;
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // Trigger selection on current selectedIndex
        this.selectOption(this.selectedIndex);
    }
    
    selectOption(index) {
        const menu = this.menus[this.currentMenu];
        if (!menu) return;
        
        let option = null;
        
        if (this.currentMenu === 'MAIN') {
            option = this.getMainMenuOption(index);
        } else {
            if (!menu.options || index >= menu.options.length) return;
            option = menu.options[index];
        }
        
        if (!option) return;
        
        // Check if option is locked
        if (option.locked) {
            this.playSound('locked');
            this.addNotification(`Unlocks at level ${option.unlockLevel}`, 'warning');
            return;
        }
        
        this.playSound('select');
        this.handleAction(option.action);
    }
    
    getMainMenuOption(index) {
        const menu = this.menus.MAIN;
        let currentIndex = 0;
        
        // Check primary actions
        if (index < menu.primaryActions.length) {
            return menu.primaryActions[index];
        }
        currentIndex += menu.primaryActions.length;
        
        // Check secondary actions
        if (index < currentIndex + menu.secondaryActions.length) {
            return menu.secondaryActions[index - currentIndex];
        }
        currentIndex += menu.secondaryActions.length;
        
        // Check tertiary actions
        if (index < currentIndex + menu.tertiaryActions.length) {
            return menu.tertiaryActions[index - currentIndex];
        }
        
        return null;
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
                
            case 'QUICK_PLAY':
                // Quick Play starts a single player match immediately with current bot
                this.addNotification('Starting Quick Play...', 'info');
                // The game will handle the actual start
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
                
            case 'TUTORIAL':
                this.addNotification('Loading tutorial...', 'info');
                break;
                
            case 'CREDITS_MENU':
                this.navigateTo('CREDITS');
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
        
        // Update logo animations
        this.logoScale = 1 + Math.sin(this.animationTime * 0.001) * 0.02;
        this.logoGlow = (Math.sin(this.animationTime * 0.002) + 1) * 0.5;
        
        // Update background elements
        this.updateBackgroundParticles(deltaTime);
        this.updateFloatingBots(deltaTime);
        this.updateEnergyGrid(deltaTime);
        
        // Update button animations
        this.updateButtonAnimations(deltaTime);
        
        // Update notifications
        this.updateNotifications(deltaTime);
    }
    
    updateBackgroundParticles(deltaTime) {
        this.backgroundParticles.forEach(particle => {
            particle.x += particle.vx * deltaTime * 0.1;
            particle.y += particle.vy * deltaTime * 0.1;
            
            // Update pulsing
            particle.pulsePhase += particle.pulseSpeed * deltaTime;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
        });
    }
    
    updateFloatingBots(deltaTime) {
        this.floatingBots.forEach(bot => {
            bot.x += bot.vx * deltaTime * 0.1;
            bot.y += bot.vy * deltaTime * 0.1;
            bot.rotation += bot.rotationSpeed * deltaTime;
            
            // Wrap around screen
            if (bot.x < -bot.size) bot.x = this.canvas.width + bot.size;
            if (bot.x > this.canvas.width + bot.size) bot.x = -bot.size;
            if (bot.y < -bot.size) bot.y = this.canvas.height + bot.size;
            if (bot.y > this.canvas.height + bot.size) bot.y = -bot.size;
        });
    }
    
    updateEnergyGrid(deltaTime) {
        this.energyGrid.forEach(line => {
            line.pulsePhase += 0.001 * deltaTime;
        });
    }
    
    updateButtonAnimations(deltaTime) {
        // Update button hover animations
        this.buttonAnimations.forEach((animation, key) => {
            if (animation.type === 'hover') {
                animation.progress += deltaTime * 0.005;
                if (animation.progress >= 1) {
                    animation.progress = 1;
                }
            } else if (animation.type === 'unhover') {
                animation.progress -= deltaTime * 0.005;
                if (animation.progress <= 0) {
                    this.buttonAnimations.delete(key);
                }
            }
        });
    }
    
    updateNotifications(deltaTime) {
        this.notifications = this.notifications.filter(notif => {
            notif.lifetime -= deltaTime;
            return notif.lifetime > 0;
        });
    }
    
    renderEnhancedButton(config) {
        const ctx = this.ctx;
        const { x, y, width, height, text, description, icon, isSelected, isPrimary, locked } = config;
        
        // Animation progress
        const animKey = `${text}_${x}_${y}`;
        let animProgress = 0;
        if (this.buttonAnimations.has(animKey)) {
            animProgress = this.buttonAnimations.get(animKey).progress || 0;
        }
        
        // Button styling based on type and state
        let bgColor, borderColor, textColor;
        
        if (locked) {
            bgColor = this.colors.locked;
            borderColor = this.colors.locked;
            textColor = this.colors.textDim;
        } else if (isPrimary) {
            const intensity = isSelected ? 1 : 0.8;
            bgColor = isSelected ? this.colors.primaryButtonHover : this.colors.primaryButton;
            borderColor = this.colors.primaryButton;
            textColor = this.colors.textBright;
        } else {
            const intensity = 0.15 + (isSelected ? 0.15 : 0) + animProgress * 0.1;
            bgColor = `rgba(86, 204, 242, ${intensity})`;
            borderColor = isSelected ? this.colors.borderBright : this.colors.border;
            textColor = isSelected ? this.colors.textBright : this.colors.text;
        }
        
        // Draw button background with rounded corners
        ctx.fillStyle = bgColor;
        this.roundRect(ctx, x, y, width, height, 8);
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isSelected ? 3 : 2;
        this.roundRect(ctx, x, y, width, height, 8);
        ctx.stroke();
        
        // Add glow effect for selected primary buttons
        if (isPrimary && isSelected && !locked) {
            ctx.save();
            ctx.shadowColor = this.colors.primaryButtonGlow;
            ctx.shadowBlur = 15;
            this.roundRect(ctx, x, y, width, height, 8);
            ctx.stroke();
            ctx.restore();
        }
        
        // Draw icon if provided
        if (icon && !locked) {
            ctx.font = '20px Arial';
            ctx.fillStyle = textColor;
            ctx.textAlign = 'left';
            ctx.fillText(icon, x + 15, y + height / 2 + 7);
        }
        
        // Draw main text
        ctx.font = isPrimary ? 'bold 20px Arial' : 'bold 16px Arial';
        ctx.fillStyle = textColor;
        ctx.textAlign = icon ? 'left' : 'center';
        ctx.textBaseline = 'middle';
        
        const textX = icon ? x + 50 : x + width / 2;
        const textY = description ? y + height / 2 - 5 : y + height / 2;
        
        ctx.fillText(text, textX, textY);
        
        // Draw description for primary buttons
        if (description && !locked) {
            ctx.font = '12px Arial';
            ctx.fillStyle = this.colors.textDim;
            ctx.textAlign = icon ? 'left' : 'center';
            ctx.fillText(description, textX, textY + 15);
        }
        
        // Draw lock icon if locked
        if (locked) {
            ctx.font = '16px Arial';
            ctx.fillStyle = this.colors.locked;
            ctx.textAlign = 'right';
            ctx.fillText('🔒', x + width - 15, y + height / 2);
        }
    }
    
    renderCompactButton(config) {
        const ctx = this.ctx;
        const { x, y, width, height, text, icon, isSelected } = config;
        
        // Simple compact styling
        const bgColor = isSelected ? this.colors.secondaryButtonHover : this.colors.secondaryButton;
        const borderColor = isSelected ? this.colors.borderBright : this.colors.border;
        const textColor = isSelected ? this.colors.textBright : this.colors.text;
        
        ctx.fillStyle = bgColor;
        this.roundRect(ctx, x, y, width, height, 6);
        ctx.fill();
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isSelected ? 2 : 1;
        this.roundRect(ctx, x, y, width, height, 6);
        ctx.stroke();
        
        // Draw icon and text
        if (icon) {
            ctx.font = '14px Arial';
            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.fillText(icon, x + width / 2, y + height / 2 - 5);
        }
        
        ctx.font = '10px Arial';
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(text, x + width / 2, y + height - 3);
    }
    
    renderTraditionalOption(option, index, baseY) {
        const ctx = this.ctx;
        const isSelected = index === this.selectedIndex;
        const optionY = baseY + index * 60;
        const optionX = this.canvas.width / 2;
        
        ctx.save();
        
        // Traditional option rendering for submenus
        if (isSelected) {
            const bgX = optionX - 200;
            ctx.fillStyle = this.colors.secondaryButtonHover;
            this.roundRect(ctx, bgX, optionY, 400, 50, 8);
            ctx.fill();
            
            ctx.strokeStyle = this.colors.borderBright;
            ctx.lineWidth = 2;
            this.roundRect(ctx, bgX, optionY, 400, 50, 8);
            ctx.stroke();
        }
        
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (option.locked) {
            ctx.fillStyle = this.colors.locked;
        } else {
            ctx.fillStyle = isSelected ? this.colors.textBright : this.colors.text;
        }
        
        ctx.fillText(option.text, optionX, optionY + 25);
        
        if (option.locked) {
            ctx.font = '14px Arial';
            ctx.fillStyle = this.colors.locked;
            ctx.textAlign = 'right';
            ctx.fillText('🔒', optionX + 180, optionY + 25);
            
            if (option.unlockLevel) {
                ctx.font = '12px Arial';
                ctx.fillStyle = this.colors.textDim;
                ctx.textAlign = 'center';
                ctx.fillText(`Level ${option.unlockLevel}`, optionX, optionY + 45);
            }
        }
        
        ctx.restore();
    }
    
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
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
        
        // Render energy grid
        ctx.save();
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 1;
        this.energyGrid.forEach(line => {
            const pulse = Math.sin(line.pulsePhase) * 0.3 + 0.7;
            ctx.globalAlpha = line.opacity * pulse;
            
            if (line.type === 'vertical') {
                ctx.beginPath();
                ctx.moveTo(line.x, 0);
                ctx.lineTo(line.x, this.canvas.height);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(0, line.y);
                ctx.lineTo(this.canvas.width, line.y);
                ctx.stroke();
            }
        });
        ctx.restore();
        
        // Render floating bots
        ctx.save();
        this.floatingBots.forEach(bot => {
            ctx.save();
            ctx.translate(bot.x, bot.y);
            ctx.rotate(bot.rotation);
            ctx.globalAlpha = bot.opacity;
            
            // Simple bot shape
            ctx.fillStyle = bot.color;
            ctx.fillRect(-bot.size/2, -bot.size/2, bot.size, bot.size);
            
            // Add some detail
            ctx.fillStyle = this.colors.primary;
            ctx.fillRect(-bot.size/4, -bot.size/4, bot.size/2, bot.size/2);
            
            ctx.restore();
        });
        ctx.restore();
        
        // Render enhanced background particles
        ctx.save();
        this.backgroundParticles.forEach(particle => {
            const pulse = Math.sin(particle.pulsePhase) * 0.4 + 0.6;
            const opacity = particle.opacity * pulse;
            
            ctx.fillStyle = particle.color.replace(')', `, ${opacity})`);
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * pulse, 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow effect
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = particle.size * 2;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        ctx.restore();
        
        // Enhanced gradient overlay
        const gradient = ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 3, 0,
            this.canvas.width / 2, this.canvas.height / 3, this.canvas.width
        );
        gradient.addColorStop(0, 'rgba(15, 20, 25, 0.2)');
        gradient.addColorStop(0.6, 'rgba(15, 20, 25, 0.5)');
        gradient.addColorStop(1, 'rgba(15, 20, 25, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderMenu(menuName) {
        const menu = this.menus[menuName];
        if (!menu) return;
        
        const ctx = this.ctx;
        
        if (menuName === 'MAIN') {
            this.renderMainMenu();
        } else {
            this.renderSubMenu(menuName);
        }
    }
    
    renderMainMenu() {
        const ctx = this.ctx;
        const menu = this.menus.MAIN;
        
        // Render enhanced logo with animations
        if (this.logo && this.logo.complete) {
            ctx.save();
            
            const logoScale = this.logoScale;
            const maxLogoWidth = this.canvas.width * 0.6;
            const scaleByWidth = maxLogoWidth / this.logo.naturalWidth;
            const desiredScale = Math.max(0.3, Math.min(0.5, scaleByWidth)) * logoScale;
            
            const logoWidth = this.logo.naturalWidth * desiredScale;
            const logoHeight = this.logo.naturalHeight * desiredScale;
            const logoX = (this.canvas.width - logoWidth) / 2;
            const logoY = 30;
            
            // Add glow effect
            ctx.shadowColor = this.colors.primaryGlow;
            ctx.shadowBlur = 20 + this.logoGlow * 20;
            ctx.globalAlpha = 0.9 + this.logoGlow * 0.1;
            
            ctx.drawImage(this.logo, logoX, logoY, logoWidth, logoHeight);
            ctx.restore();
        }
        
        // Render player stats sidebar
        this.renderPlayerStats();
        
        // Render primary action buttons (most important)
        let currentIndex = 0;
        menu.primaryActions.forEach((action, index) => {
            this.renderPrimaryButton(action, index, currentIndex);
            currentIndex++;
        });
        
        // Render secondary action buttons
        let secondaryStartIndex = currentIndex;
        menu.secondaryActions.forEach((action, index) => {
            this.renderSecondaryButton(action, index, secondaryStartIndex + index);
            currentIndex++;
        });
        
        // Render tertiary buttons (settings, etc.)
        let tertiaryStartIndex = currentIndex;
        menu.tertiaryActions.forEach((action, index) => {
            this.renderTertiaryButton(action, index, tertiaryStartIndex + index);
        });
        
        // Render carnage decoration
        if (this.carnage && this.carnage.complete) {
            ctx.save();
            ctx.globalAlpha = 0.15;
            const carnageScale = 0.25;
            const carnageWidth = this.carnage.naturalWidth * carnageScale;
            const carnageHeight = this.carnage.naturalHeight * carnageScale;
            ctx.drawImage(this.carnage, 
                this.canvas.width - carnageWidth - 20, 
                this.canvas.height - carnageHeight - 20, 
                carnageWidth, carnageHeight);
            ctx.restore();
        }
        
        // Add quick tips for new players
        this.renderQuickTips();
    }
    
    renderSubMenu(menuName) {
        const menu = this.menus[menuName];
        const ctx = this.ctx;
        
        // Render title
        if (menu.title) {
            ctx.save();
            ctx.font = this.fonts.title;
            ctx.fillStyle = this.colors.primary;
            ctx.textAlign = 'center';
            ctx.shadowColor = this.colors.accent;
            ctx.shadowBlur = 20;
            
            const titleY = this.layout.titleY + Math.sin(this.animationTime * 0.002) * 5;
            ctx.fillText(menu.title, this.canvas.width / 2, titleY);
            ctx.restore();
        }
        
        // Render options in traditional style for submenus
        const startY = this.layout.primaryButtonsStartY;
        menu.options.forEach((option, index) => {
            this.renderTraditionalOption(option, index, startY);
        });
    }
    
    renderPrimaryButton(action, index, globalIndex) {
        const ctx = this.ctx;
        const isSelected = globalIndex === this.selectedIndex;
        
        const buttonX = this.canvas.width / 2;
        const buttonY = this.layout.primaryButtonsStartY + index * this.layout.primaryButtonSpacing;
        const buttonWidth = this.layout.primaryButtonWidth;
        const buttonHeight = this.layout.primaryButtonHeight;
        
        ctx.save();
        
        // Enhanced button styling
        this.renderEnhancedButton({
            x: buttonX - buttonWidth / 2,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            text: action.text,
            description: action.description,
            isSelected: isSelected,
            isPrimary: true,
            locked: action.locked || false
        });
        
        ctx.restore();
    }
    
    renderSecondaryButton(action, index, globalIndex) {
        const ctx = this.ctx;
        const isSelected = globalIndex === this.selectedIndex;
        
        const buttonX = this.canvas.width / 2;
        const buttonY = this.layout.secondaryButtonsStartY + index * this.layout.secondaryButtonSpacing;
        const buttonWidth = this.layout.secondaryButtonWidth;
        const buttonHeight = this.layout.secondaryButtonHeight;
        
        ctx.save();
        
        this.renderEnhancedButton({
            x: buttonX - buttonWidth / 2,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
            text: action.text,
            description: action.description,
            icon: action.icon,
            isSelected: isSelected,
            isPrimary: false,
            locked: action.locked || false
        });
        
        ctx.restore();
    }
    
    renderTertiaryButton(action, index, globalIndex) {
        const ctx = this.ctx;
        const isSelected = globalIndex === this.selectedIndex;
        
        const buttonsPerRow = 3;
        const buttonSpacing = 10;
        const totalWidth = buttonsPerRow * this.layout.tertiaryButtonWidth + (buttonsPerRow - 1) * buttonSpacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        
        const buttonX = startX + (index % buttonsPerRow) * (this.layout.tertiaryButtonWidth + buttonSpacing);
        const buttonY = this.layout.tertiaryButtonsStartY + Math.floor(index / buttonsPerRow) * (this.layout.tertiaryButtonHeight + buttonSpacing);
        
        ctx.save();
        
        this.renderCompactButton({
            x: buttonX,
            y: buttonY,
            width: this.layout.tertiaryButtonWidth,
            height: this.layout.tertiaryButtonHeight,
            text: action.text,
            icon: action.icon,
            isSelected: isSelected
        });
        
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
    
    renderPlayerStats() {
        const ctx = this.ctx;
        const x = this.layout.playerStatsX;
        const y = this.layout.playerStatsY;
        
        ctx.save();
        
        // Background panel
        ctx.fillStyle = this.colors.secondaryButton;
        this.roundRect(ctx, x - 10, y - 10, this.layout.sidebarWidth - 20, 180, 8);
        ctx.fill();
        
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 1;
        this.roundRect(ctx, x - 10, y - 10, this.layout.sidebarWidth - 20, 180, 8);
        ctx.stroke();
        
        // Player stats header
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = this.colors.primary;
        ctx.textAlign = 'left';
        ctx.fillText('PILOT STATUS', x, y);
        
        // Level and XP
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = this.colors.text;
        ctx.fillText(`Level ${this.playerStats.level}`, x, y + 25);
        
        ctx.font = '12px Arial';
        ctx.fillStyle = this.colors.textDim;
        ctx.fillText(`XP: ${this.playerStats.xp}/1000`, x, y + 45);
        
        // XP Bar
        const barWidth = this.layout.sidebarWidth - 40;
        const barHeight = 6;
        const xpProgress = this.playerStats.xp / 1000;
        
        ctx.fillStyle = this.colors.secondary;
        this.roundRect(ctx, x, y + 50, barWidth, barHeight, 3);
        ctx.fill();
        
        ctx.fillStyle = this.colors.primary;
        this.roundRect(ctx, x, y + 50, barWidth * xpProgress, barHeight, 3);
        ctx.fill();
        
        // Match stats
        ctx.font = '12px Arial';
        ctx.fillStyle = this.colors.text;
        ctx.fillText(`Matches: ${this.playerStats.totalMatches}`, x, y + 75);
        ctx.fillText(`Wins: ${this.playerStats.wins}`, x, y + 90);
        
        const winRate = this.playerStats.totalMatches > 0 ? 
            Math.round((this.playerStats.wins / this.playerStats.totalMatches) * 100) : 0;
        ctx.fillText(`Win Rate: ${winRate}%`, x, y + 105);
        
        // Credits
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = this.colors.accentBright;
        ctx.fillText(`💰 ${this.playerStats.credits}`, x, y + 130);
        
        // Selected bot
        ctx.font = '12px Arial';
        ctx.fillStyle = this.colors.textDim;
        ctx.fillText('Selected Bot:', x, y + 150);
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = this.colors.primary;
        ctx.fillText(this.playerStats.selectedBot, x + 80, y + 150);
        
        ctx.restore();
    }
    
    renderQuickTips() {
        const ctx = this.ctx;
        const tips = [
            'Press SPACE for special abilities',
            'Use cover to avoid enemy fire',
            'Upgrade your bot after victories'
        ];
        
        const tipIndex = Math.floor(this.animationTime / 4000) % tips.length;
        const tip = tips[tipIndex];
        
        ctx.save();
        ctx.font = '14px Arial';
        ctx.fillStyle = this.colors.textDim;
        ctx.textAlign = 'center';
        
        // Background
        const tipWidth = ctx.measureText(tip).width + 40;
        const tipX = this.canvas.width - tipWidth - 20;
        const tipY = this.canvas.height - 80;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.roundRect(ctx, tipX, tipY, tipWidth, 30, 15);
        ctx.fill();
        
        // Tip text with fade animation
        const fadePhase = (this.animationTime % 4000) / 4000;
        let alpha = 1;
        if (fadePhase < 0.1) alpha = fadePhase / 0.1;
        else if (fadePhase > 0.9) alpha = (1 - fadePhase) / 0.1;
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.colors.primary;
        ctx.textAlign = 'center';
        ctx.fillText('💡 ' + tip, tipX + tipWidth / 2, tipY + 20);
        
        ctx.restore();
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
    
    // Update player stats for display
    updatePlayerStats(stats) {
        this.playerStats = {
            level: stats.level || 1,
            xp: stats.xp || 0,
            totalMatches: stats.totalMatches || 0,
            wins: stats.wins || 0,
            credits: stats.credits || 1000,
            selectedBot: stats.selectedBot || 'TITAN'
        };
    }
    
    // Get current selected bot for quick play
    getSelectedBot() {
        return this.playerStats.selectedBot;
    }
    
    // Show loading state for better UX
    showLoading(message) {
        this.addNotification(message, 'info');
    }
}

// Export singleton instance
export default MenuSystem;
