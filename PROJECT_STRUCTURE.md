# Battle Bots: Arena Evolution - Project Structure Documentation

## 📁 Project Overview

This document provides a comprehensive breakdown of all files in the Battle Bots: Arena Evolution project, their purposes, dependencies, and current status.

## 🚨 Files to Delete (Unused/Redundant)

The following files should be deleted as they are no longer needed:

1. **enhanced_battle_bots.html** - Old monolithic version (1428 lines), replaced by modular architecture
2. **styles.css** - Unused, styles are embedded in index.html
3. **test.html** - Temporary test file created during debugging
4. **debug.html** - Temporary debug file created during debugging
5. **.history/** - VS Code history folder, not needed in repository
6. **assets/data/**, **assets/sounds/**, **assets/sprites/** - Empty directories, remove until needed

## ✅ Active Project Files

### 📄 Root Level Files

#### **index.html**
- **Purpose**: Main entry point for the game
- **Description**: Loads the canvas, displays loading screen, and bootstraps the game
- **Dependencies**: `src/main.js`
- **Status**: ✅ ACTIVE - Primary game file

#### **package.json**
- **Purpose**: Node.js project configuration
- **Description**: Defines project metadata and scripts
- **Dependencies**: None (no npm packages currently)
- **Status**: ✅ ACTIVE

### 📚 Documentation Files

#### **README.md**
- **Purpose**: Main project documentation
- **Description**: Overview of the game, features, and setup instructions
- **Status**: ✅ ACTIVE

#### **CLAUDE.md**
- **Purpose**: AI assistant guidelines
- **Description**: Comprehensive guidance for Claude Code when working with the codebase
- **Status**: ✅ ACTIVE

#### **IMPLEMENTATION_PLAN.md**
- **Purpose**: Development roadmap
- **Description**: Detailed plan for Phase 2 implementation
- **Status**: ✅ ACTIVE

#### **QUICKSTART.md**
- **Purpose**: Quick setup guide
- **Description**: Fast track instructions for getting the game running
- **Status**: ✅ ACTIVE

#### **PROJECT_STRUCTURE.md** (this file)
- **Purpose**: File documentation
- **Description**: Documents all project files and their purposes
- **Status**: ✅ ACTIVE

### 🎮 Core Game Engine (`src/core/`)

#### **Game.js**
- **Purpose**: Main game controller
- **Description**: Manages game state, game loop, entity management, and coordinates all systems
- **Dependencies**: All systems, entities, config/constants
- **Key Methods**: `initialize()`, `init()`, `startMatch()`, `update()`, `render()`, `gameLoop()`
- **Status**: ✅ ACTIVE - Central game logic

#### **Renderer.js**
- **Purpose**: Rendering engine
- **Description**: Handles all canvas drawing operations
- **Dependencies**: config/constants
- **Key Methods**: `renderGame()`, `renderMenu()`, `renderBot()`, `renderHUD()`
- **Status**: ✅ ACTIVE

#### **InputHandler.js**
- **Purpose**: Input management
- **Description**: Handles mouse, keyboard, and touch inputs
- **Dependencies**: None
- **Key Methods**: Event listeners for mouse/keyboard/touch
- **Status**: ✅ ACTIVE

#### **Physics.js**
- **Purpose**: Physics simulation
- **Description**: Handles movement, collisions, forces, and physics calculations
- **Dependencies**: None
- **Key Methods**: `updatePhysics()`, `applyForce()`, `checkCollision()`
- **Status**: ✅ ACTIVE

### 🤖 Game Entities (`src/entities/`)

#### **Bot.js**
- **Purpose**: Robot entity class
- **Description**: Defines bot behavior, stats, movement, and combat
- **Dependencies**: config/constants
- **Key Features**: Health, energy, abilities, upgrades
- **Status**: ✅ ACTIVE

#### **Projectile.js**
- **Purpose**: Projectile entities
- **Description**: Various projectile types (bullets, sniper shots, multi-shot)
- **Dependencies**: None
- **Exports**: `Projectile`, `SniperShot`, `MultiShot`, `TurretShot`, `ProjectileSystem`
- **Status**: ✅ ACTIVE

#### **hazard.js**
- **Purpose**: Environmental hazards
- **Description**: Lava pools, energy fields, crushers, turrets, mines
- **Dependencies**: None
- **Exports**: `HazardFactory`, `LavaPool`, `EnergyField`, `Crusher`, `Turret`, `Mine`, `HazardSystem`
- **Status**: ✅ ACTIVE

#### **Particle.js**
- **Purpose**: Visual effects particles
- **Description**: Particle system for explosions, sparks, smoke
- **Dependencies**: None
- **Exports**: `Particle`, `ParticleSystem`
- **Status**: ✅ ACTIVE

### ⚙️ Game Systems (`src/systems/`)

#### **CollisionSystem.js**
- **Purpose**: Collision detection
- **Description**: Handles collision detection between all game entities
- **Dependencies**: None
- **Status**: ✅ ACTIVE

#### **Combat.js**
- **Purpose**: Combat calculations
- **Description**: Damage calculation, combat mechanics
- **Dependencies**: config/constants
- **Status**: ✅ ACTIVE

#### **ComponentDamage.js**
- **Purpose**: Component-based damage system
- **Description**: Handles destructible bot parts
- **Dependencies**: None
- **Note**: Singleton pattern with default export
- **Status**: ✅ ACTIVE (Phase 2 feature)

#### **EffectsSystem.js**
- **Purpose**: Visual effects management
- **Description**: Manages all visual effects (explosions, hits, abilities)
- **Dependencies**: Particle system
- **Status**: ✅ ACTIVE

#### **EnhancedParticles.js**
- **Purpose**: Advanced particle effects
- **Description**: Enhanced particle system with more complex behaviors
- **Dependencies**: None
- **Note**: Singleton pattern with default export
- **Status**: ✅ ACTIVE

#### **SaveManager.js**
- **Purpose**: Save/load functionality
- **Description**: Handles player profile, settings, and game state persistence
- **Dependencies**: localStorage API
- **Key Methods**: `saveProfile()`, `loadProfile()`, `saveSettings()`
- **Status**: ✅ ACTIVE

#### **ScreenShake.js**
- **Purpose**: Camera shake effects
- **Description**: Adds screen shake for impacts and explosions
- **Dependencies**: None
- **Note**: Singleton pattern with default export
- **Status**: ✅ ACTIVE

#### **abilities.js**
- **Purpose**: Bot abilities system
- **Description**: Defines and manages special abilities
- **Dependencies**: config/constants
- **Exports**: `AbilitiesSystem`
- **Status**: ✅ ACTIVE

#### **progression.js**
- **Purpose**: Player progression
- **Description**: XP, levels, unlocks, achievements
- **Dependencies**: config/constants
- **Exports**: `ProgressionSystem`
- **Status**: ✅ ACTIVE

#### **upgrades.js**
- **Purpose**: Upgrade system
- **Description**: Bot upgrades and modifications
- **Dependencies**: config/constants
- **Exports**: `UpgradeSystem`
- **Status**: ✅ ACTIVE

### 🎨 User Interface (`src/ui/`)

#### **menu.js**
- **Purpose**: Main menu UI
- **Description**: Title screen, navigation
- **Dependencies**: Canvas context
- **Exports**: `MenuSystem`
- **Status**: ✅ ACTIVE

#### **hud.js**
- **Purpose**: In-game HUD
- **Description**: Health bars, scores, minimap
- **Dependencies**: Canvas context
- **Exports**: `HUDSystem`
- **Status**: ✅ ACTIVE

#### **shop.js**
- **Purpose**: Upgrade shop UI
- **Description**: Purchase upgrades and customizations
- **Dependencies**: Canvas context, SaveManager
- **Exports**: `ShopSystem`
- **Status**: ✅ ACTIVE

#### **lobby.js**
- **Purpose**: Multiplayer lobby UI
- **Description**: Room creation/joining, player list
- **Dependencies**: Canvas context
- **Exports**: `LobbySystem`
- **Status**: ✅ ACTIVE

### 🌐 Networking (`src/network/`)

#### **WebRTCManager.js**
- **Purpose**: Multiplayer networking
- **Description**: WebRTC peer-to-peer connections
- **Dependencies**: None
- **Note**: Singleton pattern with default export
- **Status**: ⚠️ PARTIAL - Mock implementation, needs real WebRTC

### 🛠️ Utilities (`src/utils/`)

#### **PerformanceMonitor.js**
- **Purpose**: Performance monitoring
- **Description**: FPS counter, performance metrics
- **Dependencies**: None
- **Note**: Singleton pattern with default export
- **Status**: ✅ ACTIVE

### ⚙️ Configuration (`src/config/`)

#### **constants.js**
- **Purpose**: Game configuration
- **Description**: All game constants, settings, and configurations
- **Exports**: `GAME_CONFIG`, `ARENA_CONFIG`, `BOT_CLASSES`, `COLORS`, `GAME_STATES`, `ECONOMY`, etc.
- **Status**: ✅ ACTIVE - Central configuration

### 🚀 Entry Point

#### **src/main.js**
- **Purpose**: Application bootstrap
- **Description**: Initializes all systems and starts the game
- **Dependencies**: All systems and core modules
- **Exports**: `BattleBotsGame` class (default)
- **Status**: ✅ ACTIVE - Main entry point

### 🖥️ Server Files (`server/`)

#### **signaling-server.js**
- **Purpose**: WebRTC signaling server
- **Description**: Facilitates WebRTC peer connections
- **Dependencies**: socket.io
- **Status**: ⚠️ FUTURE - For real multiplayer

#### **package.json** & **package-lock.json**
- **Purpose**: Server dependencies
- **Description**: Node.js dependencies for signaling server
- **Status**: ⚠️ FUTURE - For real multiplayer

### 🔧 Claude Configuration (`.claude/`)

#### **agents/*.md**
- **Purpose**: Claude agent configurations
- **Description**: Specialized agent prompts for different tasks
- **Status**: ✅ ACTIVE - Claude tooling

#### **commands/primer.md**
- **Purpose**: Claude command configuration
- **Description**: Custom commands for Claude
- **Status**: ✅ ACTIVE - Claude tooling

#### **settings.local.json**
- **Purpose**: Local Claude settings
- **Description**: User-specific Claude configuration
- **Status**: ✅ ACTIVE - Claude tooling

## 🔗 Key Dependencies Flow

```
index.html
    └── src/main.js (BattleBotsGame)
        ├── src/core/Game.js (orchestrates everything)
        │   ├── All entity classes
        │   ├── All system classes
        │   └── src/config/constants.js
        ├── src/core/Renderer.js
        ├── src/core/InputHandler.js
        ├── src/core/Physics.js
        ├── All UI components
        └── All system components
```

## 📊 Module Patterns Used

1. **ES6 Classes with exports**: Most modules
2. **Singleton with default export**: ComponentDamage, ScreenShake, EnhancedParticles, WebRTCManager, PerformanceMonitor
3. **Factory pattern**: HazardFactory

## 🎯 Recommended Actions

1. **Delete unused files** listed in the "Files to Delete" section
2. **Keep all files** in the "Active Project Files" section
3. **Consider consolidating** singleton modules to use consistent patterns
4. **Future work**: Implement real WebRTC in WebRTCManager when multiplayer is needed

## 📝 Notes

- The project has successfully transitioned from a monolithic `enhanced_battle_bots.html` to a modular architecture
- All core systems are properly separated and follow single responsibility principle
- The game uses vanilla JavaScript with ES6 modules - no external dependencies for the game itself
- Server files are prepared for future multiplayer implementation but not currently active