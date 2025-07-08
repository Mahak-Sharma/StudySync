const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Enable CORS for all origins (for demo/cross-device)
app.use(cors());

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const rooms = {}; // roomId -> Set of socket IDs
const roomNames = {}; // roomId -> { socketId: name }

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', ({ roomId, name }) => {
        socket.join(roomId);
        if (!rooms[roomId]) rooms[roomId] = new Set();
        if (!roomNames[roomId]) roomNames[roomId] = {};
        rooms[roomId].add(socket.id);
        roomNames[roomId][socket.id] = name || socket.id;
        // Send current participants (with names) to the new user
        socket.emit('participants', Object.entries(roomNames[roomId]).map(([id, n]) => ({ id, name: n })));
        // Notify others
        socket.to(roomId).emit('user-joined', { id: socket.id, name: name || socket.id });
    });

    socket.on('announce', ({ groupId, userId, name }) => {
        if (!rooms[groupId]) rooms[groupId] = new Set();
        if (!roomNames[groupId]) roomNames[groupId] = {};
        rooms[groupId].add(userId);
        roomNames[groupId][userId] = name || userId;
        io.to(groupId).emit('announce', { userId, name: name || userId });
        io.to(groupId).emit('participants', Object.entries(roomNames[groupId]).map(([id, n]) => ({ id, name: n })));
    });

    socket.on('signal', ({ roomId, data }) => {
        socket.to(roomId).emit('signal', { sender: socket.id, data });
    });

    socket.on('disconnecting', () => {
        for (const roomId of socket.rooms) {
            if (roomId !== socket.id) {
                socket.to(roomId).emit('user-left', socket.id);
                if (rooms[roomId]) rooms[roomId].delete(socket.id);
                if (roomNames[roomId]) delete roomNames[roomId][socket.id];
                io.to(roomId).emit('participants', Object.entries(roomNames[roomId] || {}).map(([id, n]) => ({ id, name: n })));
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Meeting backend running on port ${PORT}`);
}); 