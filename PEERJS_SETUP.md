# PeerJS Setup for StudySync Meeting Room

## Overview

The MeetingRoom component has been converted from Socket.IO to PeerJS for simplified WebRTC implementation. PeerJS handles all the signaling and peer connection management automatically.

## What Changed

### Before (Socket.IO)
- Complex WebRTC signaling implementation
- Manual peer connection management
- Custom offer/answer handling
- ICE candidate exchange
- Room-based participant management

### After (PeerJS)
- Simplified peer-to-peer connections
- Automatic signaling handled by PeerJS
- Direct peer calling with unique IDs
- Stream sharing with minimal code
- Built-in connection management

## Server Setup

### PeerJS Server
The PeerJS server runs on port 9000 and is started automatically with the development environment.

**File:** `backend/peer-server.js`
**Port:** 9000
**Path:** `/peerjs`

### Environment Variables
Add these to your `.env` file:

```env
# PeerJS Server Configuration
VITE_PEER_SERVER_HOST=localhost
VITE_PEER_SERVER_PORT=9000
```

## How It Works

### 1. Peer Initialization
Each user gets a unique peer ID when joining a meeting:
```javascript
const peerId = `${groupId}-${userName}-${Date.now()}`;
```

### 2. Connection Flow
1. User joins meeting room
2. PeerJS connects to signaling server
3. User gets their unique peer ID
4. Other users can connect using this ID

### 3. Peer-to-Peer Communication
- **Incoming calls:** Automatically handled by PeerJS
- **Outgoing calls:** Use `peerRef.current.call(peerId, localStream)`
- **Stream sharing:** Automatic through PeerJS call objects

## Usage

### Basic Meeting Room
```jsx
<MeetingRoom groupId="study-group-1" userName="John Doe" />
```

### Testing Peer Connections
1. Open the meeting room in one browser tab
2. Copy the peer ID shown in the status
3. Open another browser tab with the same meeting room
4. Use the "Connect to another peer" demo section to connect

### Manual Peer Connection
```javascript
// Call a specific peer
const callPeer = async (peerId) => {
  const call = peerRef.current.call(peerId, localStream.current);
  call.on('stream', (remoteStream) => {
    // Handle remote stream
  });
};
```

## Features

### ✅ What Works
- Local video/audio streaming
- Peer-to-peer video calls
- Microphone and camera toggles
- Connection status display
- Automatic peer discovery
- Stream management

### 🔄 Simplified
- No manual WebRTC signaling
- No complex peer connection setup
- No room management complexity
- Automatic ICE candidate handling

### 📝 Notes
- Peer IDs are unique per session
- Connections are direct peer-to-peer
- No central server for media streaming
- Works best with 2-4 participants

## Troubleshooting

### Common Issues

1. **PeerJS Connection Failed**
   - Check if PeerJS server is running on port 9000
   - Verify firewall settings
   - Check browser console for errors

2. **No Video/Audio**
   - Ensure camera/microphone permissions are granted
   - Check if local stream is active
   - Verify peer connection status

3. **Can't Connect to Peers**
   - Verify peer ID is correct
   - Check if both peers are online
   - Ensure both have joined the meeting room

### Debug Information
The component includes debug information showing:
- Peer connections count
- Stream status
- Local media tracks
- Peer ID

## Migration from Socket.IO

If you were using the old Socket.IO version:

1. **Remove Socket.IO dependencies** (optional)
2. **Update environment variables** to include PeerJS config
3. **Update any custom signaling code** to use PeerJS methods
4. **Test peer connections** using the demo interface

## Production Deployment

For production, update the PeerJS server configuration:

```javascript
// In peer-server.js
const peerServer = PeerServer({
  port: process.env.PEER_SERVER_PORT || 9000,
  path: '/peerjs',
  allow_discovery: true,
  proxied: true, // Enable for production
  cors: {
    origin: ['https://your-domain.com'],
    credentials: true
  }
});
```

And update environment variables:
```env
VITE_PEER_SERVER_HOST=your-peer-server-domain.com
VITE_PEER_SERVER_PORT=9000
``` 