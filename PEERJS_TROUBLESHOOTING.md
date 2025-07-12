# PeerJS Troubleshooting Guide

## Common Issues and Solutions

### 🔴 **Issue: WebSocket Connection Failed**

**Error Message:**
```
WebSocket connection to 'ws://localhost:9000/peerjs/peerjs?key=peerjs&id=...' failed
```

**Solution:**
1. **Start the PeerJS Server:**
   ```bash
   # Windows
   start-peerjs.bat
   
   # Unix/Linux/Mac
   chmod +x start-peerjs.sh
   ./start-peerjs.sh
   
   # Or manually
   cd groups/meeting/backend
   node peer-server.js
   ```

2. **Check if server is running:**
   ```bash
   # Windows
   netstat -an | findstr :9000
   
   # Unix/Linux/Mac
   netstat -an | grep :9000
   ```

3. **Verify the server output shows:**
   ```
   🚀 PeerJS server running on port 9000
   📡 PeerJS path: /peerjs
   ```

### 🔴 **Issue: Could Not Connect to Peer**

**Error Message:**
```
❌ PeerJS error: Could not connect to peer [peer-id]
```

**Causes:**
- The peer is offline or not connected to the PeerJS server
- The peer ID is incorrect
- Network connectivity issues

**Solutions:**
1. **Ensure both users are online:**
   - Both users must have the PeerJS server running
   - Both users must be connected to the same PeerJS server

2. **Check peer ID format:**
   - For 1:1 calls: `user-{userId}-{timestamp}`
   - For group calls: `{groupId}-{userName}-{timestamp}`

3. **Verify peer is connected:**
   - Check the browser console for "✅ PeerJS connected with ID: [peer-id]"
   - Ensure the peer shows "Connected to PeerJS Server" status

### 🔴 **Issue: No Video/Audio Stream**

**Symptoms:**
- Local video shows but no remote video
- Audio not working
- "Waiting for peer to join..." message

**Solutions:**
1. **Check browser permissions:**
   - Allow camera and microphone access
   - Check browser console for permission errors

2. **Verify media streams:**
   - Check debug info shows "Local Video Tracks: 1, Local Audio Tracks: 1"
   - Ensure local stream is active

3. **Check peer connection:**
   - Verify both peers are connected to PeerJS server
   - Check for "🎥 Received stream from: [peer-id]" messages

### 🔴 **Issue: PeerJS Server Won't Start**

**Error Messages:**
```
❌ PeerJS Server Error: EADDRINUSE
❌ PeerJS Server Error: Cannot find module 'peer'
```

**Solutions:**
1. **Port already in use:**
   ```bash
   # Kill process using port 9000
   # Windows
   netstat -ano | findstr :9000
   taskkill /PID [PID] /F
   
   # Unix/Linux/Mac
   lsof -ti:9000 | xargs kill -9
   ```

2. **Missing dependencies:**
   ```bash
   cd groups/meeting/backend
   npm install peer@1.1.0-rc.2
   ```

3. **Node.js version:**
   - Ensure Node.js version 16+ is installed
   - Check with: `node --version`

### 🔴 **Issue: Connection Status Shows "Error"**

**Check these in order:**
1. **PeerJS Server Status:**
   - Is the server running on port 9000?
   - Check server logs for errors

2. **Network Issues:**
   - Firewall blocking port 9000?
   - Corporate network restrictions?

3. **Browser Issues:**
   - Try different browser
   - Clear browser cache
   - Disable browser extensions

### 🔴 **Issue: Multiple Peer Connections**

**Symptoms:**
- Duplicate video streams
- Multiple connections to same peer
- Performance issues

**Solutions:**
1. **Clean up connections:**
   - Refresh the page to reset connections
   - Check for multiple PeerJS instances

2. **Check component lifecycle:**
   - Ensure PeerJS is properly destroyed on unmount
   - Avoid creating multiple peer connections

### 🔴 **Issue: Production Deployment**

**For Render/Heroku/Vercel:**
1. **Environment Variables:**
   ```env
   VITE_PEER_SERVER_HOST=your-domain.com
   VITE_PEER_SERVER_PORT=443
   ```

2. **HTTPS Required:**
   - PeerJS requires HTTPS in production
   - Update server configuration for SSL

3. **CORS Configuration:**
   - Ensure CORS is properly configured for your domain
   - Check server logs for CORS errors

## Debug Information

### **Browser Console Logs to Check:**
```
✅ PeerJS connected with ID: [peer-id]
🎥 Received stream from: [peer-id]
📞 Incoming call from: [peer-id]
```

### **Server Logs to Check:**
```
🔗 Peer connected: [peer-id]
🚀 PeerJS server running on port 9000
```

### **Network Tab:**
- Check for WebSocket connections to port 9000
- Look for failed requests
- Verify CORS headers

## Quick Fix Checklist

- [ ] PeerJS server running on port 9000
- [ ] Browser permissions granted
- [ ] Both users connected to same server
- [ ] Correct peer IDs being used
- [ ] No firewall blocking port 9000
- [ ] HTTPS in production
- [ ] CORS properly configured

## Getting Help

If issues persist:
1. Check browser console for detailed error messages
2. Verify server logs for connection issues
3. Test with different browsers/devices
4. Check network connectivity
5. Review the migration guide for configuration details 