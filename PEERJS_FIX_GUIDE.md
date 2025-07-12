# PeerJS Connection Fix Guide

## 🔍 **Problem Identified**

Your PeerJS client is trying to connect to `wss://studysync-enqu.onrender.com/peerjs/peerjs` but the WebSocket connection is failing because:

1. **PeerJS Server Configuration Issue**: The server was trying to run on port 9000 instead of using the main HTTP server
2. **CORS Configuration**: Missing your Firebase domain in the allowed origins
3. **WebSocket Path**: The PeerJS server wasn't properly attached to the main server

## ✅ **Fixes Applied**

### 1. **Backend Server Fix** (`backend/video-call-server/server.js`)
- ✅ Attached PeerJS server to the main HTTP server instead of running separately
- ✅ Added Firebase domains to CORS configuration
- ✅ Fixed WebSocket path configuration

### 2. **Frontend Configuration Fix**
- ✅ Updated `VideoCallContext.jsx` to use secure connections
- ✅ Updated `MeetingRoom.jsx` to use secure connections
- ✅ Set `secure: true` for production

## 🚀 **Next Steps**

### Step 1: Redeploy Your Backend Server

You need to redeploy your backend server on Render with the updated configuration:

1. **Commit and push the changes** to your repository
2. **Redeploy on Render** - the service should automatically redeploy
3. **Check the logs** to ensure the server starts correctly

### Step 2: Verify Server Health

After redeployment, test these endpoints:

```bash
# Health check
curl https://studysync-enqu.onrender.com/health

# PeerJS endpoint (should return PeerJS server info)
curl https://studysync-enqu.onrender.com/peerjs
```

### Step 3: Test the Connection

1. **Open your Firebase app**: https://studysync-3435a.web.app
2. **Open browser console** (F12)
3. **Try to start a meeting** or video call
4. **Look for these success messages**:
   ```
   ✅ Global PeerJS connected with ID: user-xxx-xxx
   🔗 Peer connected: user-xxx-xxx
   ```

## 🔧 **Environment Variables**

Make sure your Render service has these environment variables:

```env
NODE_ENV=production
PORT=10000
```

## 📊 **Expected Server Logs**

After redeployment, you should see:

```
🚀 PeerJS video call server running on port 10000
📡 PeerJS path: /peerjs
🌍 Environment: production
CORS enabled for: localhost:5173, studysync-enqu.onrender.com, studysync-3435a.web.app, studysync-3435a.firebaseapp.com
```

## 🐛 **Troubleshooting**

### If the issue persists:

1. **Check Render logs** for any server startup errors
2. **Verify the PeerJS endpoint** is accessible
3. **Check browser console** for specific error messages
4. **Ensure both users** are using the same server URL

### Common Issues:

1. **Server not redeployed**: Make sure to push changes to trigger redeployment
2. **Wrong port**: Render assigns dynamic ports, the server should use `process.env.PORT`
3. **CORS errors**: Check that Firebase domains are in the CORS configuration
4. **WebSocket blocked**: Some corporate networks block WebSocket connections

## 📞 **Testing Steps**

1. **Deploy the backend changes**
2. **Wait for redeployment to complete** (usually 2-3 minutes)
3. **Test with two different browsers** or devices
4. **Check browser console** for connection success messages
5. **Try both 1:1 calls and group meetings**

The fix should resolve the WebSocket connection issue and allow your video calls to work properly! 🎉 