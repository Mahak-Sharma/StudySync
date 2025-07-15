const express = require('express');
const { ExpressPeerServer } = require('peer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 9000;

// Middleware
app.use(cors({ origin: '*', credentials: true }));

// Simple test route
app.get('/', (req, res) => {
  res.send('✅ PeerJS Video Call Server is running!');
});

// Start Express HTTP server
const server = app.listen(PORT, () => {
  console.log(`🌐 Express server listening on port ${PORT}`);
});

// Attach PeerJS to existing Express server
const peerServer = ExpressPeerServer(server, {
  path: '/peerjs',
  allow_discovery: true,
  cors: {
    origin: '*',
    credentials: true,
  },
});

app.use('/peerjs', peerServer);
