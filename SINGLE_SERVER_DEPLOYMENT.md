# Single Server Deployment Guide - StudySync Meeting System

## 🎯 **Simplified Setup**

You now have **one unified meeting server** that handles both:
- ✅ **1:1 Video Calls**
- ✅ **Group Meetings**

## 🚀 **Render Deployment Configuration**

### **Single Meeting Server**

| Setting | Value |
|---------|-------|
| **Service Name** | `studysync-meeting` |
| **Root Directory** | `groups/meeting/backend/` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Environment** | `Node` |

### **Environment Variables:**
```env
NODE_ENV=production
PORT=10000
```

### **Expected URL:** `https://studysync-meeting.onrender.com`

## 📁 **File Structure**

```
StudySync/
└── groups/
    └── meeting/
        └── backend/                 # Single meeting server
            ├── package.json
            ├── server.js
            └── node_modules/
```

## 🔧 **Deployment Steps**

### **Step 1: Create Render Service**

1. **Create new service** on Render
2. **Connect your GitHub repository**
3. **Set Root Directory** to `groups/meeting/backend/`
4. **Set Build Command** to `npm install`
5. **Set Start Command** to `npm start`
6. **Add Environment Variables:**
   - `NODE_ENV=production`
   - `PORT=10000`
7. **Deploy**

## 📊 **Expected Logs After Deployment**

```
🚀 PeerJS meeting server running on port 10000
📡 PeerJS path: /peerjs
🌍 Environment: production
CORS enabled for: localhost:5173, studysync-enqu.onrender.com, studysync-frontend.onrender.com, studysync-3435a.web.app, studysync-3435a.firebaseapp.com
```

## 🧪 **Testing After Deployment**

### **Test Meeting Server:**
```bash
# Health check
curl https://studysync-meeting.onrender.com/health

# PeerJS endpoint
curl https://studysync-meeting.onrender.com/peerjs
```

## 🔗 **Frontend Configuration**

Your frontend is now configured to use:
- **All Video Calls**: `https://studysync-meeting.onrender.com`
- **PeerJS Server**: `https://studysync-meeting.onrender.com`

## ✅ **What's Unified**

### **Before (Two Servers):**
- ❌ Video Call Server: `studysync-enqu.onrender.com`
- ❌ Meeting Server: `studysync-meeting.onrender.com`

### **After (Single Server):**
- ✅ **Unified Server**: `studysync-meeting.onrender.com`
- ✅ **All functionality** in one place
- ✅ **Simplified deployment** and maintenance

## 🎉 **Benefits of Single Server**

1. **Simplified Deployment**: Only one service to manage
2. **Reduced Costs**: Only one Render service
3. **Easier Maintenance**: Single codebase for all meeting features
4. **Better Performance**: No cross-server communication needed
5. **Unified Logging**: All meeting logs in one place

## 🐛 **Troubleshooting**

### **If the service doesn't start:**
1. Check Render logs for errors
2. Verify package.json exists in `groups/meeting/backend/`
3. Ensure all dependencies are listed
4. Check that start command matches package.json script

### **If WebSocket connections fail:**
1. Verify service is running
2. Check CORS configuration includes Firebase domains
3. Ensure PeerJS server is attached to HTTP server
4. Test health endpoint to confirm service is accessible

## 📞 **Final Testing**

After deployment:

1. **Open your Firebase app**: https://studysync-3435a.web.app
2. **Test 1:1 video calls** - should connect to `studysync-meeting.onrender.com`
3. **Test group meetings** - should connect to `studysync-meeting.onrender.com`
4. **Check browser console** for successful PeerJS connections

## 🗑️ **Cleanup**

You can now:
- ❌ **Delete** the `backend/video-call-server/` directory (no longer needed)
- ❌ **Remove** the old video call service from Render
- ✅ **Keep only** the `groups/meeting/backend/` server

Your meeting system is now unified and simplified! 🎉 