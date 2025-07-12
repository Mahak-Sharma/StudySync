const { PeerServer } = require('peer');
const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://studysync-enqu.onrender.com', 'https://studysync-frontend.onrender.com']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Create PeerJS server
const peerServer = PeerServer({
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
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'peer-server' });
});

// Handle peer server events
peerServer.on('connection', (client) => {
  console.log('🔗 Peer connected:', client.getId());
});

peerServer.on('disconnect', (client) => {
  console.log('🔌 Peer disconnected:', client.getId());
});

peerServer.on('error', (error) => {
  console.error('❌ Peer server error:', error);
});

const PORT = process.env.PEER_SERVER_PORT || 9000;

app.listen(PORT, () => {
  console.log(`🚀 PeerJS server running on port ${PORT}`);
  console.log(`📡 PeerJS path: /peerjs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, peerServer }; 