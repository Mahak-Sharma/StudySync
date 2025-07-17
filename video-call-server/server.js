const express = require('express');
const { ExpressPeerServer } = require('peer');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 9000;

// Middleware
app.use(cors({ origin: '*', credentials: true }));

// Simple test route
app.get('/', (req, res) => {
  res.send('✅ PeerJS Video Call Server is running!');
});

// 100ms Token Generation Endpoint
app.post('/100ms-token', express.json(), async (req, res) => {
  const { user_id, room_id, role } = req.body;
  if (!user_id || !room_id || !role) {
    return res.status(400).json({ error: 'user_id, room_id, and role are required' });
  }

  const HMS_MANAGEMENT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NTI3NTk0MjQsImV4cCI6MTc1MzM2NDIyNCwianRpIjoiMzBkYjU1ZmItNmU5My00YTcwLWJlY2ItMzE2MDViYmQ1OTM2IiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJuYmYiOjE3NTI3NTk0MjQsImFjY2Vzc19rZXkiOiI2ODc3OGRiNWJkMGRhYjVmOWEwMTMwN2QifQ.-i705R_3GYV4fgbjmUjjkAj_cNgWppW0v4l2tINOe3U'; // TODO: Replace with your actual management token or use env var

  try {
    const response = await fetch('https://api.100ms.live/v2/room-tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HMS_MANAGEMENT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id,
        room_id,
        role
      })
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.error || 'Failed to generate token' });
    }
    return res.json({ token: data.token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Endpoint to create 100ms room and room code
app.post('/create-100ms-room-code', express.json(), async (req, res) => {
  const { groupName } = req.body;
  if (!groupName) {
    return res.status(400).json({ error: 'groupName is required' });
  }

  const HMS_API_ENDPOINT = 'https://api.100ms.live/v2/rooms';
  const HMS_MANAGEMENT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NTI3NTg0OTAsImV4cCI6MTc1MzM2MzI5MCwianRpIjoiMTQ4ZjNiOWUtYmRiYi00MGU4LTkyZmMtMmFkOGUzNDM5ZDRmIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJuYmYiOjE3NTI3NTg0OTAsImFjY2Vzc19rZXkiOiI2ODc3OGRiNWJkMGRhYjVmOWEwMTMwN2QifQ.gLXkSCaCmKnbnnOt0kKmaCHd99aIDxoB0xgjIYGxIyA';
  const TEMPLATE_ID = '68778e51033903926e6172e2';

  try {
    // Step 1: Create the room
    const resRoom = await fetch(HMS_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HMS_MANAGEMENT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: groupName + '-' + Date.now(),
        description: `Room for group: ${groupName}`,
        template_id: TEMPLATE_ID
      })
    });
    const dataRoom = await resRoom.json();
    console.log('100ms room creation response (backend):', dataRoom);
    if (!resRoom.ok) return res.status(500).json({ error: 'Failed to create 100ms room', details: dataRoom });
    const roomId = dataRoom.id;
    if (!roomId) return res.status(500).json({ error: 'Room ID not found in 100ms response', details: dataRoom });

    // Step 2: Create the room code
    const resCode = await fetch('https://api.100ms.live/v2/room-codes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HMS_MANAGEMENT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        room_id: roomId
      })
    });
    const dataCode = await resCode.json();
    console.log('100ms room code creation response (backend):', dataCode);
    if (!resCode.ok) return res.status(500).json({ error: 'Failed to create 100ms room code', details: dataCode });
    return res.json({ code: dataCode.code });
  } catch (err) {
    console.error('Error creating 100ms room and code:', err);
    return res.status(500).json({ error: err.message });
  }
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
