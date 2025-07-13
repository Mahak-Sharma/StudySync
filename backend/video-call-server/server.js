const express = require('express');
const http = require('http');
const cors = require('cors');
const { PeerServer } = require('peer');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://studysync-enqu.onrender.com"
    ],
    credentials: true
}));
app.use(express.json());

// Create PeerJS server
const peerServer = PeerServer({
    port: process.env.PEER_SERVER_PORT || 9000,
    path: '/peerjs',
    allow_discovery: true,
    proxied: process.env.NODE_ENV === 'production',
    cors: {
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "https://studysync-enqu.onrender.com"
        ],
        credentials: true
    }
});

// Store active users and their peer connections
const activeUsers = new Map(); // userId -> peerId
const userPeers = new Map(); // peerId -> userId
const userRooms = new Map(); // userId -> roomId

// Video call rooms
const videoRooms = new Map(); // roomId -> { participants: Set, host: userId }

// Handle peer server events
peerServer.on('connection', (client) => {
    console.log('🔗 Peer connected:', client.getId());
    
    // Extract user ID from peer ID (format: user-{userId}-{timestamp})
    const peerId = client.getId();
    const userIdMatch = peerId.match(/^user-([^-]+)-/);
    if (userIdMatch) {
        const userId = userIdMatch[1];
        activeUsers.set(userId, peerId);
        userPeers.set(peerId, userId);
        console.log(`User ${userId} connected with peer ID: ${peerId}`);
    }
});

peerServer.on('disconnect', (client) => {
    console.log('🔌 Peer disconnected:', client.getId());
    const peerId = client.getId();
    
    // Clean up user mappings
    const userId = userPeers.get(peerId);
    if (userId) {
        activeUsers.delete(userId);
        userPeers.delete(peerId);
        
        // Remove from rooms
        const roomId = userRooms.get(userId);
        if (roomId && videoRooms.has(roomId)) {
            videoRooms.get(roomId).participants.delete(userId);
            userRooms.delete(userId);
        }
        
        console.log(`User ${userId} disconnected`);
    }
});

peerServer.on('error', (error) => {
    console.error('❌ Peer server error:', error);
});

// REST API endpoints for user management
app.get('/api/users/:userId/status', (req, res) => {
    const { userId } = req.params;
    const isOnline = activeUsers.has(userId);
    const peerId = activeUsers.get(userId);
    
    res.json({
        userId,
        isOnline,
        peerId,
        timestamp: Date.now()
    });
});

app.get('/api/users/online', (req, res) => {
    const onlineUsers = Array.from(activeUsers.keys());
    res.json({
        onlineUsers,
        count: onlineUsers.length,
        timestamp: Date.now()
    });
});

app.post('/api/rooms/:roomId/join', (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;
    
    if (!videoRooms.has(roomId)) {
        videoRooms.set(roomId, { participants: new Set(), host: userId });
    }
    
    const room = videoRooms.get(roomId);
    room.participants.add(userId);
    userRooms.set(userId, roomId);
    
    console.log(`User ${userId} joined video room ${roomId}`);
    
    res.json({
        success: true,
        roomId,
        participants: Array.from(room.participants),
        host: room.host
    });
});

app.post('/api/rooms/:roomId/leave', (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;
    
    if (videoRooms.has(roomId)) {
        const room = videoRooms.get(roomId);
        room.participants.delete(userId);
        userRooms.delete(userId);
        
        // If room is empty, remove it
        if (room.participants.size === 0) {
            videoRooms.delete(roomId);
        }
        
        console.log(`User ${userId} left video room ${roomId}`);
    }
    
    res.json({ success: true });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'peer-video-call-server',
        onlineUsers: activeUsers.size,
        activeRooms: videoRooms.size,
        timestamp: Date.now()
    });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
    console.log(`🚀 PeerJS video call server running on port ${PORT}`);
    console.log(`📡 PeerJS path: /peerjs`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`CORS enabled for: localhost:5173, studysync-enqu.onrender.com`);
});

module.exports = { app, server, peerServer }; 