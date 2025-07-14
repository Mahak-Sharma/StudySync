const express = require('express');
const { PeerServer } = require('peer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors({
  origin: '*', // Or restrict to your frontend domain(s)
  credentials: true
}));

// Attach PeerJS server to Express
const peerServer = PeerServer({
  port: PORT,
  path: '/peerjs',
  allow_discovery: true,
  cors: {
    origin: '*',
    credentials: true
  }
});

app.get('/', (req, res) => {
  res.send('PeerJS Video Call Server is running!');
});

app.listen(PORT, () => {
  console.log(`PeerJS server running on port ${PORT}`);
}); 