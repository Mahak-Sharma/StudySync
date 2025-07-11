const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "https://studysync-enqu.onrender.com"
        ], // Allow both local and hosted frontend
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://studysync-enqu.onrender.com"
    ],
    credentials: true
}));
app.use(express.json());

// Store active users and their socket connections
const activeUsers = new Map(); // userId -> socket
const userSockets = new Map(); // socketId -> userId
const userRooms = new Map(); // userId -> roomId

// Video call rooms
const videoRooms = new Map(); // roomId -> { participants: Set, host: userId }

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins the video call system
    socket.on('user-ready', (data) => {
        const { username, displayName } = data;
        
        activeUsers.set(username, socket);
        userSockets.set(socket.id, username);
        
        console.log(`User ${displayName} (${username}) joined video call system`);
        
        // Notify user about their online friends
        socket.emit('user-connected', { 
            userId: username,
            message: 'Connected to video call system'
        });
    });

    // Handle friend call requests
    socket.on('call-request', (data) => {
        const { to, from, fromName } = data;
        
        console.log(`Call request from ${fromName} (${from}) to ${to}`);
        
        const targetSocket = activeUsers.get(to);
        if (targetSocket) {
            targetSocket.emit('call-request', {
                from: from,
                fromName: fromName,
                timestamp: Date.now()
            });
        } else {
            socket.emit('call-failed', {
                reason: 'User is not online',
                target: to
            });
        }
    });

    // Handle call acceptance
    socket.on('call-accepted', (data) => {
        const { to, from } = data;
        
        console.log(`Call accepted by ${from} for ${to}`);
        
        const targetSocket = activeUsers.get(to);
        if (targetSocket) {
            targetSocket.emit('call-accepted', {
                from: from,
                timestamp: Date.now()
            });
        }
    });

    // Handle call rejection
    socket.on('call-rejected', (data) => {
        const { to, from } = data;
        
        console.log(`Call rejected by ${from} for ${to}`);
        
        const targetSocket = activeUsers.get(to);
        if (targetSocket) {
            targetSocket.emit('call-rejected', {
                from: from,
                timestamp: Date.now()
            });
        }
    });

    // Handle call ending
    socket.on('call-ended', (data) => {
        const { to, from } = data;
        
        console.log(`Call ended by ${from} for ${to}`);
        
        const targetSocket = activeUsers.get(to);
        if (targetSocket) {
            targetSocket.emit('call-ended', {
                from: from,
                timestamp: Date.now()
            });
        }
    });

    // WebRTC signaling - ICE candidates
    socket.on('ice-candidate', (data) => {
        const { to, from, candidate } = data;
        
        const targetSocket = activeUsers.get(to);
        if (targetSocket) {
            targetSocket.emit('ice-candidate', {
                from: from,
                candidate: candidate
            });
        }
    });

    // WebRTC signaling - Offer
    socket.on('offer', (data) => {
        const { to, from, offer } = data;
        
        const targetSocket = activeUsers.get(to);
        if (targetSocket) {
            targetSocket.emit('offer', {
                from: from,
                offer: offer
            });
        }
    });

    // WebRTC signaling - Answer
    socket.on('answer', (data) => {
        const { to, from, answer } = data;
        
        const targetSocket = activeUsers.get(to);
        if (targetSocket) {
            targetSocket.emit('answer', {
                from: from,
                answer: answer
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const userId = userSockets.get(socket.id);
        
        if (userId) {
            console.log(`User ${userId} disconnected`);
            
            // Remove from active users
            activeUsers.delete(userId);
            userSockets.delete(socket.id);
            
            // Notify other users about disconnection
            socket.broadcast.emit('user-disconnected', {
                userId: userId,
                timestamp: Date.now()
            });
        }
    });

    // --- Group Video Call (Room) Support ---
    // Join a group call room
    socket.on('join-room', (data) => {
        const { roomId, userId, displayName } = data;
        socket.join(roomId);
        userRooms.set(userId, roomId);
        console.log(`${displayName} (${userId}) joined room ${roomId}`);
        // Notify others in the room
        socket.to(roomId).emit('user-joined-room', { userId, displayName });
    });

    // Leave a group call room
    socket.on('leave-room', (data) => {
        const { roomId, userId } = data;
        socket.leave(roomId);
        userRooms.delete(userId);
        console.log(`${userId} left room ${roomId}`);
        socket.to(roomId).emit('user-left-room', { userId });
    });

    // Group signaling: offer
    socket.on('group-offer', (data) => {
        const { roomId, from, offer } = data;
        socket.to(roomId).emit('group-offer', { from, offer });
    });

    // Group signaling: answer
    socket.on('group-answer', (data) => {
        const { roomId, from, answer } = data;
        socket.to(roomId).emit('group-answer', { from, answer });
    });

    // Group signaling: ice-candidate
    socket.on('group-ice-candidate', (data) => {
        const { roomId, from, candidate } = data;
        socket.to(roomId).emit('group-ice-candidate', { from, candidate });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        activeUsers: activeUsers.size,
        timestamp: Date.now()
    });
});

// Get online users (for debugging)
app.get('/users', (req, res) => {
    const users = Array.from(activeUsers.keys());
    res.json({
        users: users,
        count: users.length
    });
});

const PORT = process.env.PORT || 5002;

server.listen(PORT, () => {
    console.log(`🎥 Video call server running on port ${PORT}`);
    console.log(`📡 Socket.IO server ready for WebRTC signaling`);
});

module.exports = { app, server, io }; 