/**
 * Lobby System - Multiplayer lobby interface
 */

export class LobbySystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Lobby state
        this.isHost = false;
        this.roomCode = null;
        this.players = [];
        this.maxPlayers = 4;
        this.gameSettings = {
            mode: 'FREE_FOR_ALL',
            timeLimit: 300, // 5 minutes
            scoreLimit: 10,
            botDifficulty: 'MEDIUM',
            allowSpectators: true,
            mapSelection: 'RANDOM',
            friendlyFire: true
        };
        
        // UI state
        this.currentTab = 'PLAYERS'; // PLAYERS, SETTINGS, CHAT
        this.selectedPlayerSlot = -1;
        this.chatMessages = [];
        this.inputText = '';
        this.isReady = false;
        
        // Visual settings
        this.colors = {
            background: 'rgba(15, 23, 42, 0.95)',
            panel: 'rgba(30, 41, 59, 0.9)',
            primary: '#56CCF2',
            secondary: '#3a4c67',
            accent: '#2F80ED',
            text: '#ffffff',
            textDim: '#9ca3af',
            success: '#4ade80',
            error: '#ef4444',
            warning: '#fbbf24',
            ready: '#10b981',
            notReady: '#6b7280',
            host: '#a855f7',
            player: '#3b82f6',
            bot: '#9ca3af',
            spectator: '#fbbf24'
        };
        
        // Font settings
        this.fonts = {
            title: 'bold 32px Arial',
            subtitle: 'bold 24px Arial',
            normal: '18px Arial',
            small: '16px Arial',
            tiny: '14px Arial',
            code: 'bold 28px monospace'
        };
        
        // Layout configuration
        this.layout = {
            padding: 30,
            playerSlotHeight: 100,
            playerSlotWidth: 600,
            settingHeight: 50,
            chatHeight: 200
        };
        
        // Animation values
        this.animationTime = 0;
        this.pulseAnimation = 0;
        this.connectionAnimation = 0;
        
        // Mock networking (to be replaced with real networking)
        this.networkStatus = 'CONNECTED'; // CONNECTING, CONNECTED, DISCONNECTED
        this.ping = 0;
        
        // Quick match settings
        this.quickMatchPreferences = {
            region: 'AUTO',
            skillLevel: 'ANY',
            gameMode: 'ANY'
        };
        
        // Tournament data
        this.tournamentData = null;
        
        this.setupInputHandlers();
    }
    
    setupInputHandlers() {
        this.boundHandlers = {
            keydown: this.handleKeyDown.bind(this),
            mousemove: this.handleMouseMove.bind(this),
            mousedown: this.handleMouseDown.bind(this)
        };
    }
    
    activate() {
        document.addEventListener('keydown', this.boundHandlers.keydown);
        this.canvas.addEventListener('mousemove', this.boundHandlers.mousemove);
        this.canvas.addEventListener('mousedown', this.boundHandlers.mousedown);
    }
    
    deactivate() {
        document.removeEventListener('keydown', this.boundHandlers.keydown);
        this.canvas.removeEventListener('mousemove', this.boundHandlers.mousemove);
        this.canvas.removeEventListener('mousedown', this.boundHandlers.mousedown);
    }
    
    handleKeyDown(e) {
        // Chat input
        if (this.currentTab === 'CHAT' && !e.ctrlKey && !e.altKey) {
            if (e.key === 'Enter') {
                this.sendChatMessage();
                e.preventDefault();
            } else if (e.key === 'Backspace') {
                this.inputText = this.inputText.slice(0, -1);
                e.preventDefault();
            } else if (e.key.length === 1) {
                this.inputText += e.key;
                e.preventDefault();
            }
        }
        
        // General controls
        switch(e.key) {
            case 'Tab':
                this.cycleTab();
                e.preventDefault();
                break;
                
            case 'r':
            case 'R':
                if (!this.currentTab === 'CHAT') {
                    this.toggleReady();
                    e.preventDefault();
                }
                break;
                
            case 'Escape':
                this.leaveLobby();
                e.preventDefault();
                break;
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check tab clicks
        this.checkTabClick(x, y);
        
        // Check player slot clicks
        this.checkPlayerSlotClick(x, y);
        
        // Check button clicks
        this.checkButtonClick(x, y);
        
        // Check settings clicks
        if (this.currentTab === 'SETTINGS') {
            this.checkSettingsClick(x, y);
        }
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        this.pulseAnimation = Math.sin(this.animationTime * 0.003) * 0.5 + 0.5;
        this.connectionAnimation += deltaTime * 0.002;
        
        // Update mock ping
        this.ping = Math.floor(20 + Math.random() * 10);
        
        // Simulate player connections (mock)
        if (Math.random() < 0.001 && this.players.length < this.maxPlayers) {
            this.simulatePlayerJoin();
        }
    }
    
    render() {
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render main panel
        this.renderMainPanel();
        
        // Render room info
        this.renderRoomInfo();
        
        // Render tabs
        this.renderTabs();
        
        // Render current tab content
        switch(this.currentTab) {
            case 'PLAYERS':
                this.renderPlayersTab();
                break;
            case 'SETTINGS':
                this.renderSettingsTab();
                break;
            case 'CHAT':
                this.renderChatTab();
                break;
        }
        
        // Render action buttons
        this.renderActionButtons();
        
        // Render network status
        this.renderNetworkStatus();
    }
    
    renderMainPanel() {
        const ctx = this.ctx;
        const x = this.layout.padding;
        const y = this.layout.padding;
        const width = this.canvas.width - this.layout.padding * 2;
        const height = this.canvas.height - this.layout.padding * 2;
        
        // Panel background
        ctx.fillStyle = this.colors.panel;
        ctx.fillRect(x, y, width, height);
        
        // Panel border
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Title
        ctx.font = this.fonts.title;
        ctx.fillStyle = this.colors.primary;
        ctx.textAlign = 'center';
        ctx.fillText('MULTIPLAYER LOBBY', this.canvas.width / 2, y + 40);
    }
    
    renderRoomInfo() {
        const ctx = this.ctx;
        const x = this.layout.padding + 20;
        const y = this.layout.padding + 60;
        
        // Room code box
        if (this.roomCode) {
            ctx.fillStyle = 'rgba(86, 204, 242, 0.1)';
            ctx.fillRect(x, y, 200, 60);
            
            ctx.strokeStyle = this.colors.primary;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, 200, 60);
            
            ctx.font = this.fonts.small;
            ctx.fillStyle = this.colors.textDim;
            ctx.textAlign = 'center';
            ctx.fillText('Room Code', x + 100, y + 20);
            
            ctx.font = this.fonts.code;
            ctx.fillStyle = this.colors.text;
            ctx.fillText(this.roomCode, x + 100, y + 45);
        }
        
        // Game mode
        ctx.font = this.fonts.normal;
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'left';
        ctx.fillText(`Mode: ${this.gameSettings.mode.replace('_', ' ')}`, x + 250, y + 25);
        
        // Player count
        ctx.fillText(`Players: ${this.players.length}/${this.maxPlayers}`, x + 250, y + 50);
        
        // Host indicator
        if (this.isHost) {
            ctx.fillStyle = this.colors.host;
            ctx.fillText('👑 You are the host', x + 450, y + 25);
        }
    }
    
    renderTabs() {
        const ctx = this.ctx;
        const tabs = ['PLAYERS', 'SETTINGS', 'CHAT'];
        const startX = this.layout.padding + 20;
        const y = this.layout.padding + 140;
        const tabWidth = 150;
        
        tabs.forEach((tab, index) => {
            const x = startX + index * (tabWidth + 10);
            const isActive = this.currentTab === tab;
            
            // Tab background
            if (isActive) {
                ctx.fillStyle = this.colors.primary;
                ctx.fillRect(x, y, tabWidth, 40);
            } else {
                ctx.strokeStyle = this.colors.secondary;
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, tabWidth, 40);
            }
            
            // Tab text
            ctx.font = this.fonts.normal;
            ctx.fillStyle = isActive ? this.colors.background : this.colors.text;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tab, x + tabWidth / 2, y + 20);
            
            // Chat notification
            if (tab === 'CHAT' && this.hasUnreadMessages && !isActive) {
                ctx.fillStyle = this.colors.error;
                ctx.beginPath();
                ctx.arc(x + tabWidth - 10, y + 10, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    renderPlayersTab() {
        const ctx = this.ctx;
        const startX = this.layout.padding + 20;
        const startY = this.layout.padding + 200;
        
        // Render player slots
        for (let i = 0; i < this.maxPlayers; i++) {
            const y = startY + i * (this.layout.playerSlotHeight + 10);
            this.renderPlayerSlot(startX, y, i);
        }
        
        // Spectator section
        if (this.gameSettings.allowSpectators) {
            const specY = startY + this.maxPlayers * (this.layout.playerSlotHeight + 10) + 20;
            
            ctx.font = this.fonts.normal;
            ctx.fillStyle = this.colors.textDim;
            ctx.textAlign = 'left';
            ctx.fillText('Spectators:', startX, specY);
            
            // List spectators
            // ... spectator rendering ...
        }
    }
    
    renderPlayerSlot(x, y, slotIndex) {
        const ctx = this.ctx;
        const player = this.players[slotIndex];
        const width = this.layout.playerSlotWidth;
        const height = this.layout.playerSlotHeight;
        
        // Slot background
        if (player) {
            if (player.isReady) {
                ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
            } else {
                ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
            }
        } else {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
        }
        ctx.fillRect(x, y, width, height);
        
        // Slot border
        if (this.selectedPlayerSlot === slotIndex) {
            ctx.strokeStyle = this.colors.primary;
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = this.colors.secondary;
            ctx.lineWidth = 1;
        }
        ctx.strokeRect(x, y, width, height);
        
        if (player) {
            // Player avatar/icon
            const avatarSize = 60;
            ctx.fillStyle = player.color || this.colors.player;
            ctx.beginPath();
            ctx.arc(x + 50, y + height / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Bot indicator
            if (player.isBot) {
                ctx.font = this.fonts.subtitle;
                ctx.fillStyle = this.colors.background;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🤖', x + 50, y + height / 2);
            } else {
                // Player icon
                ctx.font = this.fonts.subtitle;
                ctx.fillStyle = this.colors.background;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('👤', x + 50, y + height / 2);
            }
            
            // Player name
            ctx.font = this.fonts.normal;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'left';
            ctx.fillText(player.name, x + 100, y + 30);
            
            // Player level
            ctx.font = this.fonts.small;
            ctx.fillStyle = this.colors.textDim;
            ctx.fillText(`Level ${player.level || 1}`, x + 100, y + 50);
            
            // Bot class
            ctx.fillText(`Bot: ${player.botClass || 'TITAN'}`, x + 100, y + 70);
            
            // Ready status
            if (player.isReady) {
                ctx.fillStyle = this.colors.ready;
                ctx.font = this.fonts.normal;
                ctx.textAlign = 'right';
                ctx.fillText('✓ READY', x + width - 20, y + height / 2);
            } else {
                ctx.fillStyle = this.colors.notReady;
                ctx.font = this.fonts.normal;
                ctx.textAlign = 'right';
                ctx.fillText('NOT READY', x + width - 20, y + height / 2);
            }
            
            // Host crown
            if (player.isHost) {
                ctx.font = this.fonts.subtitle;
                ctx.fillStyle = this.colors.host;
                ctx.textAlign = 'right';
                ctx.fillText('👑', x + width - 20, y + 25);
            }
            
            // Ping indicator
            if (!player.isBot) {
                const pingColor = player.ping < 50 ? this.colors.success : 
                                 player.ping < 100 ? this.colors.warning : this.colors.error;
                ctx.font = this.fonts.tiny;
                ctx.fillStyle = pingColor;
                ctx.textAlign = 'right';
                ctx.fillText(`${player.ping || 0}ms`, x + width - 20, y + height - 15);
            }
        } else {
            // Empty slot
            ctx.font = this.fonts.normal;
            ctx.fillStyle = this.colors.textDim;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Empty Slot', x + width / 2, y + height / 2 - 10);
            
            // Add bot button (if host)
            if (this.isHost) {
                ctx.font = this.fonts.small;
                ctx.fillStyle = this.colors.primary;
                ctx.fillText('[+ Add Bot]', x + width / 2, y + height / 2 + 10);
            }
        }
    }
    
    renderSettingsTab() {
        if (!this.isHost) {
            const ctx = this.ctx;
            ctx.font = this.fonts.normal;
            ctx.fillStyle = this.colors.textDim;
            ctx.textAlign = 'center';
            ctx.fillText('Only the host can change settings', this.canvas.width / 2, this.canvas.height / 2);
            return;
        }
        
        const ctx = this.ctx;
        const startX = this.layout.padding + 40;
        const startY = this.layout.padding + 200;
        
        const settings = [
            { key: 'mode', label: 'Game Mode', value: this.gameSettings.mode, options: ['FREE_FOR_ALL', 'TEAM_BATTLE', 'CAPTURE_FLAG'] },
            { key: 'timeLimit', label: 'Time Limit', value: `${this.gameSettings.timeLimit / 60} min`, options: ['3 min', '5 min', '10 min', 'Unlimited'] },
            { key: 'scoreLimit', label: 'Score Limit', value: this.gameSettings.scoreLimit, options: [5, 10, 20, 50] },
            { key: 'botDifficulty', label: 'Bot Difficulty', value: this.gameSettings.botDifficulty, options: ['EASY', 'MEDIUM', 'HARD', 'INSANE'] },
            { key: 'mapSelection', label: 'Map', value: this.gameSettings.mapSelection, options: ['RANDOM', 'ARENA', 'FACTORY', 'SPACE'] },
            { key: 'friendlyFire', label: 'Friendly Fire', value: this.gameSettings.friendlyFire ? 'ON' : 'OFF', options: ['ON', 'OFF'] }
        ];
        
        settings.forEach((setting, index) => {
            const y = startY + index * (this.layout.settingHeight + 10);
            
            // Setting background
            ctx.fillStyle = 'rgba(30, 41, 59, 0.3)';
            ctx.fillRect(startX, y, 600, this.layout.settingHeight);
            
            // Label
            ctx.font = this.fonts.normal;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'left';
            ctx.fillText(setting.label, startX + 20, y + 30);
            
            // Current value
            ctx.fillStyle = this.colors.primary;
            ctx.textAlign = 'center';
            ctx.fillText(setting.value.toString(), startX + 400, y + 30);
            
            // Navigation arrows
            ctx.fillStyle = this.colors.secondary;
            ctx.font = this.fonts.subtitle;
            ctx.fillText('◄', startX + 350, y + 30);
            ctx.fillText('►', startX + 450, y + 30);
        });
    }
    
    renderChatTab() {
        const ctx = this.ctx;
        const startX = this.layout.padding + 20;
        const startY = this.layout.padding + 200;
        const chatWidth = this.canvas.width - this.layout.padding * 2 - 40;
        const chatHeight = 300;
        
        // Chat background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
        ctx.fillRect(startX, startY, chatWidth, chatHeight);
        
        // Chat border
        ctx.strokeStyle = this.colors.secondary;
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, startY, chatWidth, chatHeight);
        
        // Render chat messages
        ctx.save();
        ctx.beginPath();
        ctx.rect(startX, startY, chatWidth, chatHeight - 40);
        ctx.clip();
        
        const messageStartY = startY + chatHeight - 60;
        this.chatMessages.slice(-10).forEach((msg, index) => {
            const y = messageStartY - (this.chatMessages.slice(-10).length - index - 1) * 25;
            
            // Player name
            ctx.font = this.fonts.small;
            ctx.fillStyle = msg.color || this.colors.primary;
            ctx.textAlign = 'left';
            ctx.fillText(`${msg.sender}:`, startX + 10, y);
            
            // Message text
            ctx.fillStyle = this.colors.text;
            ctx.fillText(msg.text, startX + 120, y);
            
            // Timestamp
            ctx.font = this.fonts.tiny;
            ctx.fillStyle = this.colors.textDim;
            ctx.textAlign = 'right';
            ctx.fillText(msg.timestamp, startX + chatWidth - 10, y);
        });
        
        ctx.restore();
        
        // Input field
        const inputY = startY + chatHeight - 35;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.fillRect(startX, inputY, chatWidth, 35);
        
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, inputY, chatWidth, 35);
        
        // Input text
        ctx.font = this.fonts.normal;
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.inputText + (this.animationTime % 1000 < 500 ? '|' : ''), startX + 10, inputY + 17);
        
        // Send button
        ctx.fillStyle = this.colors.primary;
        ctx.fillRect(startX + chatWidth - 60, inputY + 5, 50, 25);
        
        ctx.font = this.fonts.small;
        ctx.fillStyle = this.colors.background;
        ctx.textAlign = 'center';
        ctx.fillText('Send', startX + chatWidth - 35, inputY + 17);
    }
    
    renderActionButtons() {
        const ctx = this.ctx;
        const buttonY = this.canvas.height - 80;
        const buttonWidth = 150;
        const buttonHeight = 40;
        
        // Ready/Not Ready button
        const readyX = this.canvas.width / 2 - buttonWidth - 10;
        ctx.fillStyle = this.isReady ? this.colors.ready : this.colors.warning;
        ctx.fillRect(readyX, buttonY, buttonWidth, buttonHeight);
        
        ctx.font = this.fonts.normal;
        ctx.fillStyle = this.colors.background;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.isReady ? 'NOT READY' : 'READY', readyX + buttonWidth / 2, buttonY + buttonHeight / 2);
        
        // Start Game button (host only)
        if (this.isHost) {
            const startX = this.canvas.width / 2 + 10;
            const canStart = this.checkCanStartGame();
            
            ctx.fillStyle = canStart ? this.colors.success : this.colors.locked;
            ctx.fillRect(startX, buttonY, buttonWidth, buttonHeight);
            
            ctx.font = this.fonts.normal;
            ctx.fillStyle = this.colors.background;
            ctx.textAlign = 'center';
            ctx.fillText('START GAME', startX + buttonWidth / 2, buttonY + buttonHeight / 2);
            
            if (!canStart) {
                ctx.font = this.fonts.tiny;
                ctx.fillStyle = this.colors.error;
                ctx.fillText('All players must be ready', startX + buttonWidth / 2, buttonY + buttonHeight + 15);
            }
        }
        
        // Leave button
        const leaveX = this.layout.padding + 20;
        ctx.fillStyle = this.colors.error;
        ctx.fillRect(leaveX, buttonY, buttonWidth, buttonHeight);
        
        ctx.font = this.fonts.normal;
        ctx.fillStyle = this.colors.background;
        ctx.textAlign = 'center';
        ctx.fillText('LEAVE LOBBY', leaveX + buttonWidth / 2, buttonY + buttonHeight / 2);
    }
    
    renderNetworkStatus() {
        const ctx = this.ctx;
        const x = this.canvas.width - 200;
        const y = this.layout.padding + 60;
        
        // Connection status
        let statusColor = this.colors.success;
        let statusText = 'Connected';
        
        if (this.networkStatus === 'CONNECTING') {
            statusColor = this.colors.warning;
            statusText = 'Connecting...';
        } else if (this.networkStatus === 'DISCONNECTED') {
            statusColor = this.colors.error;
            statusText = 'Disconnected';
        }
        
        ctx.font = this.fonts.small;
        ctx.fillStyle = statusColor;
        ctx.textAlign = 'right';
        ctx.fillText(statusText, x, y);
        
        // Ping
        const pingColor = this.ping < 50 ? this.colors.success : 
                         this.ping < 100 ? this.colors.warning : this.colors.error;
        ctx.fillStyle = pingColor;
        ctx.fillText(`Ping: ${this.ping}ms`, x, y + 20);
        
        // Connection indicator animation
        if (this.networkStatus === 'CONNECTED') {
            ctx.fillStyle = this.colors.success;
            ctx.globalAlpha = this.pulseAnimation;
            ctx.beginPath();
            ctx.arc(x + 15, y - 5, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
    
    // Lobby management methods
    createLobby(settings = {}) {
        this.isHost = true;
        this.roomCode = this.generateRoomCode();
        this.gameSettings = { ...this.gameSettings, ...settings };
        this.players = [{
            id: 'player1',
            name: 'You',
            level: 1,
            botClass: 'TITAN',
            isHost: true,
            isReady: false,
            isBot: false,
            ping: 0,
            color: this.colors.host
        }];
        
        this.addChatMessage('System', 'Lobby created! Share the room code with friends.', this.colors.success);
        
        return this.roomCode;
    }
    
    joinLobby(roomCode) {
        this.isHost = false;
        this.roomCode = roomCode;
        this.players = [
            {
                id: 'host',
                name: 'Host',
                level: 10,
                botClass: 'VIPER',
                isHost: true,
                isReady: true,
                isBot: false,
                ping: 25,
                color: this.colors.host
            },
            {
                id: 'player2',
                name: 'You',
                level: 1,
                botClass: 'TITAN',
                isHost: false,
                isReady: false,
                isBot: false,
                ping: 0,
                color: this.colors.player
            }
        ];
        
        this.addChatMessage('System', 'Joined lobby!', this.colors.success);
        
        return true;
    }
    
    leaveLobby() {
        this.roomCode = null;
        this.players = [];
        this.isHost = false;
        this.isReady = false;
        this.chatMessages = [];
        
        // Trigger callback to return to menu
        if (this.onLeaveLobby) {
            this.onLeaveLobby();
        }
    }
    
    addBot(difficulty = 'MEDIUM') {
        if (!this.isHost || this.players.length >= this.maxPlayers) return false;
        
        const botNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];
        const botClasses = ['TITAN', 'VIPER', 'SNIPER', 'TANK', 'ASSASSIN'];
        
        const bot = {
            id: `bot${Date.now()}`,
            name: `Bot ${botNames[this.players.filter(p => p.isBot).length]}`,
            level: Math.floor(Math.random() * 20) + 1,
            botClass: botClasses[Math.floor(Math.random() * botClasses.length)],
            isHost: false,
            isReady: true,
            isBot: true,
            difficulty: difficulty,
            color: this.colors.bot
        };
        
        this.players.push(bot);
        this.addChatMessage('System', `${bot.name} joined the lobby`, this.colors.textDim);
        
        return true;
    }
    
    removeBot(botId) {
        if (!this.isHost) return false;
        
        const index = this.players.findIndex(p => p.id === botId && p.isBot);
        if (index !== -1) {
            const bot = this.players[index];
            this.players.splice(index, 1);
            this.addChatMessage('System', `${bot.name} left the lobby`, this.colors.textDim);
            return true;
        }
        
        return false;
    }
    
    toggleReady() {
        this.isReady = !this.isReady;
        
        // Update player ready state
        const playerIndex = this.players.findIndex(p => !p.isBot && (this.isHost ? p.isHost : !p.isHost));
        if (playerIndex !== -1) {
            this.players[playerIndex].isReady = this.isReady;
        }
        
        this.addChatMessage('You', this.isReady ? 'Ready!' : 'Not ready', this.colors.primary);
    }
    
    checkCanStartGame() {
        if (!this.isHost) return false;
        if (this.players.length < 2) return false;
        
        return this.players.every(p => p.isReady || p.isBot);
    }
    
    startGame() {
        if (!this.checkCanStartGame()) return false;
        
        this.addChatMessage('System', 'Starting game...', this.colors.success);
        
        // Trigger game start callback
        if (this.onStartGame) {
            this.onStartGame({
                players: this.players,
                settings: this.gameSettings,
                roomCode: this.roomCode
            });
        }
        
        return true;
    }
    
    sendChatMessage() {
        if (this.inputText.trim() === '') return;
        
        this.addChatMessage('You', this.inputText, this.colors.primary);
        this.inputText = '';
    }
    
    addChatMessage(sender, text, color) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        this.chatMessages.push({
            sender: sender,
            text: text,
            color: color,
            timestamp: timestamp
        });
        
        // Keep only last 50 messages
        if (this.chatMessages.length > 50) {
            this.chatMessages.shift();
        }
        
        // Mark as unread if not in chat tab
        if (this.currentTab !== 'CHAT' && sender !== 'You') {
            this.hasUnreadMessages = true;
        }
    }
    
    generateRoomCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    cycleTab() {
        const tabs = ['PLAYERS', 'SETTINGS', 'CHAT'];
        const currentIndex = tabs.indexOf(this.currentTab);
        this.currentTab = tabs[(currentIndex + 1) % tabs.length];
        
        if (this.currentTab === 'CHAT') {
            this.hasUnreadMessages = false;
        }
    }
    
    checkTabClick(x, y) {
        const tabs = ['PLAYERS', 'SETTINGS', 'CHAT'];
        const startX = this.layout.padding + 20;
        const tabY = this.layout.padding + 140;
        const tabWidth = 150;
        
        tabs.forEach((tab, index) => {
            const tabX = startX + index * (tabWidth + 10);
            
            if (x >= tabX && x <= tabX + tabWidth &&
                y >= tabY && y <= tabY + 40) {
                this.currentTab = tab;
                
                if (tab === 'CHAT') {
                    this.hasUnreadMessages = false;
                }
            }
        });
    }
    
    checkPlayerSlotClick(x, y) {
        if (this.currentTab !== 'PLAYERS') return;
        
        const startX = this.layout.padding + 20;
        const startY = this.layout.padding + 200;
        
        for (let i = 0; i < this.maxPlayers; i++) {
            const slotY = startY + i * (this.layout.playerSlotHeight + 10);
            
            if (x >= startX && x <= startX + this.layout.playerSlotWidth &&
                y >= slotY && y <= slotY + this.layout.playerSlotHeight) {
                this.selectedPlayerSlot = i;
                
                // Add bot to empty slot if host
                if (this.isHost && !this.players[i]) {
                    this.addBot();
                }
                
                // Remove bot if clicking on bot slot
                if (this.isHost && this.players[i]?.isBot) {
                    this.removeBot(this.players[i].id);
                }
                
                break;
            }
        }
    }
    
    checkButtonClick(x, y) {
        const buttonY = this.canvas.height - 80;
        const buttonWidth = 150;
        const buttonHeight = 40;
        
        // Ready button
        const readyX = this.canvas.width / 2 - buttonWidth - 10;
        if (x >= readyX && x <= readyX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            this.toggleReady();
        }
        
        // Start button (host only)
        if (this.isHost) {
            const startX = this.canvas.width / 2 + 10;
            if (x >= startX && x <= startX + buttonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                this.startGame();
            }
        }
        
        // Leave button
        const leaveX = this.layout.padding + 20;
        if (x >= leaveX && x <= leaveX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            this.leaveLobby();
        }
    }
    
    checkSettingsClick(x, y) {
        if (!this.isHost || this.currentTab !== 'SETTINGS') return;
        
        // Handle settings changes
        // ... settings interaction logic ...
    }
    
    simulatePlayerJoin() {
        // Mock function to simulate players joining
        if (this.players.length >= this.maxPlayers) return;
        
        const names = ['Player2', 'Player3', 'Player4'];
        const player = {
            id: `player${Date.now()}`,
            name: names[this.players.length - 1] || 'Player',
            level: Math.floor(Math.random() * 30) + 1,
            botClass: ['TITAN', 'VIPER', 'SNIPER'][Math.floor(Math.random() * 3)],
            isHost: false,
            isReady: Math.random() > 0.5,
            isBot: false,
            ping: Math.floor(Math.random() * 100) + 10,
            color: this.colors.player
        };
        
        this.players.push(player);
        this.addChatMessage('System', `${player.name} joined the lobby`, this.colors.success);
    }
}

// Export default
export default LobbySystem;