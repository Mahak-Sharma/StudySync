const { PeerServer } = require('peer');
const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors({
<<<<<<< HEAD
    origin: process.env.NODE_ENV === 'production'
        ? ['https://studysync-enqu.onrender.com', 'https://studysync-frontend.onrender.com']
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
=======
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://studysync-enqu.onrender.com', 'https://studysync-frontend.onrender.com']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
>>>>>>> 4ac216657b6331e49fad08bc5c18de19114ff827
}));

// Create PeerJS server
const peerServer = PeerServer({
<<<<<<< HEAD
    port: process.env.PEER_SERVER_PORT || 9000,
    path: '/peerjs',
    allow_discovery: true,
    proxied: process.env.NODE_ENV === 'production',
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? ['https://studysync-enqu.onrender.com', 'https://studysync-frontend.onrender.com']
            : ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true
    }
=======
  port: process.env.PEER_SERVER_PORT || 9000,
  path: '/peerjs',
  allow_discovery: true,
  proxied: process.env.NODE_ENV === 'production',
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://studysync-enqu.onrender.com', 'https://studysync-frontend.onrender.com']
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  }
>>>>>>> 4ac216657b6331e49fad08bc5c18de19114ff827
});

// Health check endpoint
app.get('/health', (req, res) => {
<<<<<<< HEAD
    res.json({ status: 'ok', service: 'peer-server' });
=======
  res.json({ status: 'ok', service: 'peer-server' });
>>>>>>> 4ac216657b6331e49fad08bc5c18de19114ff827
});

// Handle peer server events
peerServer.on('connection', (client) => {
<<<<<<< HEAD
    console.log('🔗 Peer connected:', client.getId());
});

peerServer.on('disconnect', (client) => {
    console.log('🔌 Peer disconnected:', client.getId());
});

peerServer.on('error', (error) => {
    console.error('❌ Peer server error:', error);
=======
  console.log('🔗 Peer connected:', client.getId());
});

peerServer.on('disconnect', (client) => {
  console.log('🔌 Peer disconnected:', client.getId());
});

peerServer.on('error', (error) => {
  console.error('❌ Peer server error:', error);
>>>>>>> 4ac216657b6331e49fad08bc5c18de19114ff827
});

const PORT = process.env.PEER_SERVER_PORT || 9000;

app.listen(PORT, () => {
<<<<<<< HEAD
    console.log(`🚀 PeerJS server running on port ${PORT}`);
    console.log(`📡 PeerJS path: /peerjs`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
=======
  console.log(`🚀 PeerJS server running on port ${PORT}`);
  console.log(`📡 PeerJS path: /peerjs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
>>>>>>> 4ac216657b6331e49fad08bc5c18de19114ff827
});

module.exports = { app, peerServer }; 