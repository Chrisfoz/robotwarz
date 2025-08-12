# 🎮 Battle Bots: Arena Evolution - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Game Server

```bash
# Option 1: Using Python (simplest)
python3 -m http.server 8000

# Option 2: Using Node.js
npm start

# Option 3: Using npx serve
npx serve . -p 8000
```

### 2. Open the Game

Navigate to: http://localhost:8000

### 3. Start Playing!

- **Single Player**: Click "Play Game" from the main menu
- **Multiplayer**: Click "Multiplayer" to create or join a room

## 🌐 Multiplayer Setup (Optional)

### Start the Signaling Server

```bash
# Install dependencies
cd server
npm install

# Start signaling server
npm start
```

The signaling server will run on port 3001.

### Create/Join Multiplayer Games

1. **Host a Game**:
   - Click "Multiplayer" → "Create Room"
   - Share the 6-digit room code with friends

2. **Join a Game**:
   - Click "Multiplayer" → "Join Room"
   - Enter the room code

## 🎮 Controls

- **Mouse**: Move and aim
- **Left Click**: Melee attack
- **Right Click**: Ranged attack
- **Space**: Special ability
- **ESC**: Pause
- **F3**: Toggle performance monitor

## 🛠️ Debug Features

- **Performance Monitor**: Press F3 to see FPS, render times, and system stats
- **Debug Mode**: Enabled by default (shows additional information)

## 📦 Project Structure

```
battlebots/
├── index.html              # Main game entry point
├── src/
│   ├── main.js            # Game integration
│   ├── core/              # Game engine
│   ├── entities/          # Game objects
│   ├── systems/           # Game systems
│   ├── ui/                # User interface
│   ├── network/           # Multiplayer
│   └── utils/             # Utilities
├── server/
│   └── signaling-server.js # WebRTC signaling
└── assets/                # Game assets
```

## ⚡ Features

### Visual Effects
- **Screen Shake**: Dynamic camera shake on impacts
- **Enhanced Particles**: Explosions, smoke, sparks, debris
- **Projectile Trails**: Glowing trails with gradients
- **Component Damage**: Visual damage indicators on bots

### Multiplayer
- **WebRTC**: Peer-to-peer connections
- **Room System**: 6-digit room codes
- **Real-time Sync**: 10Hz state updates
- **Low Latency**: Direct P2P connections

### Performance
- **60 FPS Target**: Optimized rendering
- **Performance Monitor**: Real-time profiling
- **Spatial Optimization**: Grid-based collision
- **Object Pooling**: Efficient particle management

## 🐛 Troubleshooting

### Game Won't Load
- Check console for errors (F12)
- Ensure all files are present
- Try a different browser

### Multiplayer Issues
- Ensure signaling server is running
- Check firewall settings
- Try using Chrome/Firefox

### Performance Issues
- Press F3 to check performance stats
- Reduce particle effects in settings
- Close other browser tabs

## 📊 Performance Tips

- The game targets 60 FPS
- Press F3 to monitor performance
- Chrome/Edge recommended for best performance
- Close unnecessary browser tabs

## 🎯 Game Modes

### Deathmatch
- Last bot standing wins
- Use environment hazards to your advantage
- Collect power-ups for temporary boosts

### Team Battle (Coming Soon)
- 2v2 team combat
- Coordinate with teammates
- Shared objectives

## 💡 Tips & Tricks

1. **Master Your Bot Class**: Each has unique abilities
2. **Use Cover**: Environmental objects block projectiles
3. **Manage Cooldowns**: Don't waste abilities
4. **Upgrade Wisely**: Balance offense and defense
5. **Learn Hazard Patterns**: Use them strategically

## 🔧 Development

### Local Development
```bash
# Start dev server with auto-reload
npm run dev

# Run signaling server in dev mode
cd server && npm run dev
```

### Testing Multiplayer Locally
1. Open multiple browser tabs
2. Create room in first tab
3. Join with room code in other tabs

## 📝 Commands Summary

```bash
# Start game server
python3 -m http.server 8000

# Start signaling server (for multiplayer)
cd server && npm start

# Install server dependencies
cd server && npm install
```

## 🎉 Enjoy the Game!

Battle Bots: Arena Evolution is now fully playable with:
- 5 unique bot classes
- 20+ upgrades
- Component damage system
- Real-time multiplayer
- Advanced visual effects

**Have fun battling!** 🤖⚔️🤖