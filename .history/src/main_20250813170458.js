import { GAME_CONFIG, BOT_CLASSES, ARENA_CONFIG } from './config/constants.js';
import { Game } from './core/Game.js';
import { Renderer } from './core/Renderer.js';
import { InputHandler } from './core/InputHandler.js';
import { Physics } from './core/Physics.js';
import { Bot } from './entities/Bot.js';
import { ProjectileSystem } from './entities/Projectile.js';
import { HazardSystem } from './entities/hazard.js';
import { ParticleSystem } from './entities/Particle.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { CombatSystem } from './systems/Combat.js';
import { EffectsSystem } from './systems/EffectsSystem.js';
import { SaveManager } from './systems/SaveManager.js';
import { ProgressionSystem } from './systems/progression.js';
import { UpgradeSystem as UpgradeManager } from './systems/upgrades.js';
import { AbilitiesSystem as AbilitySystem } from './systems/abilities.js';
import { MenuSystem as MenuUI } from './ui/menu.js';
import { HUDSystem as HUD } from './ui/hud.js';
import { ShopSystem as ShopUI } from './ui/shop.js';
import { LobbySystem as LobbyUI } from './ui/lobby.js';
import performanceMonitor from './utils/PerformanceMonitor.js';
import componentDamageSystem from './systems/ComponentDamage.js';
import screenShake from './systems/ScreenShake.js';
import enhancedParticles from './systems/EnhancedParticles.js';
import webRTCManager from './network/WebRTCManager.js';

class BattleBotsGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.systems = {};
        this.ui = {};
        this.gameState = 'MENU';
        this.lastTime = 0;
        this.accumulator = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateTime = 0;
        this.networkSyncInterval = null;
        this.inputBroadcastAttached = false;
    }

    async init() {
        try {
            console.log('🎮 Initializing Battle Bots: Arena Evolution...');
            console.log('📍 Current URL:', window.location.href);
            console.log('📄 Document ready state:', document.readyState);
            
            // Wait for DOM if needed
            if (document.readyState !== 'complete') {
                await new Promise(resolve => window.addEventListener('load', resolve));
            }
            
            this.setupCanvas();
            this.initializeSystems();
            this.initializeUI();
            this.setupEventListeners();
            this.handleResize();
            
            await this.loadAssets();
            
            // Only try to load save if we have localStorage
            if (typeof localStorage !== 'undefined') {
                this.systems.save.loadGame();
            } else {
                console.warn('⚠️ localStorage not available, save/load disabled');
            }
            
            console.log('✅ Game initialized successfully!');
            this.start();
        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
            console.error('Stack trace:', error.stack);
            throw error;
        }
    }

    setupCanvas() {
        console.log('📐 Setting up canvas...');
        
        this.canvas = document.getElementById('gameCanvas');
        
        if (!this.canvas) {
            console.log('⚠️ Canvas not found in HTML, creating new one...');
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'gameCanvas';
            this.canvas.width = ARENA_CONFIG.WIDTH;
            this.canvas.height = ARENA_CONFIG.HEIGHT;
            
            const container = document.getElementById('game-container');
            if (container) {
                container.appendChild(this.canvas);
            } else {
                document.body.appendChild(this.canvas);
            }
        }
        
        if (!this.canvas) {
            throw new Error('Failed to create or find canvas element');
        }
        
        console.log('📐 Canvas found/created:', this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Failed to get 2D context from canvas');
        }
        
        this.ctx.imageSmoothingEnabled = false;
        console.log('✅ Canvas setup complete');
    }

    initializeSystems() {
        console.log('⚙️ Initializing game systems...');
        
        if (!this.canvas || !this.ctx) {
            throw new Error('Canvas must be initialized before systems');
        }
        
        this.systems = {
            game: new Game(this.canvas),  // Pass canvas to Game constructor
            renderer: new Renderer(this.ctx, ARENA_CONFIG.WIDTH, ARENA_CONFIG.HEIGHT),
            input: new InputHandler(this.canvas),
            physics: new Physics(),
            collision: new CollisionSystem(),
            combat: new CombatSystem(),
            effects: new EffectsSystem(this.canvas),  // Pass canvas to EffectsSystem
            projectiles: new ProjectileSystem(),
            hazards: new HazardSystem(),
            particles: new ParticleSystem(),
            progression: new ProgressionSystem(),
            upgrades: new UpgradeManager(),
            abilities: new AbilitySystem(),
            save: new SaveManager()
        };

        this.systems.game.initialize({
            renderer: this.systems.renderer,
            physics: this.systems.physics,
            collision: this.systems.collision,
            combat: this.systems.combat,
            effects: this.systems.effects,
            projectiles: this.systems.projectiles,
            hazards: this.systems.hazards,
            particles: this.systems.particles,
            progression: this.systems.progression,
            upgrades: this.systems.upgrades,
            abilities: this.systems.abilities,
            input: this.systems.input,
            save: this.systems.save
        });
    }

    initializeUI() {
        console.log('🎨 Initializing UI systems...');
        console.log('Canvas state:', { canvas: !!this.canvas, ctx: !!this.ctx });
        
        if (!this.canvas || !this.ctx) {
            throw new Error('Canvas or context not initialized before UI setup');
        }
        
        try {
            this.ui = {
                menu: new MenuUI(this.canvas),
                hud: new HUD(this.canvas),
                shop: new ShopUI(this.canvas),
                lobby: new LobbyUI(this.canvas)
            };
            console.log('✅ UI systems initialized');
            
            // Wire menu actions and enable input on landing page
            if (this.ui.menu.setActionCallback) {
                this.ui.menu.setActionCallback((action) => this.handleMenuAction(action));
            }
            if (this.ui.menu.activate) {
                this.ui.menu.activate();
            }
            
            this.ui.lobby.onStartGame = (config) => this.startMultiplayer(config);
            // Ensure leaving the lobby returns to the main menu
            this.ui.lobby.onLeaveLobby = () => this.showMenu();
            
            // Shop close/back to menu
            this.ui.shop.onClose = () => this.showMenu();
            this.ui.shop.onPurchase = (upgrade) => this.purchaseUpgrade(upgrade);
        } catch (error) {
            console.error('❌ Failed to initialize UI:', error);
            throw error;
        }
    }
    
    handleMenuAction(action) {
        switch (action) {
            case 'START_SINGLE':
                if (this.ui?.menu?.deactivate) this.ui.menu.deactivate();
                this.startSinglePlayer();
                break;
            case 'HOST_GAME':
                if (this.ui?.menu?.deactivate) this.ui.menu.deactivate();
                this.showLobby();
                break;
            case 'JOIN_GAME':
                if (this.ui?.menu?.deactivate) this.ui.menu.deactivate();
                // Lobby UI should provide a way to enter a room code
                this.showLobby();
                break;
            case 'UPGRADES_MENU':
                if (this.ui?.menu?.deactivate) this.ui.menu.deactivate();
                this.showShop();
                break;
            case 'SETTINGS_MENU':
                // Menu handles internal navigation for settings; also expose game-level settings if needed
                this.showSettings();
                break;
            default:
                // Other actions are handled internally by the menu (navigation/back/etc.)
                break;
        }
    }
    
    setupEventListeners() {
        this.systems.input.on('pause', () => this.togglePause());
        this.systems.input.on('menu', () => this.showMenu());
        
        // Performance monitoring toggle (F3)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F3') {
                e.preventDefault();
                const enabled = performanceMonitor.toggle();
                console.log(`Performance monitor ${enabled ? 'enabled' : 'disabled'}`);
            }
        });
        
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('beforeunload', () => this.systems.save.saveGame());
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameState === 'PLAYING') {
                this.pause();
            }
        });
    }

    async loadAssets() {
        console.log('📦 Loading assets...');
        
        // Currently no external assets to load
        // All game data is defined in constants.js
        // This method is kept for future asset loading (sprites, sounds, etc.)
        
        // Example for future use:
        // const assetsToLoad = [
        //     { type: 'image', path: '/assets/sprites/bot.png' },
        //     { type: 'sound', path: '/assets/sounds/explosion.mp3' }
        // ];
        
        console.log('✅ Assets loaded (using built-in constants)');
    }

    start() {
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    gameLoop(currentTime) {
        performanceMonitor.beginFrame();
        
        const deltaTime = Math.min(currentTime - this.lastTime, 100);
        this.lastTime = currentTime;

        this.updateFPS(currentTime);

        switch (this.gameState) {
            case 'MENU':
                this.ui.menu.update(deltaTime);
                this.ui.menu.render();
                break;
                
            case 'LOBBY':
                this.ui.lobby.update(deltaTime);
                this.ui.lobby.render();
                break;
                
            case 'SHOP':
                this.ui.shop.update(deltaTime);
                this.ui.shop.render(this.systems.progression.getPlayerData());
                break;
                
            case 'PLAYING':
                this.accumulator += deltaTime;
                const fixedDeltaTime = 1000 / GAME_CONFIG.TARGET_FPS;
                
                while (this.accumulator >= fixedDeltaTime) {
                    this.update(fixedDeltaTime);
                    this.accumulator -= fixedDeltaTime;
                }
                
                const interpolation = this.accumulator / fixedDeltaTime;
                this.render(interpolation);
                break;
                
            case 'PAUSED':
                this.renderPauseScreen();
                break;
                
            case 'GAME_OVER':
                this.renderGameOver();
                break;
        }

        performanceMonitor.endFrame();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        performanceMonitor.startTimer('update');
        
        this.systems.input.update();
        this.systems.game.update(deltaTime);
        
        // Let Game manage internal updates (physics, collisions, entities)
        // Already invoked above: this.systems.game.update(deltaTime);

        // Update HUD with current game state
        const gameState = this.systems.game.getGameState ? this.systems.game.getGameState() : null;
        if (gameState && this.ui?.hud?.setGameData) {
            this.ui.hud.setGameData(gameState);
            this.ui.hud.setPlayerBot(gameState.playerBot);
        }
        if (this.ui?.hud?.update) {
            this.ui.hud.update(deltaTime);
        }

        performanceMonitor.endTimer('update');
    }

    render(interpolation) {
        performanceMonitor.startTimer('render');
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Background
        if (this.systems.renderer.renderBackground) {
            this.systems.renderer.renderBackground();
        }

        // Delegate full scene rendering to Game
        if (typeof this.systems.game.render === 'function') {
            this.systems.game.render();
        }

        // HUD data and render
        const gameState = this.systems.game.getGameState ? this.systems.game.getGameState() : null;
        if (gameState && this.ui?.hud?.setGameData) {
            this.ui.hud.setGameData(gameState);
            this.ui.hud.setPlayerBot(gameState.playerBot);
        }
        if (typeof this.ui?.hud?.render === 'function') {
            this.ui.hud.render();
        }

        this.renderDebugInfo();
        
        performanceMonitor.endTimer('render');
    }

    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }
    }

    renderDebugInfo() {
        if (GAME_CONFIG.DEBUG_MODE) {
            performanceMonitor.render(this.ctx, 10, 30);
        }
    }

    renderPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press ESC to resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }

    renderGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const stats = this.systems.game.getMatchStats();
        
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, 100);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Winner: ${stats.winner}`, this.canvas.width / 2, 200);
        this.ctx.fillText(`Duration: ${Math.floor(stats.duration / 1000)}s`, this.canvas.width / 2, 250);
        this.ctx.fillText(`Total Kills: ${stats.totalKills}`, this.canvas.width / 2, 300);
        
        this.ctx.fillText('Press SPACE to return to menu', this.canvas.width / 2, 400);
    }

    startSinglePlayer() {
        console.log('🎮 Starting single player game...');
        if (this.ui?.menu?.deactivate) this.ui.menu.deactivate();
        this.gameState = 'PLAYING';
        
        this.systems.game.startMatch({
            mode: 'deathmatch',
            players: [
                { id: 'player1', botClass: 'TITAN', isAI: false },
                { id: 'bot1', botClass: 'VIPER', isAI: true },
                { id: 'bot2', botClass: 'SNIPER', isAI: true },
                { id: 'bot3', botClass: 'PHANTOM', isAI: true }
            ],
            arena: 'classic',
            timeLimit: 300
        });
    }

    async startMultiplayer(config) {
        console.log('🌐 Starting multiplayer game...', config);
        
        // Setup WebRTC handlers
        this.setupMultiplayerHandlers();
        
        // Start the game
        this.gameState = 'PLAYING';
        this.systems.game.startMatch(config);
        
        // Start syncing game state
        this.startNetworkSync();
    }
    
    setupMultiplayerHandlers() {
        // Handle game state updates from peers
        webRTCManager.on('gameState', (peerId, gameState) => {
            this.systems.game.applyNetworkState(gameState);
        });
        
        // Handle player inputs from peers
        webRTCManager.on('playerInput', (peerId, input) => {
            this.systems.input.applyNetworkInput(peerId, input);
        });
        
        // Handle player disconnect
        webRTCManager.on('playerDisconnect', (peerId) => {
            this.systems.game.removePlayer(peerId);
        });
    }
    
    startNetworkSync() {
        // Clear any existing sync loop
        if (this.networkSyncInterval) {
            clearInterval(this.networkSyncInterval);
            this.networkSyncInterval = null;
        }

        // Send game state periodically (10 times per second)
        this.networkSyncInterval = setInterval(() => {
            if (webRTCManager.isHost) {
                const gameState = this.systems.game.getNetworkState();
                webRTCManager.broadcast({
                    type: 'gameState',
                    data: gameState
                });
            }
        }, 100);

        // Send player inputs immediately (attach once)
        if (!this.inputBroadcastAttached) {
            this.systems.input.on('input', (input) => {
                webRTCManager.broadcast({
                    type: 'playerInput',
                    data: input
                });
            });
            this.inputBroadcastAttached = true;
        }
    }

    showMenu() {
        this.gameState = 'MENU';
        this.systems.save.saveGame();
        if (this.networkSyncInterval) {
            clearInterval(this.networkSyncInterval);
            this.networkSyncInterval = null;
        }
        if (this.ui?.menu?.activate) this.ui.menu.activate();
    }

    async showLobby() {
        this.gameState = 'LOBBY';
        if (this.ui?.menu?.deactivate) this.ui.menu.deactivate();
        
        try {
            // Try to create room with WebRTC
            const roomCode = await webRTCManager.createRoom();
            this.ui.lobby.setRoomCode(roomCode);
            
            // Handle peer connections
            webRTCManager.on('peerJoined', (peerId) => {
                this.ui.lobby.addPlayer(peerId);
            });
            
            webRTCManager.on('peerLeft', (peerId) => {
                this.ui.lobby.removePlayer(peerId);
            });
        } catch (error) {
            console.warn('⚠️ Multiplayer not available:', error.message);
            console.log('💡 You can still play single-player mode!');
            // Show lobby anyway for local play
            this.ui.lobby.setRoomCode('LOCAL');
        }
        
        this.ui.lobby.activate();
        this.ui.lobby.activate();
    }
    
    async joinLobby(roomCode) {
        this.gameState = 'LOBBY';
        
        try {
            // Join existing room
            await webRTCManager.joinRoom(roomCode);
            this.ui.lobby.setRoomCode(roomCode);
        } catch (error) {
            console.warn('⚠️ Could not join multiplayer room:', error.message);
            console.log('💡 Starting local game instead');
            this.ui.lobby.setRoomCode('LOCAL');
        }
        
        this.ui.lobby.show();
    }

    showShop() {
        this.gameState = 'SHOP';
        if (this.ui?.menu?.deactivate) this.ui.menu.deactivate();
        this.ui.shop.open();
    }

    showSettings() {
        console.log('⚙️ Settings not yet implemented');
    }

    togglePause() {
        if (this.gameState === 'PLAYING') {
            this.pause();
        } else if (this.gameState === 'PAUSED') {
            this.resume();
        }
    }

    pause() {
        if (this.gameState === 'PLAYING') {
            this.gameState = 'PAUSED';
            console.log('⏸️ Game paused');
        }
    }

    resume() {
        if (this.gameState === 'PAUSED') {
            this.gameState = 'PLAYING';
            this.lastTime = performance.now();
            console.log('▶️ Game resumed');
        }
    }

    purchaseUpgrade(upgrade) {
        const success = this.systems.upgrades.purchaseUpgrade(upgrade.id);
        if (success) {
            this.systems.progression.spendCredits(upgrade.cost);
            console.log(`✅ Purchased upgrade: ${upgrade.name}`);
        }
        return success;
    }

    handleResize() {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = rect.width / ARENA_CONFIG.WIDTH;
        const scaleY = rect.height / ARENA_CONFIG.HEIGHT;
        const scale = Math.min(scaleX, scaleY);
        
        this.canvas.style.transform = `scale(${scale})`;
        this.canvas.style.transformOrigin = 'center';
    }
}

// Export the game class for use in index.html
// Do not auto-initialize here as index.html handles initialization
export default BattleBotsGame;
