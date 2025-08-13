import { GAME_CONFIG, GAME_STATES, ECONOMY } from '../config/constants.js';
import { Bot } from '../entities/Bot.js';
import { Projectile, SniperShot, MultiShot, TurretShot } from '../entities/Projectile.js';
import { HazardFactory, LavaPool, EnergyField, Crusher, Turret, Mine } from '../entities/hazard.js';
import { Renderer } from './Renderer.js';
import { InputHandler } from './InputHandler.js';
import { Physics } from './Physics.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { EffectsSystem } from '../systems/EffectsSystem.js';
import { SaveManager } from '../systems/SaveManager.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;
        this.width = GAME_CONFIG.CANVAS_WIDTH;
        this.height = GAME_CONFIG.CANVAS_HEIGHT;
        
        // Set canvas size if available
        if (this.canvas) {
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }
        
        // Game state
        this.state = GAME_STATES.MENU;
        this.previousState = null;
        this.paused = false;
        
        // Core systems (will be set via initialize method)
        this.renderer = null;
        this.inputHandler = null;
        this.physics = null;
        this.collisionSystem = null;
        this.effectsSystem = null;
        this.saveManager = null;
        
        // Game entities
        this.bots = [];
        this.projectiles = [];
        this.hazards = [];
        this.powerups = [];
        
        // Player data
        this.player = null;
        this.playerBot = null;
        this.playerProfile = null; // Will be loaded after saveManager is set
        
        // Match data
        this.matchData = {
            startTime: 0,
            endTime: 0,
            kills: 0,
            deaths: 0,
            damageDealt: 0,
            damageTaken: 0,
            creditsEarned: 0,
            xpEarned: 0
        };
        
        // Multiplayer
        this.isMultiplayer = false;
        this.roomCode = null;
        this.players = new Map();
        
        // Game loop
        this.lastTime = 0;
        this.accumulator = 0;
        this.running = false;
        
        // Note: init() will be called after systems are initialized
    }

    initialize(systems) {
        // Set all the system references
        this.renderer = systems.renderer;
        this.inputHandler = systems.input;
        this.physics = systems.physics;
        this.collisionSystem = systems.collision;
        this.effectsSystem = systems.effects;
        this.saveManager = systems.save || new SaveManager();
        
        // Now that systems are set, initialize the game
        this.init();
    }

    init() {
        // Load saved data
        if (this.saveManager) {
            this.playerProfile = this.saveManager.loadProfile();
        } else {
            // Default profile if save manager not available
            this.playerProfile = {
                credits: 1000,
                xp: 0,
                level: 1,
                totalMatches: 0,
                wins: 0,
                losses: 0,
                botUpgrades: {}
            };
        }
        
        // Set up input handlers
        this.setupInputHandlers();
        
        // Initialize renderer if it has an init method
        if (this.renderer && this.renderer.init) {
            this.renderer.init();
        }
        
        // Start menu
        this.changeState(GAME_STATES.MENU);
    }

    setupInputHandlers() {
        if (!this.inputHandler) {
            console.warn('InputHandler not available, skipping input setup');
            return;
        }
        
        // Mouse/touch movement
        this.inputHandler.on('move', (x, y) => {
            if (this.state === GAME_STATES.PLAYING && this.playerBot) {
                this.playerBot.setTarget(x, y);
            }
        });
        
        // Primary attack (left click)
        this.inputHandler.on('primaryAttack', () => {
            if (this.state === GAME_STATES.PLAYING && this.playerBot) {
                this.handlePrimaryAttack();
            }
        });
        
        // Secondary attack (right click)
        this.inputHandler.on('secondaryAttack', () => {
            if (this.state === GAME_STATES.PLAYING && this.playerBot) {
                this.handleSecondaryAttack();
            }
        });
        
        // Special ability (space)
        this.inputHandler.on('ability', () => {
            if (this.state === GAME_STATES.PLAYING && this.playerBot) {
                this.handleAbility();
            }
        });
        
        // Pause (ESC)
        this.inputHandler.on('pause', () => {
            if (this.state === GAME_STATES.PLAYING) {
                this.togglePause();
            }
        });
        
        // Restart (R)
        this.inputHandler.on('restart', () => {
            if (this.state === GAME_STATES.GAME_OVER) {
                this.restart();
            }
        });
    }

    changeState(newState) {
        this.previousState = this.state;
        this.state = newState;
        
        switch (newState) {
            case GAME_STATES.MENU:
                this.showMenu();
                break;
            case GAME_STATES.BOT_SELECT:
                this.showBotSelect();
                break;
            case GAME_STATES.PLAYING:
                this.startMatch();
                break;
            case GAME_STATES.GAME_OVER:
                this.endMatch();
                break;
            case GAME_STATES.LOBBY:
                this.showLobby();
                break;
        }
    }

    showMenu() {
        // Menu will be handled by UI components
        this.renderer.renderMenu();
    }

    showBotSelect() {
        // Bot selection UI
        this.renderer.renderBotSelect(this.playerProfile);
    }

    showLobby() {
        // Multiplayer lobby
        this.renderer.renderLobby(this.roomCode, this.players);
    }

    startMatch(configOrBotClass = 'TITAN', isMultiplayer = false) {
        // Enter playing state
        this.state = GAME_STATES.PLAYING;

        // Clear entities
        this.bots = [];
        this.projectiles = [];
        this.hazards = [];
        this.powerups = [];
        
        // Reset match data
        this.matchData = {
            startTime: Date.now(),
            endTime: 0,
            kills: 0,
            deaths: 0,
            damageDealt: 0,
            damageTaken: 0,
            creditsEarned: 0,
            xpEarned: 0
        };

        // Determine mode: legacy string or config object
        let playerBotClass = 'TITAN';
        let playersConfig = null;

        if (typeof configOrBotClass === 'string') {
            playerBotClass = configOrBotClass;
        } else if (configOrBotClass && typeof configOrBotClass === 'object') {
            playersConfig = Array.isArray(configOrBotClass.players) ? configOrBotClass.players : null;
            if (typeof configOrBotClass.isMultiplayer === 'boolean') {
                isMultiplayer = configOrBotClass.isMultiplayer;
            }
        }

        if (playersConfig && playersConfig.length > 0) {
            // Config-driven setup
            playersConfig.forEach((p, index) => {
                const cls = typeof p.botClass === 'string' ? p.botClass : 'TITAN';
                const upgradeKey = cls.toLowerCase();
                const upgrades = (this.playerProfile?.botUpgrades?.[upgradeKey]) || [];
                const x = index === 0 ? this.width / 2 : Math.random() * this.width;
                const y = index === 0 ? this.height / 2 : Math.random() * this.height;
                const id = p.id || (p.isAI ? `ai_${index}` : 'player');
                const bot = new Bot(x, y, cls, id, upgrades);
                if (!p.isAI && !this.playerBot) {
                    this.playerBot = bot;
                }
                this.bots.push(bot);
            });
            if (!this.playerBot && this.bots.length > 0) {
                this.playerBot = this.bots[0];
            }
        } else {
            // Legacy single-player setup
            const upgradeKey = playerBotClass.toLowerCase();
            const upgrades = (this.playerProfile?.botUpgrades?.[upgradeKey]) || [];
            this.playerBot = new Bot(
                this.width / 2,
                this.height / 2,
                playerBotClass,
                'player',
                upgrades
            );
            this.bots.push(this.playerBot);

            if (!isMultiplayer) {
                for (let i = 0; i < 3; i++) {
                    const aiClasses = ['TITAN', 'VIPER', 'SNIPER', 'STRIKER'];
                    const randomClass = aiClasses[Math.floor(Math.random() * aiClasses.length)];
                    const aiBot = new Bot(
                        Math.random() * this.width,
                        Math.random() * this.height,
                        randomClass,
                        `ai_${i}`
                    );
                    this.bots.push(aiBot);
                }
            }
        }
        
        // Create initial hazards
        this.createHazards();
        
        // Start game loop
        this.running = true;
        this.gameLoop(0);
    }

    createHazards() {
        // Clear existing hazards
        this.hazards = [];
        
        // Create a balanced set of hazards for the arena
        // Ensure hazards are not too close to spawn points
        const minDistanceFromCenter = 150;
        const margin = 100;
        
        // Add lava pools in corners
        const lavaPositions = [
            { x: margin, y: margin },
            { x: this.width - margin, y: margin },
            { x: margin, y: this.height - margin },
            { x: this.width - margin, y: this.height - margin }
        ];
        
        lavaPositions.forEach(pos => {
            const lava = HazardFactory.createLavaPool(pos.x, pos.y, {
                radius: 50,
                damage: 20,
                damageInterval: 500
            });
            this.hazards.push(lava);
        });
        
        // Add energy fields along edges
        const energyField1 = HazardFactory.createEnergyField(this.width / 2, margin, {
            radius: 70,
            slowEffect: 0.4,
            energyDrain: 15
        });
        const energyField2 = HazardFactory.createEnergyField(this.width / 2, this.height - margin, {
            radius: 70,
            slowEffect: 0.4,
            energyDrain: 15
        });
        this.hazards.push(energyField1, energyField2);
        
        // Add crushers in strategic positions
        const crusher1 = HazardFactory.createCrusher(margin * 2, this.height / 2, {
            width: 80,
            height: 80,
            damage: 60,
            crushInterval: 4000,
            warningDuration: 1500
        });
        const crusher2 = HazardFactory.createCrusher(this.width - margin * 2, this.height / 2, {
            width: 80,
            height: 80,
            damage: 60,
            crushInterval: 4000,
            warningDuration: 1500
        });
        this.hazards.push(crusher1, crusher2);
        
        // Add turrets for area denial
        const turret1 = HazardFactory.createTurret(this.width / 2 - 150, this.height / 2, {
            range: 200,
            fireRate: 2000,
            damage: 15,
            tracking: true
        });
        const turret2 = HazardFactory.createTurret(this.width / 2 + 150, this.height / 2, {
            range: 200,
            fireRate: 2000,
            damage: 15,
            tracking: true
        });
        this.hazards.push(turret1, turret2);
        
        // Add a few mines scattered around
        for (let i = 0; i < 5; i++) {
            let x, y;
            let attempts = 0;
            
            // Try to place mines away from center and other hazards
            do {
                x = margin + Math.random() * (this.width - margin * 2);
                y = margin + Math.random() * (this.height - margin * 2);
                attempts++;
            } while (
                Math.sqrt(Math.pow(x - this.width/2, 2) + Math.pow(y - this.height/2, 2)) < minDistanceFromCenter &&
                attempts < 20
            );
            
            const mine = HazardFactory.createMine(x, y, {
                damage: 80,
                triggerRadius: 35,
                explosionRadius: 120,
                explosionForce: 400
            });
            this.hazards.push(mine);
        }
    }

    handlePrimaryAttack() {
        if (!this.playerBot || !this.playerBot.isAlive()) return;
        
        // Melee attack
        if (this.playerBot.canUseMelee()) {
            this.playerBot.useMelee();
            
            // Check for nearby enemies
            const meleeRange = 50;
            this.bots.forEach(bot => {
                if (bot !== this.playerBot && bot.isAlive()) {
                    const distance = this.playerBot.distanceTo(bot);
                    if (distance < meleeRange) {
                        const damage = this.playerBot.currentStats.meleeDamage;
                        const damageDealt = bot.takeDamage(damage, 'melee');
                        
                        if (damageDealt > 0) {
                            this.matchData.damageDealt += damageDealt;
                            this.playerBot.stats.damageDealt += damageDealt;
                            
                            // Add hit effect
                            this.effectsSystem.addMeleeHit(bot.x, bot.y);
                            
                            // Check for kill
                            if (!bot.isAlive()) {
                                this.handleKill(this.playerBot, bot);
                            }
                        }
                    }
                }
            });
        }
    }

    handleSecondaryAttack() {
        if (!this.playerBot || !this.playerBot.isAlive()) return;
        
        // Ranged attack
        if (this.playerBot.canUseRanged()) {
            this.playerBot.useRanged();
            
            // Get mouse position for aiming
            const mousePos = this.inputHandler.getMousePosition();
            const angle = Math.atan2(
                mousePos.y - this.playerBot.y,
                mousePos.x - this.playerBot.x
            );
            
            // Create projectile based on bot class
            if (this.playerBot.className === 'SNIPER') {
                const projectile = new SniperShot(
                    this.playerBot.x,
                    this.playerBot.y,
                    angle,
                    this.playerBot.currentStats.rangedDamage,
                    this.playerBot.id
                );
                this.projectiles.push(projectile);
            } else if (this.playerBot.ability === 'multiShot' && this.playerBot.abilityActive) {
                const projectiles = MultiShot.create(
                    this.playerBot.x,
                    this.playerBot.y,
                    angle,
                    this.playerBot.currentStats.rangedDamage,
                    this.playerBot.id
                );
                this.projectiles.push(...projectiles);
            } else {
                const projectile = new Projectile(
                    this.playerBot.x,
                    this.playerBot.y,
                    angle,
                    this.playerBot.currentStats.rangedDamage,
                    10,
                    this.playerBot.id,
                    'bullet'
                );
                this.projectiles.push(projectile);
            }
        }
    }

    handleAbility() {
        if (!this.playerBot || !this.playerBot.isAlive()) return;
        
        if (this.playerBot.activateAbility()) {
            // Special handling for specific abilities
            if (this.playerBot.ability === 'drone') {
                // Create drone entity
                // To be implemented with drone system
            } else if (this.playerBot.ability === 'deployTurret') {
                // Create turret entity
                // To be implemented with turret system
            }
            
            // Add ability effect
            this.effectsSystem.addAbilityActivation(
                this.playerBot.x,
                this.playerBot.y,
                this.playerBot.ability
            );
        }
    }

    handleKill(killer, victim) {
        killer.stats.kills++;
        
        if (killer === this.playerBot) {
            this.matchData.kills++;
            this.matchData.creditsEarned += ECONOMY.REWARDS.KILL;
            this.matchData.xpEarned += ECONOMY.XP_REWARDS.KILL;
            
            // First blood bonus
            if (this.matchData.kills === 1) {
                this.matchData.creditsEarned += ECONOMY.REWARDS.FIRST_BLOOD;
            }
        }
        
        // Add death explosion
        this.effectsSystem.addExplosion(victim.x, victim.y);
        
        // Check for match end
        const aliveBots = this.bots.filter(bot => bot.isAlive());
        if (aliveBots.length === 1) {
            this.changeState(GAME_STATES.GAME_OVER);
        }
    }

    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.previousState = this.state;
            this.state = GAME_STATES.PAUSED;
        } else {
            this.state = this.previousState;
        }
    }

    restart() {
        this.changeState(GAME_STATES.BOT_SELECT);
    }

    endMatch() {
        this.matchData.endTime = Date.now();
        
        // Calculate final rewards
        if (this.playerBot && this.playerBot.isAlive()) {
            this.matchData.creditsEarned += ECONOMY.REWARDS.WIN_BONUS;
            this.matchData.xpEarned += ECONOMY.XP_REWARDS.WIN;
        } else {
            this.matchData.xpEarned += ECONOMY.XP_REWARDS.LOSS;
        }
        
        // Participation bonus
        this.matchData.creditsEarned += ECONOMY.REWARDS.PARTICIPATION;
        this.matchData.xpEarned += ECONOMY.XP_REWARDS.MATCH_COMPLETE;
        
        // Update player profile
        this.playerProfile.credits += this.matchData.creditsEarned;
        this.playerProfile.xp += this.matchData.xpEarned;
        this.playerProfile.totalMatches++;
        if (this.playerBot && this.playerBot.isAlive()) {
            this.playerProfile.wins++;
        } else {
            this.playerProfile.losses++;
        }
        
        // Save profile
        this.saveManager.saveProfile(this.playerProfile);
        
        // Show results
        this.renderer.renderGameOver(this.matchData, this.playerProfile);
    }

    update(deltaTime) {
        if (this.paused || this.state !== GAME_STATES.PLAYING) return;
        
        const arena = { width: this.width, height: this.height };
        
        // Update bots (AI and game logic)
        this.bots.forEach(bot => {
            if (bot.isAlive()) {
                bot.update(deltaTime, arena);
                
                // Simple AI for non-player bots
                if (bot !== this.playerBot) {
                    this.updateAI(bot);
                }
            }
        });
        
        // Update physics system (handles movement and physics for all entities)
        this.physics.updatePhysics(this.bots, this.projectiles, deltaTime, arena);
        
        // Update projectiles (behavior and lifetime)
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update(deltaTime, arena);
            
            if (projectile.isActive()) {
                // Check collisions with bots
                this.bots.forEach(bot => {
                    if (bot.isAlive() && this.physics.checkCircleCollision(projectile, bot)) {
                        const damageDealt = projectile.onHit(bot);
                        
                        // Track damage
                        const owner = this.bots.find(b => b.id === projectile.ownerId);
                        if (owner) {
                            owner.stats.damageDealt += damageDealt;
                            if (owner === this.playerBot) {
                                this.matchData.damageDealt += damageDealt;
                            }
                        }
                        
                        // Check for kill
                        if (!bot.isAlive() && owner) {
                            this.handleKill(owner, bot);
                        }
                        
                        // Add hit effect
                        this.effectsSystem.addProjectileHit(bot.x, bot.y, projectile.type);
                    }
                });
            }
            
            return projectile.isActive();
        });
        
        // Update effects
        this.effectsSystem.update(deltaTime);
        
        // Update hazards
        this.hazards = this.hazards.filter(hazard => {
            if (hazard.active) {
                hazard.update(deltaTime, this);
            }
            return hazard.active;
        });
    }

    updateAI(bot) {
        // Simple AI behavior
        const nearestEnemy = this.findNearestEnemy(bot);
        if (!nearestEnemy) return;
        
        const distance = bot.distanceTo(nearestEnemy);
        const angle = bot.angleTo(nearestEnemy);
        
        // Movement
        if (distance > 150) {
            // Move towards enemy
            bot.setTarget(nearestEnemy.x, nearestEnemy.y);
        } else if (distance < 50) {
            // Move away if too close
            bot.setTarget(
                bot.x - Math.cos(angle) * 100,
                bot.y - Math.sin(angle) * 100
            );
        }
        
        // Combat
        if (distance < 50 && bot.canUseMelee()) {
            bot.useMelee();
            const damageDealt = nearestEnemy.takeDamage(bot.currentStats.meleeDamage, 'melee');
            bot.stats.damageDealt += damageDealt;
            
            if (!nearestEnemy.isAlive()) {
                this.handleKill(bot, nearestEnemy);
            }
        } else if (distance < 200 && bot.canUseRanged()) {
            bot.useRanged();
            const projectile = new Projectile(
                bot.x,
                bot.y,
                angle,
                bot.currentStats.rangedDamage,
                8,
                bot.id,
                'bullet'
            );
            this.projectiles.push(projectile);
        }
        
        // Use ability randomly
        if (Math.random() < 0.01 && bot.canUseAbility()) {
            bot.activateAbility();
        }
    }

    findNearestEnemy(bot) {
        let nearest = null;
        let minDistance = Infinity;
        
        this.bots.forEach(other => {
            if (other !== bot && other.isAlive()) {
                const distance = bot.distanceTo(other);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = other;
                }
            }
        });
        
        return nearest;
    }

    render() {
        // Clear canvas
        this.renderer.clear();
        
        // Render based on game state
        switch (this.state) {
            case GAME_STATES.MENU:
                this.renderer.renderMenu();
                break;
            case GAME_STATES.BOT_SELECT:
                this.renderer.renderBotSelect(this.playerProfile);
                break;
            case GAME_STATES.PLAYING:
                this.renderer.renderGame(
                    this.bots,
                    this.projectiles,
                    this.hazards,
                    this.effectsSystem.effects,
                    this.playerBot
                );
                break;
            case GAME_STATES.PAUSED:
                this.renderer.renderGame(
                    this.bots,
                    this.projectiles,
                    this.hazards,
                    this.effectsSystem.effects,
                    this.playerBot
                );
                this.renderer.renderPauseOverlay();
                break;
            case GAME_STATES.GAME_OVER:
                this.renderer.renderGameOver(this.matchData, this.playerProfile);
                break;
            case GAME_STATES.LOBBY:
                this.renderer.renderLobby(this.roomCode, this.players);
                break;
        }
    }

    gameLoop(timestamp) {
        if (!this.running) return;
        
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Fixed timestep with interpolation
        this.accumulator += deltaTime;
        while (this.accumulator >= GAME_CONFIG.FIXED_TIMESTEP) {
            this.update(GAME_CONFIG.FIXED_TIMESTEP);
            this.accumulator -= GAME_CONFIG.FIXED_TIMESTEP;
        }
        
        // Render
        this.render();
        
        // Continue loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    stop() {
        this.running = false;
    }

    // Physics utility methods for special effects and abilities
    
    /**
     * Apply explosion force to nearby entities
     * @param {number} x - Explosion center X
     * @param {number} y - Explosion center Y
     * @param {number} force - Explosion force magnitude
     * @param {number} radius - Explosion radius
     */
    applyExplosionForce(x, y, force = 100, radius = 150) {
        const affectedEntities = [...this.bots, ...this.projectiles].filter(entity => entity.isAlive && entity.isAlive());
        this.physics.applyExplosionForce(x, y, force, radius, affectedEntities);
    }

    /**
     * Apply force to a specific entity
     * @param {Object} entity - Entity to apply force to
     * @param {number} forceX - Force X component
     * @param {number} forceY - Force Y component
     */
    applyForceToEntity(entity, forceX, forceY) {
        this.physics.applyForce(entity, forceX, forceY, this.FIXED_TIMESTEP);
    }

    /**
     * Apply impulse (instant velocity change) to an entity
     * @param {Object} entity - Entity to apply impulse to
     * @param {number} impulseX - Impulse X component
     * @param {number} impulseY - Impulse Y component
     */
    applyImpulseToEntity(entity, impulseX, impulseY) {
        this.physics.applyImpulse(entity, impulseX, impulseY);
    }

    /**
     * Calculate projectile trajectory for aiming assistance
     * @param {number} x - Start X position
     * @param {number} y - Start Y position
     * @param {number} angle - Launch angle
     * @param {number} speed - Initial speed
     * @param {boolean} withGravity - Include gravity in calculation
     * @returns {Array} Array of trajectory points
     */
    calculateTrajectory(x, y, angle, speed, withGravity = false) {
        const gravity = withGravity ? this.physics.GRAVITY : 0;
        return this.physics.calculateTrajectory(x, y, angle, speed, gravity);
    }

    /**
     * Get physics debug information
     * @returns {Object} Debug information
     */
    getPhysicsDebugInfo() {
        return this.physics.getDebugInfo();
    }

    // Provide a minimal, serializable game state snapshot for UI/HUD
    getGameState() {
        const botsState = this.bots.map(b => ({
            id: b.id,
            playerId: b.playerId,
            className: b.className,
            position: { x: b.x, y: b.y },
            rotation: b.angle,
            team: b.playerId && typeof b.playerId === 'string' && b.playerId.startsWith('ai') ? 'ai' : 'player',
            health: b.health,
            maxHealth: b.maxHealth
        }));

        return {
            arenaWidth: this.width,
            arenaHeight: this.height,
            bots: botsState,
            playerBot: this.playerBot || null,
            // Optional fields used by HUD; provide safe defaults
            score: this.matchData?.kills || 0,
            kills: this.matchData?.kills || 0,
            deaths: this.matchData?.deaths || 0,
            matchTime: this.matchData?.endTime
                ? (this.matchData.endTime - this.matchData.startTime)
                : (Date.now() - (this.matchData?.startTime || Date.now())),
            abilities: {
                primary: { name: 'Primary', ready: true },
                secondary: { name: 'Secondary', ready: true }
            },
            progression: {
                level: this.playerProfile?.level || 1,
                xp: this.playerProfile?.xp || 0,
                nextLevelXP: 1000
            },
            players: botsState
        };
    }

    // Summary for game-over screen
    getMatchStats() {
        const duration = (this.matchData?.endTime || Date.now()) - (this.matchData?.startTime || Date.now());
        const totalKills = this.matchData?.kills || 0;
        const winner = this.playerBot && this.playerBot.isAlive && this.playerBot.isAlive() ? 'Player' : 'AI';
        return { duration, totalKills, winner };
    }
}
