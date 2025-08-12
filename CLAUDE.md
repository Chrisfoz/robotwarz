# CLAUDE.md - Battle Bots: Arena Evolution

This file provides comprehensive guidance to Claude Code when working with the Battle Bots Arena Evolution codebase.

## 🎮 Project Overview

Battle Bots: Arena Evolution is a real-time arena combat game featuring customizable battle robots with physics-based combat, progression systems, and multiplayer battles. The game is built using vanilla JavaScript and HTML5 Canvas with no external dependencies.

## 🏗️ Core Development Philosophy

### KISS (Keep It Simple, Stupid)
Prioritize straightforward solutions over complex ones. The game currently uses vanilla JavaScript with no dependencies - maintain this simplicity whenever possible.

### YAGNI (You Aren't Gonna Need It)
Implement features only when actively needed for gameplay. Avoid speculative feature development unless part of the roadmap.

### Performance First
Maintain 60 FPS performance as the top priority. All features must be optimized for smooth gameplay.

## 📁 Project Structure

```
battlebots/
├── enhanced_battle_bots.html    # Main game file (all-in-one currently)
├── battle_bots_readme.md        # Project documentation
├── CLAUDE.md                    # This file
└── future/                      # Future modular structure
    ├── src/
    │   ├── core/               # Game engine core
    │   │   ├── game.js
    │   │   ├── physics.js
    │   │   └── renderer.js
    │   ├── entities/           # Game entities
    │   │   ├── bot.js
    │   │   ├── projectile.js
    │   │   └── hazard.js
    │   ├── systems/            # Game systems
    │   │   ├── combat.js
    │   │   ├── progression.js
    │   │   └── multiplayer.js
    │   └── ui/                 # User interface
    │       ├── menu.js
    │       ├── hud.js
    │       └── upgrades.js
    └── assets/                 # Game assets (future)
        ├── sprites/
        ├── sounds/
        └── data/
```

## 🛠️ Code Standards

### File Organization
- **Current State**: All code is in `enhanced_battle_bots.html` (monolithic)
- **Future Goal**: Modularize into separate files when complexity requires it
- **File Size Limit**: Never exceed 2000 lines in a single file
- **Function Size**: Keep functions under 50 lines with single responsibility

### JavaScript Style Guide
```javascript
// Use ES6+ features
const GAME_CONSTANTS = {
    FPS: 60,
    ARENA_WIDTH: 800,
    ARENA_HEIGHT: 600
};

// Clear naming conventions
class BattleBot {
    constructor(config) {
        this.health = config.health;
        this.maxHealth = config.maxHealth;
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
    }
    
    // Methods should have single responsibility
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }
}

// Use arrow functions for callbacks
particles.forEach(particle => particle.update(deltaTime));
```

### Naming Conventions
- **Variables/Functions**: camelCase (`playerBot`, `calculateDamage`)
- **Classes**: PascalCase (`BattleBot`, `ProjectileSystem`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PLAYERS`, `ARENA_BOUNDS`)
- **Private methods**: _leadingUnderscore (`_internalUpdate`)
- **Game states**: UPPER_SNAKE_CASE (`GAME_STATE_PLAYING`)

## 🎯 Game-Specific Guidelines

### Bot Classes Implementation
```javascript
// Each bot class should follow this structure
const BOT_CLASSES = {
    TITAN: {
        name: 'Titan',
        health: 150,
        speed: 3,
        damage: 25,
        armor: 0.3,  // 30% damage reduction
        color: '#4a5568',
        ability: 'damageReduction',
        cooldowns: {
            primary: 500,
            secondary: 1000,
            special: 10000
        }
    }
    // ... other classes
};
```

### Physics System
```javascript
// Maintain consistent physics calculations
// Always use deltaTime for frame-independent movement
position.x += velocity.x * deltaTime;
position.y += velocity.y * deltaTime;

// Collision detection should be optimized
// Use spatial partitioning for many entities
// Simple AABB for basic collisions
function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}
```

### Progression System
```javascript
// XP and credits should be meaningful
const REWARDS = {
    KILL: 100,
    DAMAGE_DEALT: 1,  // per point of damage
    WIN_BONUS: 50,
    PARTICIPATION: 25
};

// Upgrades must have trade-offs
const UPGRADES = {
    ARMOR: {
        effect: { armor: 0.15 },
        penalty: { speed: -0.2 },
        cost: 500
    }
};
```

## 🌐 Multiplayer Architecture

### Current Mock Implementation
- Room codes are 6-digit identifiers
- Local multiplayer only (same browser)
- State synchronization via shared game object

### Future Networking Goals
- WebRTC for peer-to-peer connections
- Socket.io fallback for reliability
- Authoritative server for competitive play
- Client-side prediction with server reconciliation

## 🧪 Testing Approach

### Manual Testing Checklist
- [ ] All bot classes playable
- [ ] Abilities work with correct cooldowns
- [ ] Collision detection accurate
- [ ] 60 FPS maintained with 4 players
- [ ] Upgrades apply correctly
- [ ] XP/credit rewards calculate properly
- [ ] Multiplayer room creation/joining works

### Performance Testing
```javascript
// Use performance monitoring
const frameStart = performance.now();
// ... game loop code ...
const frameTime = performance.now() - frameStart;
if (frameTime > 16.67) {  // More than 1/60 second
    console.warn(`Frame took ${frameTime}ms`);
}
```

## 🚨 Error Handling

### Game State Management
```javascript
// Always validate game state transitions
function changeGameState(newState) {
    const validTransitions = {
        MENU: ['PLAYING', 'LOBBY'],
        PLAYING: ['PAUSED', 'GAME_OVER', 'MENU'],
        PAUSED: ['PLAYING', 'MENU'],
        GAME_OVER: ['MENU', 'PLAYING']
    };
    
    if (!validTransitions[currentState]?.includes(newState)) {
        console.error(`Invalid state transition: ${currentState} -> ${newState}`);
        return false;
    }
    
    currentState = newState;
    return true;
}
```

### Input Validation
```javascript
// Sanitize all user inputs
function joinRoom(roomCode) {
    // Validate room code format
    if (!/^\d{6}$/.test(roomCode)) {
        throw new Error('Room code must be 6 digits');
    }
    // ... join logic
}
```

## 📈 Roadmap Implementation Priority

### Phase 2 Focus (Current)
1. **Component Damage System**: Destructible bot parts
2. **Arena Hazards**: Interactive environmental dangers
3. **Advanced Physics**: Projectile ricochets and penetration
4. **Visual Damage**: Progressive damage indicators

### Implementation Guidelines
- Each feature should be toggle-able for testing
- Maintain backward compatibility with save data
- Performance must not degrade below 60 FPS
- Features should enhance, not complicate gameplay

## 🎨 Visual & Audio Guidelines

### Canvas Rendering Order
1. Background/Arena
2. Environmental hazards
3. Projectiles
4. Bots
5. Particle effects
6. UI/HUD elements

### Color Palette
```javascript
const GAME_COLORS = {
    // UI Colors
    PRIMARY: '#56CCF2',
    SECONDARY: '#3a4c67',
    BACKGROUND: '#0f1419',
    
    // Bot Class Colors
    TITAN: '#4a5568',
    VIPER: '#48bb78',
    SNIPER: '#9f7aea',
    
    // Game Elements
    DAMAGE: '#fc8181',
    HEAL: '#68d391',
    ENERGY: '#63b3ed',
    WARNING: '#f6ad55'
};
```

## 🔧 Common Operations

### Adding New Bot Class
1. Define class in `BOT_CLASSES` object
2. Implement unique ability function
3. Add UI selection option
4. Test balance against existing classes
5. Update documentation

### Adding New Upgrade
1. Define upgrade in `UPGRADES` object
2. Implement effect application logic
3. Add to shop UI
4. Ensure save/load compatibility
5. Balance cost vs. benefit

### Adding Arena Hazard
1. Create hazard entity class
2. Implement collision detection
3. Add visual representation
4. Configure spawn logic
5. Test performance impact

## 🚀 Deployment Checklist

### Before Committing
- [ ] Code runs at 60 FPS
- [ ] No console errors in gameplay
- [ ] Multiplayer room system functional
- [ ] Save/load works correctly
- [ ] All bot classes balanced
- [ ] Controls responsive

### Performance Requirements
- Load time: < 2 seconds
- Memory usage: < 100MB
- Frame rate: Stable 60 FPS
- Input latency: < 100ms

## 📝 Documentation Standards

### Code Comments
```javascript
// Use JSDoc for functions
/**
 * Calculate damage with type effectiveness
 * @param {number} baseDamage - Base damage amount
 * @param {string} damageType - Type of damage (melee/ranged/emp)
 * @param {string} defenseType - Type of defense (armor/shield/speed)
 * @returns {number} Final damage after calculations
 */
function calculateDamage(baseDamage, damageType, defenseType) {
    // Implementation...
}

// Inline comments for complex logic only
// Explain WHY, not WHAT
```

## 🔐 Security Considerations

### Client-Side Validation
- Never trust client input
- Validate all game actions
- Sanitize room codes and player names
- Prevent code injection in chat (future)

### Future Server Requirements
- Authoritative game state
- Rate limiting for actions
- Anti-cheat detection
- Secure WebRTC signaling

## 💡 Best Practices

### Game Loop Optimization
```javascript
// Use requestAnimationFrame for smooth rendering
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTimestamp;
    
    // Fixed timestep with interpolation
    accumulator += deltaTime;
    while (accumulator >= FIXED_TIMESTEP) {
        updatePhysics(FIXED_TIMESTEP);
        accumulator -= FIXED_TIMESTEP;
    }
    
    // Render with interpolation
    const alpha = accumulator / FIXED_TIMESTEP;
    render(alpha);
    
    requestAnimationFrame(gameLoop);
}
```

### Memory Management
- Pool frequently created objects (projectiles, particles)
- Clear references to prevent memory leaks
- Use WeakMap for metadata when appropriate

## 🎯 Current Focus Areas

1. **Component Damage System**: Priority for Phase 2
2. **Real Multiplayer**: WebRTC implementation
3. **Mobile Support**: Touch controls and responsive design
4. **Performance**: Maintain 60 FPS with all features

## 📞 Quick References

### Key Files
- Main Game: `enhanced_battle_bots.html`
- Documentation: `battle_bots_readme.md`
- Guidelines: `CLAUDE.md` (this file)

### Important Constants
- Canvas Size: 800x600
- Target FPS: 60
- Max Players: 4
- Room Code Length: 6 digits

### Testing Commands
```bash
# Serve locally for testing
python -m http.server 8000
# or
npx serve .

# Open in browser
# http://localhost:8000/enhanced_battle_bots.html
```

---

*Remember: The goal is to create an engaging, performant battle bot game that's easy to play but hard to master. Every change should enhance the core gameplay loop of customization, combat, and progression.*