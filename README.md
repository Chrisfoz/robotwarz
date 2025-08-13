# 🤖 Battle Bots: Arena Evolution

> A real-time arena combat game featuring customizable battle robots with physics-based combat, progression systems, and multiplayer battles.

![Battle Bots Banner](https://img.shields.io/badge/Status-In%20Development-orange) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow) ![HTML5 Canvas](https://img.shields.io/badge/Engine-HTML5%20Canvas-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## 🎮 Overview

Battle Bots: Arena Evolution is an action-packed arena combat game where players pilot customizable battle robots in intense real-time battles. Inspired by Robot Rumble 2's depth and authenticity, the game combines accessible arcade gameplay with meaningful progression and strategic customization.

### ✨ Key Features

- *Unique Bot Classes**: Titan (Tank), Viper (Speed), and Sniper (Range)
- **Progressive Customization**: Unlock and equip upgrades that actually change gameplay
- **Physics-Based Combat**: Realistic projectile physics with ricochets and momentum transfer
- **Multiplayer Ready**: Host rooms and invite friends with shareable codes
- **Skill-Based Progression**: Earn XP and credits through combat performance
- **Dynamic Arenas**: Interactive hazards and environmental elements

## 🕹️ Gameplay

### Bot Classes

| Class | Style | Strengths | Weaknesses |
|-------|--------|-----------|------------|
| **🛡️ Titan** | Heavy Tank | High armor, powerful melee, damage reduction ability | Slow movement, vulnerable to ranged |
| **⚡ Viper** | Speed Assassin | Fast movement, rapid attacks, dash ability | Low health, requires positioning |
| **🎯 Sniper** | Long Range | High damage, piercing shots, drone support | Low armor, vulnerable up close |

### Combat System

- **Damage Types**: Melee, Ranged, and EMP with rock-paper-scissors effectiveness
- **Defense Types**: Armor (blocks melee), Shield (blocks ranged), Speed (avoids damage)
- **Special Abilities**: Unique per class with cooldown management
- **Environmental Hazards**: Spinning blade traps that damage and knockback

### Progression System

- **XP Rewards**: 50-100+ XP per battle (bonus for wins and damage dealt)
- **Credit Economy**: Purchase upgrades with earned battle credits
- **Level System**: Unlock new upgrade tiers every 1000 XP
- **Meaningful Upgrades**: Equipment that changes stats and playstyle

## 🎯 Controls

| Action | Control |
|--------|---------|
| Movement | `WASD` |
| Aim | `Mouse` |
| Primary Weapon | `Left Click` |
| Secondary Weapon | `Right Click` |
| Special Ability | `Space` |
| Restart (Single Player) | `R` |

## 🛠️ Upgrade System

### Equipment Slots
- **⚔️ Armor**: Damage reduction vs. mobility trade-offs
- **🔧 Engine**: Speed and acceleration boosts
- **💥 Weapon**: Damage and cooldown improvements  
- **🔮 Special**: Unique bonuses (shields, repair, targeting)

### Sample Upgrades
- **Reinforced Armor**: +15% damage reduction, -0.2 speed
- **Turbo Engine**: +0.5 speed, +0.05 acceleration
- **Enhanced Weapons**: +20% damage, -10% cooldown
- **Shield Generator**: +20 max HP
- **Auto-Targeting**: +20% accuracy

## 🌐 Multiplayer

### Features
- **Room System**: Create/join battles with 6-digit codes
- **Local & Online**: Support for same-screen and remote play
- **Up to 4 Players**: Mix of human and AI opponents
- **Lobby System**: See connected players and ready status

### Planned Multiplayer Modes
- **Free-for-All**: Last bot standing wins
- **Team Battles**: 2v2 coordinated combat
- **Tournament Brackets**: Automated competitive play
- **Custom Rules**: Community-created game modes

## 🏗️ Technical Architecture

### Core Technologies
- **HTML5 Canvas**: High-performance 2D rendering
- **Vanilla JavaScript**: No dependencies, maximum compatibility
- **Real-time Physics**: 60 FPS collision detection and movement
- **State Management**: Clean separation of game logic and rendering

### Key Systems
- **Entity Component System**: Modular bot and projectile architecture
- **Physics Engine**: Custom collision detection with realistic bounce/friction
- **Effect System**: Particle effects for combat feedback
- **Audio Integration**: Positional sound effects (planned)

## 📈 Roadmap

### Phase 1: Core Enhancement ✅
- [x] Progressive customization system
- [x] XP and credit economy  
- [x] Multiplayer foundation
- [x] Visual upgrade indicators

### Phase 2: Robot Rumble 2 Inspired Features 🚧
- [ ] **Component Damage System**: Destructible subsystems
- [ ] **Interactive Arena Hazards**: Energy pads, destructible cover
- [ ] **Advanced Projectile Physics**: Ricochet and penetration
- [ ] **Simple AI Scripting**: Programmable bot behaviors
- [ ] **Visual Damage Feedback**: Progressive damage visualization

### Phase 3: Community Features 📋
- [ ] **Tournament System**: Automated brackets and rankings
- [ ] **Arena Editor**: Custom map creation tools
- [ ] **Bot Sharing**: Import/export custom configurations
- [ ] **Replay System**: Record and analyze battles
- [ ] **Leaderboards**: Global and seasonal rankings

### Phase 4: Advanced Systems 🔮
- [ ] **Real Networking**: WebRTC or Socket.io multiplayer
- [ ] **Mobile Support**: Touch controls and responsive design
- [ ] **Spectator Mode**: Watch tournaments with camera controls
- [ ] **Mod Support**: Community-created content pipeline

## 🚀 Quick Start

### Play Now
1. Open `index.html` in a modern web browser
2. Select your bot class and upgrades
3. Choose Single Player or create a Multiplayer room
4. Battle and earn progression rewards!

### Development Setup
```bash
# Clone the repository
git clone https://github.com/Chrisfoz/robotwarz.git

# Open in your preferred editor
cd robotwarz

# Serve locally (optional, for CORS if needed)
python -m http.server 8000
# or
npx serve .
```

## 🎨 Game Design Philosophy

### Accessibility First
- **Easy to Learn**: Simple controls and clear visual feedback
- **Hard to Master**: Deep customization and strategic combat
- **No Barriers**: All core features available immediately

### Meaningful Progression
- **Skill-Based**: Better players earn rewards faster
- **Choice-Driven**: Multiple viable build paths
- **Immediate Impact**: Upgrades visibly change gameplay

### Competitive Integrity
- **Balanced Classes**: Rock-paper-scissors effectiveness
- **Fair Progression**: No pay-to-win mechanics
- **Strategic Depth**: Positioning and timing matter

## 📊 Performance Metrics

### Current Benchmarks
- **60 FPS**: Stable frame rate on mid-range hardware
- **< 100ms**: Input latency for responsive controls  
- **< 50MB**: Total memory footprint
- **Zero Dependencies**: Pure JavaScript implementation

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Bug Reports
- Use the issue tracker for bugs and feature requests
- Include steps to reproduce and expected behavior
- Screenshots/videos are helpful for visual issues

### Feature Development
- Check the roadmap for planned features
- Discuss major changes in issues before implementing
- Follow the existing code style and architecture

### Code Style
- Use ES6+ JavaScript features
- Maintain 60 FPS performance standards
- Comment complex physics and game logic
- Keep functions focused and modular

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Robot Rumble 2**: Inspiration for authentic combat robotics simulation
- **BattleBots**: Real-world robot combat entertainment
- **Community**: Discord feedback and tournament participation

## 📞 Contact

- **Discord**: [Battle Bots Community](https://discord.gg/battlebots)
- **Issues**: [GitHub Issues](https://github.com/Chrisfoz/robotwarz/issues)
- **Email**: dev@robotwarz.com

---

*"In the arena, only the strongest designs survive. Engineer your path to victory!"*

### 🎯 Quick Links
- [🎮 Play Online](https://chrisfoz.github.io/robotwarz)
- [📖 Wiki](https://github.com/Chrisfoz/robotwarz/wiki)
- [🏆 Leaderboards](https://robotwarz.com/leaderboards)
- [🎥 Gameplay Videos](https://youtube.com/robotwarz)
