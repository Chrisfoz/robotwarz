/**
 * Combined HTTP static server + WebSocket signaling server
 * - Serves the game (index.html, /src/**) over HTTP
 * - Hosts WebSocket signaling for WebRTC on the same port (supports ws/wss)
 *
 * Usage:
 *   NODE_ENV=production node server/full-server.js
 *   (Railway or similar will set PORT automatically)
 */

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve project root (../ from this file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PORT = process.env.PORT || 3000;

// Basic content-type mapping
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

// Security: normalize and ensure path stays within ROOT_DIR
function resolvePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const safePath = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const absolute = path.join(ROOT_DIR, safePath);
  if (!absolute.startsWith(ROOT_DIR)) {
    return null; // attempted path traversal
  }
  return absolute;
}

// Serve a file with basic headers
async function serveFile(res, absolutePath) {
  try {
    const stat = await fs.stat(absolutePath);
    if (stat.isDirectory()) {
      // Directory: try index.html
      const indexPath = path.join(absolutePath, 'index.html');
      return await serveFile(res, indexPath);
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    const data = await fs.readFile(absolutePath);

    // Basic caching policy
    const headers = {
      'Content-Type': type
    };

    if (ext === '.js' || ext === '.css') {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else if (ext === '.html') {
      headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
    }

    res.writeHead(200, headers);
    res.end(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // SPA fallback to index.html
      try {
        const indexPath = path.join(ROOT_DIR, 'index.html');
        const data = await fs.readFile(indexPath);
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=0, must-revalidate'
        });
        res.end(data);
      } catch (e) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      }
    } else {
      console.error('Error serving file:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Internal Server Error');
    }
  }
}

// Create HTTP server
const server = createServer(async (req, res) => {
  try {
    if (!req.url) {
      res.writeHead(400).end();
      return;
    }

    const urlPath = new URL(req.url, 'http://localhost').pathname;

    // Health check
    if (urlPath === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
      return;
    }

    // Root -> index.html
    if (urlPath === '/' || urlPath === '') {
      await serveFile(res, path.join(ROOT_DIR, 'index.html'));
      return;
    }

    const absolute = resolvePath(urlPath);
    if (!absolute) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }

    await serveFile(res, absolute);
  } catch (err) {
    console.error('HTTP handler error:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error');
  }
});

// ==============================
// WebSocket Signaling (WebRTC)
// ==============================

// Store rooms and connections
const rooms = new Map();       // roomCode -> Set of player IDs
const connections = new Map(); // playerId -> WebSocket
const playerRooms = new Map(); // playerId -> roomCode

const wss = new WebSocketServer({ server });

console.log(`🚀 Starting combined server on port ${PORT}...`);

wss.on('connection', (ws) => {
  let playerId = null;
  console.log('📱 WS connection established');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      switch (message.type) {
        case 'register':
          playerId = message.playerId;
          connections.set(playerId, ws);
          console.log(`✅ Player registered: ${playerId}`);
          sendToPlayer(playerId, { type: 'registered', playerId });
          break;

        case 'createRoom':
          handleCreateRoom(message);
          break;

        case 'joinRoom':
          handleJoinRoom(message);
          break;

        case 'offer':
        case 'answer':
        case 'iceCandidate':
          relayMessage(message);
          break;

        case 'leaveRoom':
          handleLeaveRoom(message.playerId);
          break;

        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('WS message error:', error);
      try {
        ws.send(JSON.stringify({ type: 'error', error: error.message }));
      } catch {}
    }
  });

  ws.on('close', () => {
    console.log(`📴 WS closed for ${playerId}`);
    if (playerId) {
      handleLeaveRoom(playerId);
      connections.delete(playerId);
    }
  });

  ws.on('error', (error) => {
    console.error(`WS error for ${playerId}:`, error);
  });
});

function handleCreateRoom(message) {
  const { roomCode, playerId } = message;

  if (rooms.has(roomCode)) {
    sendToPlayer(playerId, { type: 'error', error: 'Room already exists' });
    return;
  }

  rooms.set(roomCode, new Set([playerId]));
  playerRooms.set(playerId, roomCode);

  console.log(`🏠 Room created: ${roomCode} by ${playerId}`);

  sendToPlayer(playerId, {
    type: 'roomCreated',
    roomCode,
    isHost: true
  });
}

function handleJoinRoom(message) {
  const { roomCode, playerId } = message;

  if (!rooms.has(roomCode)) {
    sendToPlayer(playerId, { type: 'error', error: 'Room not found' });
    return;
  }

  const room = rooms.get(roomCode);
  const existingPlayers = Array.from(room);

  room.add(playerId);
  playerRooms.set(playerId, roomCode);

  console.log(`🚪 ${playerId} joined room ${roomCode}`);

  // Confirm to joiner
  sendToPlayer(playerId, {
    type: 'roomJoined',
    roomCode,
    peers: existingPlayers,
    isHost: false
  });

  // Notify existing players
  existingPlayers.forEach((existingPlayerId) => {
    sendToPlayer(existingPlayerId, {
      type: 'peerJoined',
      peerId: playerId
    });
  });
}

function handleLeaveRoom(playerId) {
  const roomCode = playerRooms.get(playerId);
  if (!roomCode) return;

  const room = rooms.get(roomCode);
  if (room) {
    room.delete(playerId);

    // Notify others
    room.forEach((otherId) => {
      sendToPlayer(otherId, {
        type: 'peerLeft',
        peerId: playerId
      });
    });

    if (room.size === 0) {
      rooms.delete(roomCode);
      console.log(`🗑️ Room ${roomCode} deleted (empty)`);
    }
  }

  playerRooms.delete(playerId);
  console.log(`👋 ${playerId} left room ${roomCode}`);
}

function relayMessage(message) {
  const { to, from } = message;
  if (!to || !from) {
    console.error('Missing to/from in relay message');
    return;
  }
  sendToPlayer(to, message);
  console.log(`📤 Relayed ${message.type} from ${from} to ${to}`);
}

function sendToPlayer(playerId, message) {
  const ws = connections.get(playerId);
  if (ws && ws.readyState === ws.OPEN) {
    try {
      ws.send(JSON.stringify(message));
    } catch (err) {
      console.warn(`Failed to send to ${playerId}:`, err.message);
    }
  } else {
    console.warn(`Cannot send to ${playerId} - no open connection`);
  }
}

// Periodic stats
setInterval(() => {
  console.log(`📊 Stats - Rooms: ${rooms.size}, Players: ${connections.size}`);
}, 30000);

// Start listening
server.listen(PORT, () => {
  console.log(`✅ HTTP listening on http://0.0.0.0:${PORT}`);
  console.log(`📡 WS listening on ws://0.0.0.0:${PORT}`);
});

// Graceful shutdown
function shutdown() {
  console.log('\n🛑 Shutting down...');
  connections.forEach((ws, playerId) => {
    try {
      ws.send(JSON.stringify({ type: 'serverShutdown' }));
    } catch {}
    try {
      ws.close();
    } catch {}
  });

  server.close(() => {
    console.log('✅ Server shut down');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
