# StudySync PeerJS Migration Guide

## Overview

This document outlines the complete migration of StudySync from Socket.IO to PeerJS for all WebRTC video calling functionality. This migration simplifies the codebase significantly by leveraging PeerJS's built-in WebRTC signaling and peer connection management.

## What Was Changed

### 🔄 **Backend Servers**

#### 1. Meeting Backend (`groups/meeting/backend/`)
- **Before**: Socket.IO server handling room management and WebRTC signaling
- **After**: PeerJS server with REST API endpoints for room management
- **File**: `server.js`
- **Port**: 5003

#### 2. Video Call Backend (`backend/video-call-server/`)
- **Before**: Socket.IO server for 1:1 and group video calls
- **After**: PeerJS server with user management APIs
- **File**: `server.js`
- **Port**: 5002

#### 3. Main PeerJS Server (`backend/peer-server.js`)
- **New**: Centralized PeerJS server for all WebRTC signaling
- **Port**: 9000
- **Path**: `/peerjs`

### 🎨 **Frontend Components**

#### 1. Main MeetingRoom (`src/components/MeetingRoom.jsx`)
- **Before**: Complex Socket.IO signaling with manual WebRTC setup
- **After**: Simplified PeerJS implementation with automatic peer discovery

#### 2. Groups MeetingRoom (`groups/meeting/frontend/MeetingRoom.jsx`)
- **Before**: Socket.IO-based meeting room
- **After**: PeerJS-based meeting room with demo interface

#### 3. VideoCallComponent (`src/components/VideoCall/VideoCallComponent.jsx`)
- **Before**: Socket.IO signaling for 1:1 calls
- **After**: Direct PeerJS peer-to-peer calls

#### 4. VideoCallContext (`src/contexts/VideoCallContext.jsx`)
- **Before**: Global Socket.IO state management
- **After**: Global PeerJS state management with simplified call handling

## Architecture Changes

### Before (Socket.IO)
```
Frontend ←→ Socket.IO Server ←→ WebRTC Signaling ←→ Peer Connections
```

### After (PeerJS)
```
Frontend ←→ PeerJS Server ←→ Direct Peer-to-Peer Connections
```

## Key Benefits

### ✅ **Simplified Code**
- **Before**: ~2000+ lines of complex WebRTC signaling code
- **After**: ~800 lines of simplified PeerJS implementation
- **Reduction**: ~60% code reduction

### 🚀 **Better Performance**
- Direct peer-to-peer connections
- No server-side media processing
- Reduced latency

### 🛠 **Easier Maintenance**
- No manual WebRTC signaling
- Built-in connection management
- Automatic ICE candidate handling

### 🔧 **Improved Reliability**
- PeerJS handles connection failures
- Automatic reconnection
- Better error handling

## Server Configuration

### Environment Variables
```env
# PeerJS Server Configuration
VITE_PEER_SERVER_HOST=localhost
VITE_PEER_SERVER_PORT=9000

# Backend Server Ports
PEER_SERVER_PORT=9000
PORT=5002  # Video call server
PORT=5003  # Meeting server
```

### Server Ports
- **9000**: PeerJS signaling server
- **5002**: Video call backend (REST APIs)
- **5003**: Meeting backend (REST APIs)

## Peer ID Format

### 1:1 Calls
```
user-{userId}-{timestamp}
Example: user-abc123-1703123456789
```

### Group Calls
```
{groupId}-{userName}-{timestamp}
Example: study-group-1-John-1703123456789
```

## API Endpoints

### Meeting Backend (`/api/rooms/`)
- `GET /api/rooms/:roomId/participants` - Get room participants
- `POST /api/rooms/:roomId/join` - Join a room
- `POST /api/rooms/:roomId/leave` - Leave a room

### Video Call Backend (`/api/users/`)
- `GET /api/users/:userId/status` - Get user online status
- `GET /api/users/online` - Get all online users

## Usage Examples

### 1:1 Video Call
```javascript
// Start a call
const call = peerRef.current.call(friendPeerId, localStream);

call.on('stream', (remoteStream) => {
  // Handle remote video stream
});

call.on('close', () => {
  // Handle call end
});
```

### Group Meeting
```javascript
// Join meeting room
const peerId = `${groupId}-${userName}-${Date.now()}`;
const peer = new Peer(peerId, { host: 'localhost', port: 9000 });

// Handle incoming calls from other participants
peer.on('call', (call) => {
  call.answer(localStream);
  call.on('stream', (remoteStream) => {
    // Add participant video
  });
});
```

## Migration Steps

### 1. Install Dependencies
```bash
npm install peerjs
```

### 2. Update Environment Variables
Add PeerJS configuration to your `.env` file.

### 3. Update Server Startup
The `start-dev.js` file has been updated to include the PeerJS server.

### 4. Test Components
- Test 1:1 video calls
- Test group meetings
- Test peer connections

## Testing

### Local Development
1. Start all servers: `npm run dev:all`
2. Open meeting room in one browser tab
3. Copy peer ID from status display
4. Open another tab and use demo interface to connect

### Production Deployment
1. Update environment variables for production
2. Deploy PeerJS server to your hosting platform
3. Update frontend configuration

## Troubleshooting

### Common Issues

1. **PeerJS Connection Failed**
   - Check if PeerJS server is running on port 9000
   - Verify firewall settings
   - Check browser console for errors

2. **No Video/Audio**
   - Ensure camera/microphone permissions
   - Check if local stream is active
   - Verify peer connection status

3. **Can't Connect to Peers**
   - Verify peer ID format
   - Check if both peers are online
   - Ensure both have joined the meeting

### Debug Information
All components include debug information showing:
- Connection status
- Peer connections count
- Stream status
- Local media tracks
- Peer ID

## Performance Considerations

### Scalability
- **Before**: Server handles all signaling (bottleneck)
- **After**: Direct peer-to-peer (scales better)

### Bandwidth
- **Before**: Server relays media (high bandwidth usage)
- **After**: Direct connections (lower server bandwidth)

### Latency
- **Before**: Server hop adds latency
- **After**: Direct connection (lower latency)

## Security

### Peer ID Security
- Peer IDs include timestamps to prevent reuse
- User IDs are extracted from peer IDs for validation
- Room-based access control maintained

### Connection Security
- TURN servers configured for NAT traversal
- HTTPS required for production
- CORS properly configured

## Future Enhancements

### Planned Features
1. **Screen Sharing**: Leverage PeerJS data channels
2. **File Transfer**: Use PeerJS data connections
3. **Chat**: Implement data channel messaging
4. **Recording**: Client-side recording capabilities

### Optimization Opportunities
1. **Connection Pooling**: Reuse peer connections
2. **Adaptive Quality**: Adjust video quality based on connection
3. **Fallback Mechanisms**: Graceful degradation for poor connections

## Rollback Plan

If issues arise, you can rollback by:
1. Restoring Socket.IO dependencies
2. Reverting server files to Socket.IO versions
3. Restoring frontend components to Socket.IO implementation
4. Updating environment variables

## Support

For issues or questions:
1. Check the debug information in components
2. Review browser console for errors
3. Verify server logs for connection issues
4. Test with different browsers/devices

---

**Migration Completed**: ✅ All WebSocket-based video calling has been successfully converted to PeerJS. 