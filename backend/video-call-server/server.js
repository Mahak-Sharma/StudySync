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
            "http://localhost:5174",
            "https://studysync-enqu.onrender.com"
        ], // Allow both local and hosted frontend
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
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

// Meeting rooms (for group video calls)
const meetingRooms = {}; // roomId -> Set of socket IDs
const meetingRoomNames = {}; // roomId -> { socketId: name }

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

    // --- MEETING ROOM FUNCTIONALITY (Group Video Calls) ---
    
    // Join a meeting room
    socket.on('join-room', ({ roomId, name }) => {
        console.log(`User ${name} (${socket.id}) joining meeting room ${roomId}`);
        socket.join(roomId);
        if (!meetingRooms[roomId]) meetingRooms[roomId] = new Set();
        if (!meetingRoomNames[roomId]) meetingRoomNames[roomId] = {};
        meetingRooms[roomId].add(socket.id);
        meetingRoomNames[roomId][socket.id] = name || socket.id;
        
        // Send current participants (with names) to the new user
        socket.emit('participants', Object.entries(meetingRoomNames[roomId]).map(([id, n]) => ({ id, name: n })));
        // Notify others
        socket.to(roomId).emit('user-joined', { id: socket.id, name: name || socket.id });
    });

    // Announce presence in a meeting room
    socket.on('announce', ({ groupId, userId, name }) => {
        console.log(`User ${name} (${userId}) announcing in meeting group ${groupId}`);
        if (!meetingRooms[groupId]) meetingRooms[groupId] = new Set();
        if (!meetingRoomNames[groupId]) meetingRoomNames[groupId] = {};
        meetingRooms[groupId].add(userId);
        meetingRoomNames[groupId][userId] = name || userId;
        io.to(groupId).emit('announce', { userId, name: name || userId });
        io.to(groupId).emit('participants', Object.entries(meetingRoomNames[groupId]).map(([id, n]) => ({ id, name: n })));
    });

    // Handle WebRTC signaling for meeting rooms
    socket.on('signal', ({ roomId, data }) => {
        console.log(`Meeting signal from ${socket.id} in room ${roomId}:`, data.type);
        socket.to(roomId).emit('signal', { sender: socket.id, data });
    });

    // Handle disconnection
    socket.on('disconnecting', () => {
        console.log(`User ${socket.id} disconnecting from rooms:`, Array.from(socket.rooms));
        
        // Handle meeting room disconnection
        for (const roomId of socket.rooms) {
            if (roomId !== socket.id) {
                socket.to(roomId).emit('user-left', socket.id);
                if (meetingRooms[roomId]) meetingRooms[roomId].delete(socket.id);
                if (meetingRoomNames[roomId]) delete meetingRoomNames[roomId][socket.id];
                io.to(roomId).emit('participants', Object.entries(meetingRoomNames[roomId] || {}).map(([id, n]) => ({ id, name: n })));
            }
        }
    });

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
        
        console.log('User disconnected:', socket.id);
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
        meetingRooms: Object.keys(meetingRooms).length,
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

// Get meeting rooms (for debugging)
app.get('/meeting-rooms', (req, res) => {
    const rooms = Object.keys(meetingRooms).map(roomId => ({
        roomId,
        participants: Array.from(meetingRooms[roomId] || []),
        participantNames: meetingRoomNames[roomId] || {}
    }));
    res.json({
        rooms: rooms,
        count: rooms.length
    });
});

const PORT = process.env.PORT || 5002;

server.listen(PORT, () => {
    console.log(`🎥 Video call server running on port ${PORT}`);
    console.log(`📡 Socket.IO server ready for WebRTC signaling`);
    console.log(`🤝 Meeting room functionality enabled`);
});

module.exports = { app, server, io }; 