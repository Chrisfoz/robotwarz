# Changelog

All notable changes to this project will be documented in this file.

## 2025-08-13 — Deployment-ready server integration and multiplayer robustness

Summary
- Integrated a single Node.js server that serves static files and hosts the WebRTC signaling WebSocket on the same port. This simplifies deployment (one service), fixes mixed-content issues on HTTPS, and enables multiplayer in production.
- Hardened WebRTC data channel negotiation and signaling URL resolution to work seamlessly in local and hosted environments.
- Improved game loop network sync lifecycle and initial canvas scaling.
- Made DEBUG_MODE environment-aware (off by default in production).

Changes
1) Combined HTTP + WebSocket server
- Added server/full-server.js
  - Serves index.html and /src/** statically
  - Provides GET /health for platform health checks
  - Hosts WebSocket signaling (ws/wss) on the same HTTP server/port
  - Adds periodic server stats logging (rooms/players)
  - Handles SIGINT/SIGTERM for graceful shutdown

2) WebRTC signaling and data channel fixes
- Updated src/network/WebRTCManager.js:
  - connectToSignalingServer(): resolves signaling URL dynamically via resolveSignalingURL() with support for same-origin ws(s) and a ?signal= override
  - Only the offerer creates the RTCDataChannel; the answerer now listens via pc.ondatachannel
  - Tracks hadSuccessfulConnection to control reconnection policy
  - Resets reconnectAttempts on successful connection

3) Multiplayer sync lifecycle and UX
- Updated src/main.js:
  - startNetworkSync() now stores/clears interval handles to avoid leaks across mode changes
  - Input broadcast listener is attached once and reused
  - showMenu() clears any active network sync interval
  - handleResize() is invoked during init for correct initial scale

4) Production-ready debug toggling
- Updated src/config/constants.js:
  - DEBUG_MODE now auto-detects based on hostname (localhost/127.0.0.1) and supports a ?debug=1 query param override
  - Default production builds won’t render debug overlays unless explicitly enabled

5) Deployment config updates
- Updated package.json:
  - scripts.start now runs node server/full-server.js
  - scripts.dev runs node --watch server/full-server.js for local dev
  - Added dependency "ws" for WebSocket server
- Updated railway.json:
  - startCommand now runs node server/full-server.js
- Updated nixpacks.toml:
  - Installs project dependencies with npm ci --omit=dev
  - start command runs node server/full-server.js

Notes
- Kept server/signaling-server.js for reference; the combined server replaces it in deployment.
- maintainers can still deploy signaling as a separate service if desired, but the combined server is the default.

Testing Plan

Local testing
1. Install dependencies
   - npm install
2. Start the server locally (Windows cmd)
   - set PORT=8000 && node server/full-server.js
3. Visit http://localhost:8000
   - Confirm game loads without console errors
4. Multiplayer sanity check (single machine)
   - Open two browser windows pointing to http://localhost:8000
   - Create a room in one window (Lobby)
   - Join the room from the other window
   - Observe console logs: “Connected to signaling server”, “Room created”, “Peer joined”, and “Data channel open”
5. Verify health endpoint
   - http://localhost:8000/health returns { status: "ok", uptime: ... }

Production testing (Railway or similar)
1. Deploy with the new railway.json and nixpacks.toml
2. Ensure service logs show:
   - “HTTP listening on http://0.0.0.0:PORT” and “WS listening on ws://0.0.0.0:PORT”
3. Access the public URL (https) and verify:
   - No mixed-content warnings
   - Multiplayer Lobby can create a room and accept joins
4. If hosting signaling separately:
   - Override signaling via URL: https://yourapp/ ?signal=wss://your-signal-host
5. Verify /health endpoint and periodic “📊 Stats - Rooms: X, Players: Y” logs

Logging and monitoring
- Client logs
  - WebRTC connection steps, data channel status, and latency logs
  - Game initialization and mode transitions
- Server logs
  - Player registration, room creation/join/leave events
  - Relay activity, warnings on failed sends
  - Periodic room and player counts
  - Graceful shutdown messages on SIGINT/SIGTERM
- Health check
  - GET /health for platform health/uptime checks

Operational guidance
- DEBUG_MODE
  - Enabled automatically on localhost and with ?debug=1
  - Disabled by default in production to preserve performance
- Signaling URL precedence
  - Use ?signal=... to force a specific ws(s) endpoint
  - Defaults to same-origin ws:// on HTTP, wss:// on HTTPS
- Scaling
  - The combined server is I/O-light for static files; multiplayer signaling scales by room count and message rate
  - Horizontal scale with sticky sessions isn’t required for P2P state but helps reduce reconnects; consider one replica initially

Potential next steps (optional)
- Add simple max room size limits and rate limiting on signaling to mitigate abuse
- Persist minimal server-side lobby state for diagnostics (room sizes, peer IDs) behind an admin endpoint
- Add on-screen multiplayer status indicator (connected, reconnecting, latency) in the Lobby UI
