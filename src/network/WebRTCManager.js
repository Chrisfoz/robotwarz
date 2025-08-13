/**
 * WebRTCManager - Handles peer-to-peer connections for real multiplayer
 */
export class WebRTCManager {
    constructor() {
        this.peers = new Map(); // peerId -> RTCPeerConnection
        this.dataChannels = new Map(); // peerId -> RTCDataChannel
        this.isHost = false;
        this.roomCode = null;
        this.playerId = this.generatePlayerId();
        this.signalingServer = null;
        this.messageHandlers = new Map();
        
        // WebRTC configuration with STUN and TURN servers
        this.rtcConfig = {
            iceServers: [
                // STUN servers
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                
                // Public TURN servers for better NAT traversal
                // Note: These are public servers with limited reliability
                // Consider using your own TURN server for production
                {
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                }
            ],
            iceCandidatePoolSize: 10, // Pre-gather ICE candidates for faster connection
            iceTransportPolicy: 'all' // Use both STUN and TURN
        };
        
        this.connectionState = 'disconnected';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Network stats
        this.stats = {
            latency: 0,
            packetsLost: 0,
            jitter: 0,
            bandwidth: 0
        };
        this.hadSuccessfulConnection = false;
    }

    /**
     * Generate unique player ID
     */
    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Connect to signaling server
     */
    async connectToSignalingServer(serverUrl) {
        return new Promise((resolve, reject) => {
            // Add timeout to prevent hanging (increased for TURN server negotiation)
            const timeout = setTimeout(() => {
                if (this.signalingServer) {
                    this.signalingServer.close();
                }
                reject(new Error('Connection timeout - signaling server not available'));
            }, 5000);
            
            try {
                // Try local server first, then fall back to not using multiplayer
                const urlToUse = serverUrl || this.resolveSignalingURL();
                console.log(`📡 Attempting to connect to signaling server at ${urlToUse}...`);
                this.signalingServer = new WebSocket(urlToUse);
                
                this.signalingServer.onopen = () => {
                    clearTimeout(timeout);
                    console.log('✅ Connected to signaling server');
                    this.connectionState = 'connected';
                    this.hadSuccessfulConnection = true;
                    this.reconnectAttempts = 0;
                    this.sendToSignalingServer({
                        type: 'register',
                        playerId: this.playerId
                    });
                    resolve();
                };
                
                this.signalingServer.onmessage = (event) => {
                    this.handleSignalingMessage(JSON.parse(event.data));
                };
                
                this.signalingServer.onerror = (error) => {
                    clearTimeout(timeout);
                    console.warn('⚠️ Signaling server not available - multiplayer disabled');
                    reject(new Error('Signaling server not available'));
                };
                
                this.signalingServer.onclose = () => {
                    console.log('🔌 Disconnected from signaling server');
                    this.connectionState = 'disconnected';
                    // Attempt reconnect only if we had a successful connection before
                    if (this.hadSuccessfulConnection) {
                        this.attemptReconnect();
                    }
                };
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    /**
     * Resolve default signaling URL: ?signal= override, else same-origin ws/wss
     */
    resolveSignalingURL() {
        try {
            const params = new URLSearchParams(globalThis.location?.search || '');
            const override = params.get('signal');
            if (override) return override;
            const isHttps = globalThis.location?.protocol === 'https:';
            const host = globalThis.location?.host || 'localhost:3001';
            return `${isHttps ? 'wss' : 'ws'}://${host}`;
        } catch (e) {
            return 'ws://localhost:3001';
        }
    }

    /**
     * Create a room and become host
     */
    async createRoom() {
        if (!this.signalingServer || this.connectionState !== 'connected') {
            await this.connectToSignalingServer();
        }
        
        this.isHost = true;
        this.roomCode = this.generateRoomCode();
        
        this.sendToSignalingServer({
            type: 'createRoom',
            roomCode: this.roomCode,
            playerId: this.playerId
        });
        
        console.log(`🏠 Created room: ${this.roomCode}`);
        return this.roomCode;
    }

    /**
     * Join an existing room
     */
    async joinRoom(roomCode) {
        if (!this.signalingServer || this.connectionState !== 'connected') {
            await this.connectToSignalingServer();
        }
        
        this.isHost = false;
        this.roomCode = roomCode;
        
        this.sendToSignalingServer({
            type: 'joinRoom',
            roomCode: roomCode,
            playerId: this.playerId
        });
        
        console.log(`🚪 Joining room: ${roomCode}`);
    }

    /**
     * Generate 6-digit room code
     */
    generateRoomCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Handle signaling messages
     */
    async handleSignalingMessage(message) {
        switch (message.type) {
            case 'roomCreated':
                console.log('✅ Room created successfully');
                break;
                
            case 'roomJoined':
                console.log('✅ Joined room successfully');
                // Connect to existing peers
                if (message.peers) {
                    for (const peerId of message.peers) {
                        await this.createPeerConnection(peerId, true);
                    }
                }
                break;
                
            case 'peerJoined':
                console.log(`👤 Peer joined: ${message.peerId}`);
                if (this.isHost) {
                    await this.createPeerConnection(message.peerId, true);
                }
                break;
                
            case 'peerLeft':
                console.log(`👋 Peer left: ${message.peerId}`);
                this.removePeerConnection(message.peerId);
                break;
                
            case 'offer':
                await this.handleOffer(message.from, message.offer);
                break;
                
            case 'answer':
                await this.handleAnswer(message.from, message.answer);
                break;
                
            case 'iceCandidate':
                await this.handleIceCandidate(message.from, message.candidate);
                break;
                
            case 'error':
                console.error('❌ Signaling error:', message.error);
                break;
        }
    }

    /**
     * Create peer connection
     */
    async createPeerConnection(peerId, createOffer = false) {
        console.log(`🔗 Creating connection to ${peerId}`);
        
        const pc = new RTCPeerConnection(this.rtcConfig);
        this.peers.set(peerId, pc);
        
        // Set up connection timeout (increased for TURN server negotiation)
        const connectionTimeout = setTimeout(() => {
            if (pc.connectionState !== 'connected' && pc.connectionState !== 'connecting') {
                console.warn(`⏱️ Connection timeout with ${peerId}`);
                this.handleConnectionFailure(peerId);
            }
        }, 15000); // 15 seconds for TURN server connections
        
        // Set up data channel (only offerer creates; answerer listens)
        if (createOffer) {
            const dataChannel = pc.createDataChannel('gameData', {
                ordered: false,
                maxRetransmits: 0
            });
            this.setupDataChannel(dataChannel, peerId);
        } else {
            pc.ondatachannel = (event) => {
                this.setupDataChannel(event.channel, peerId);
            };
        }
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendToSignalingServer({
                    type: 'iceCandidate',
                    to: peerId,
                    candidate: event.candidate
                });
            }
        };
        
        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${peerId}: ${pc.connectionState}`);
            if (pc.connectionState === 'connected') {
                clearTimeout(connectionTimeout);
                this.onPeerConnected(peerId);
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                clearTimeout(connectionTimeout);
                this.handleConnectionFailure(peerId);
            }
        };
        
        // Create offer if initiating
        if (createOffer) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            this.sendToSignalingServer({
                type: 'offer',
                to: peerId,
                offer: offer
            });
        }
        
        return pc;
    }

    /**
     * Setup data channel
     */
    setupDataChannel(dataChannel, peerId) {
        dataChannel.onopen = () => {
            console.log(`📡 Data channel open with ${peerId}`);
            this.dataChannels.set(peerId, dataChannel);
            this.sendPing(peerId);
        };
        
        dataChannel.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleDataMessage(peerId, message);
        };
        
        dataChannel.onerror = (error) => {
            console.error(`Data channel error with ${peerId}:`, error);
        };
        
        dataChannel.onclose = () => {
            console.log(`Data channel closed with ${peerId}`);
            this.dataChannels.delete(peerId);
        };
    }

    /**
     * Handle offer from peer
     */
    async handleOffer(peerId, offer) {
        console.log(`📥 Received offer from ${peerId}`);
        
        let pc = this.peers.get(peerId);
        if (!pc) {
            pc = await this.createPeerConnection(peerId, false);
        }
        
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        this.sendToSignalingServer({
            type: 'answer',
            to: peerId,
            answer: answer
        });
    }

    /**
     * Handle answer from peer
     */
    async handleAnswer(peerId, answer) {
        console.log(`📥 Received answer from ${peerId}`);
        
        const pc = this.peers.get(peerId);
        if (pc) {
            await pc.setRemoteDescription(answer);
        }
    }

    /**
     * Handle ICE candidate
     */
    async handleIceCandidate(peerId, candidate) {
        const pc = this.peers.get(peerId);
        if (pc) {
            await pc.addIceCandidate(candidate);
        }
    }

    /**
     * Send message to signaling server
     */
    sendToSignalingServer(message) {
        if (this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
            this.signalingServer.send(JSON.stringify({
                ...message,
                from: this.playerId,
                roomCode: this.roomCode
            }));
        }
    }

    /**
     * Send game data to peer
     */
    sendToPeer(peerId, data) {
        const channel = this.dataChannels.get(peerId);
        if (channel && channel.readyState === 'open') {
            channel.send(JSON.stringify(data));
        }
    }

    /**
     * Broadcast to all peers
     */
    broadcast(data) {
        this.dataChannels.forEach((channel, peerId) => {
            if (channel.readyState === 'open') {
                channel.send(JSON.stringify(data));
            }
        });
    }

    /**
     * Handle data message from peer
     */
    handleDataMessage(peerId, message) {
        switch (message.type) {
            case 'gameState':
                this.handleGameState(peerId, message.data);
                break;
                
            case 'playerInput':
                this.handlePlayerInput(peerId, message.data);
                break;
                
            case 'ping':
                this.sendToPeer(peerId, { type: 'pong', timestamp: message.timestamp });
                break;
                
            case 'pong':
                this.calculateLatency(peerId, message.timestamp);
                break;
                
            default:
                // Custom message handlers
                const handler = this.messageHandlers.get(message.type);
                if (handler) {
                    handler(peerId, message);
                }
        }
    }

    /**
     * Register message handler
     */
    on(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
    }

    /**
     * Send ping to measure latency
     */
    sendPing(peerId) {
        this.sendToPeer(peerId, {
            type: 'ping',
            timestamp: Date.now()
        });
    }

    /**
     * Calculate latency from pong
     */
    calculateLatency(peerId, timestamp) {
        const latency = Date.now() - timestamp;
        this.stats.latency = latency;
        console.log(`📊 Latency with ${peerId}: ${latency}ms`);
    }

    /**
     * Handle game state update
     */
    handleGameState(peerId, gameState) {
        // To be implemented by game
        console.log(`Game state from ${peerId}:`, gameState);
    }

    /**
     * Handle player input
     */
    handlePlayerInput(peerId, input) {
        // To be implemented by game
        console.log(`Input from ${peerId}:`, input);
    }

    /**
     * Peer connected callback
     */
    onPeerConnected(peerId) {
        console.log(`✅ Peer connected: ${peerId}`);
        // Start periodic ping
        setInterval(() => this.sendPing(peerId), 5000);
    }

    /**
     * Peer disconnected callback
     */
    onPeerDisconnected(peerId) {
        console.log(`❌ Peer disconnected: ${peerId}`);
        this.removePeerConnection(peerId);
    }
    
    /**
     * Handle connection failure with retry logic
     */
    handleConnectionFailure(peerId) {
        console.warn(`⚠️ Connection failed with ${peerId}`);
        
        // Clean up the failed connection
        this.removePeerConnection(peerId);
        
        // Notify UI or game logic about connection failure
        const handler = this.messageHandlers.get('connectionFailed');
        if (handler) {
            handler({ peerId, reason: 'Connection failed or timed out' });
        }
        
        // If we're the host and a peer failed to connect, remove them from the room
        if (this.isHost && this.signalingServer && this.signalingServer.readyState === WebSocket.OPEN) {
            this.sendToSignalingServer({
                type: 'removePeer',
                peerId: peerId
            });
        }
    }

    /**
     * Remove peer connection
     */
    removePeerConnection(peerId) {
        const pc = this.peers.get(peerId);
        if (pc) {
            pc.close();
            this.peers.delete(peerId);
        }
        this.dataChannels.delete(peerId);
    }

    /**
     * Attempt reconnection to signaling server
     */
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connectToSignalingServer().catch(console.error);
            }, 2000 * this.reconnectAttempts);
        }
    }

    /**
     * Get connection statistics
     */
    async getStats() {
        const stats = [];
        
        for (const [peerId, pc] of this.peers) {
            const pcStats = await pc.getStats();
            const report = {
                peerId,
                connected: pc.connectionState === 'connected',
                latency: this.stats.latency
            };
            
            pcStats.forEach(stat => {
                if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
                    report.roundTripTime = stat.currentRoundTripTime * 1000;
                }
                if (stat.type === 'inbound-rtp') {
                    report.packetsLost = stat.packetsLost;
                    report.jitter = stat.jitter;
                }
            });
            
            stats.push(report);
        }
        
        return stats;
    }

    /**
     * Disconnect and cleanup
     */
    disconnect() {
        // Close all peer connections
        this.peers.forEach(pc => pc.close());
        this.peers.clear();
        this.dataChannels.clear();
        
        // Close signaling connection
        if (this.signalingServer) {
            this.signalingServer.close();
            this.signalingServer = null;
        }
        
        this.connectionState = 'disconnected';
        console.log('🔌 Disconnected from network');
    }
}

// Export singleton
export default new WebRTCManager();
