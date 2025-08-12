/**
 * Simple WebSocket signaling server for WebRTC connections
 * Run with: node server/signaling-server.js
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const PORT = process.env.PORT || 3001;

// Store rooms and connections
const rooms = new Map(); // roomCode -> Set of player IDs
const connections = new Map(); // playerId -> WebSocket connection
const playerRooms = new Map(); // playerId -> roomCode

// Create HTTP server
const server = createServer();

// Create WebSocket server
const wss = new WebSocketServer({ server });

console.log(`🚀 Signaling server starting on port ${PORT}...`);

wss.on('connection', (ws) => {
    let playerId = null;
    
    console.log('📱 New connection established');
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            
            switch (message.type) {
                case 'register':
                    playerId = message.playerId;
                    connections.set(playerId, ws);
                    console.log(`✅ Player registered: ${playerId}`);
                    ws.send(JSON.stringify({ type: 'registered', playerId }));
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
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({ type: 'error', error: error.message }));
        }
    });
    
    ws.on('close', () => {
        console.log(`📴 Connection closed for ${playerId}`);
        if (playerId) {
            handleLeaveRoom(playerId);
            connections.delete(playerId);
        }
    });
    
    ws.on('error', (error) => {
        console.error(`WebSocket error for ${playerId}:`, error);
    });
});

/**
 * Handle room creation
 */
function handleCreateRoom(message) {
    const { roomCode, playerId } = message;
    
    if (rooms.has(roomCode)) {
        sendToPlayer(playerId, {
            type: 'error',
            error: 'Room already exists'
        });
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

/**
 * Handle joining room
 */
function handleJoinRoom(message) {
    const { roomCode, playerId } = message;
    
    if (!rooms.has(roomCode)) {
        sendToPlayer(playerId, {
            type: 'error',
            error: 'Room not found'
        });
        return;
    }
    
    const room = rooms.get(roomCode);
    const existingPlayers = Array.from(room);
    
    // Add player to room
    room.add(playerId);
    playerRooms.set(playerId, roomCode);
    
    console.log(`🚪 ${playerId} joined room ${roomCode}`);
    
    // Send room joined confirmation with existing players
    sendToPlayer(playerId, {
        type: 'roomJoined',
        roomCode,
        peers: existingPlayers,
        isHost: false
    });
    
    // Notify existing players
    existingPlayers.forEach(existingPlayerId => {
        sendToPlayer(existingPlayerId, {
            type: 'peerJoined',
            peerId: playerId
        });
    });
}

/**
 * Handle leaving room
 */
function handleLeaveRoom(playerId) {
    const roomCode = playerRooms.get(playerId);
    
    if (!roomCode) return;
    
    const room = rooms.get(roomCode);
    if (room) {
        room.delete(playerId);
        
        // Notify other players
        room.forEach(otherPlayerId => {
            sendToPlayer(otherPlayerId, {
                type: 'peerLeft',
                peerId: playerId
            });
        });
        
        // Delete room if empty
        if (room.size === 0) {
            rooms.delete(roomCode);
            console.log(`🗑️ Room ${roomCode} deleted (empty)`);
        }
    }
    
    playerRooms.delete(playerId);
    console.log(`👋 ${playerId} left room ${roomCode}`);
}

/**
 * Relay message between peers
 */
function relayMessage(message) {
    const { to, from } = message;
    
    if (!to || !from) {
        console.error('Missing to/from in relay message');
        return;
    }
    
    sendToPlayer(to, message);
    console.log(`📤 Relayed ${message.type} from ${from} to ${to}`);
}

/**
 * Send message to specific player
 */
function sendToPlayer(playerId, message) {
    const ws = connections.get(playerId);
    
    if (ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message));
    } else {
        console.warn(`Cannot send to ${playerId} - connection not found or closed`);
    }
}

/**
 * Broadcast to room
 */
function broadcastToRoom(roomCode, message, excludePlayerId = null) {
    const room = rooms.get(roomCode);
    
    if (!room) return;
    
    room.forEach(playerId => {
        if (playerId !== excludePlayerId) {
            sendToPlayer(playerId, message);
        }
    });
}

// Start server
server.listen(PORT, () => {
    console.log(`✅ Signaling server running on port ${PORT}`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
    
    // Log stats periodically
    setInterval(() => {
        console.log(`📊 Stats - Rooms: ${rooms.size}, Players: ${connections.size}`);
    }, 30000);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down signaling server...');
    
    // Notify all players
    connections.forEach((ws, playerId) => {
        ws.send(JSON.stringify({ type: 'serverShutdown' }));
        ws.close();
    });
    
    server.close(() => {
        console.log('✅ Server shut down');
        process.exit(0);
    });
});