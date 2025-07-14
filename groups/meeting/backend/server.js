const express = require('express');
const http = require('http');
const cors = require('cors');
const { PeerServer } = require('peer');

const app = express();
const server = http.createServer(app);

// Enable CORS for all origins (for demo/cross-device)
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
    "http://localhost:5173",
    "https://studysync-irks.onrender.com",
    "https://studysync-3435a.web.app",
    "https://studysync-3435a.firebaseapp.com"
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Create PeerJS server - attach to the same HTTP server
const peerServer = PeerServer({
    server: server, // Attach to the existing HTTP server
    path: '/peerjs',
    allow_discovery: true,
    proxied: process.env.NODE_ENV === 'production',
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

// Store room information
const rooms = {}; // roomId -> Set of peer IDs
const roomNames = {}; // roomId -> { peerId: name }
const peerToRoom = {}; // peerId -> roomId

// Handle peer server events
peerServer.on('connection', (client) => {
    console.log('🔗 Peer connected:', client.getId());
});

peerServer.on('disconnect', (client) => {
    console.log('🔌 Peer disconnected:', client.getId());
    const peerId = client.getId();
    
    // Remove from all rooms
    if (peerToRoom[peerId]) {
        const roomId = peerToRoom[peerId];
        if (rooms[roomId]) {
            rooms[roomId].delete(peerId);
        }
        if (roomNames[roomId]) {
            delete roomNames[roomId][peerId];
        }
        delete peerToRoom[peerId];
        
        // Notify other peers in the room
        peerServer.emit('user-left-room', { roomId, peerId });
    }
});

peerServer.on('error', (error) => {
    console.error('❌ Peer server error:', error);
});

// REST API endpoints for room management
app.get('/api/rooms/:roomId/participants', (req, res) => {
    const { roomId } = req.params;
    const participants = roomNames[roomId] ? 
        Object.entries(roomNames[roomId]).map(([id, name]) => ({ id, name })) : 
        [];
    res.json({ participants });
});

app.post('/api/rooms/:roomId/join', (req, res) => {
    const { roomId } = req.params;
    const { peerId, name } = req.body;
    
    if (!rooms[roomId]) rooms[roomId] = new Set();
    if (!roomNames[roomId]) roomNames[roomId] = {};
    
    rooms[roomId].add(peerId);
    roomNames[roomId][peerId] = name || peerId;
    peerToRoom[peerId] = roomId;
    
    console.log(`User ${name} (${peerId}) joined room ${roomId}`);
    
    res.json({ 
        success: true, 
        participants: Object.entries(roomNames[roomId]).map(([id, n]) => ({ id, name: n }))
    });
});

app.post('/api/rooms/:roomId/leave', (req, res) => {
    const { roomId } = req.params;
    const { peerId } = req.body;
    
    if (rooms[roomId]) {
        rooms[roomId].delete(peerId);
    }
    if (roomNames[roomId]) {
        delete roomNames[roomId][peerId];
    }
    delete peerToRoom[peerId];
    
    console.log(`User ${peerId} left room ${roomId}`);
    
    res.json({ success: true });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'peer-meeting-server',
        rooms: Object.keys(rooms).length,
        totalPeers: Object.keys(peerToRoom).length,
        timestamp: Date.now()
    });
});

const PORT = process.env.PORT || 5003;
server.listen(PORT, () => {
    console.log(`🚀 PeerJS meeting server running on port ${PORT}`);
    console.log(`📡 PeerJS path: /peerjs`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`CORS enabled for: ${allowedOrigins.join(', ')}`);
});

module.exports = { app, server, peerServer }; 