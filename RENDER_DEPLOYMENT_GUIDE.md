# Render Deployment Guide for StudySync Meeting Systems

## 📋 **Overview**

You have **two separate meeting systems** that need to be deployed on Render:

1. **Video Call Server** (`backend/video-call-server/`) - For 1:1 video calls
2. **Groups Meeting Server** (`groups/meeting/backend/`) - For group meetings

## 🚀 **Deployment Configuration**

### **Service 1: Video Call Server (1:1 Calls)**

| Setting | Value |
|---------|-------|
| **Service Name** | `studysync-video-call` |
| **Root Directory** | `backend/video-call-server/` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Environment** | `Node` |

**Environment Variables:**
```env
NODE_ENV=production
PORT=10000
```

**Expected URL:** `https://studysync-enqu.onrender.com`

---

### **Service 2: Groups Meeting Server (Group Meetings)**

| Setting | Value |
|---------|-------|
| **Service Name** | `studysync-meeting` |
| **Root Directory** | `groups/meeting/backend/` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Environment** | `Node` |

**Environment Variables:**
```env
NODE_ENV=production
PORT=10000
```

**Expected URL:** `https://studysync-meeting.onrender.com`

## 📁 **File Structure for Deployment**

```
StudySync/
├── backend/
│   └── video-call-server/          # Service 1
│       ├── package.json
│       ├── server.js
│       └── node_modules/
└── groups/
    └── meeting/
        └── backend/                 # Service 2
            ├── package.json
            ├── server.js
            └── node_modules/
```

## 🔧 **Deployment Steps**

### **Step 1: Deploy Video Call Server**

1. **Create new service** on Render
2. **Connect your GitHub repository**
3. **Set Root Directory** to `backend/video-call-server/`
4. **Set Build Command** to `npm install`
5. **Set Start Command** to `npm start`
6. **Add Environment Variables:**
   - `NODE_ENV=production`
   - `PORT=10000`
7. **Deploy**

### **Step 2: Deploy Groups Meeting Server**

1. **Create another service** on Render
2. **Connect your GitHub repository**
3. **Set Root Directory** to `groups/meeting/backend/`
4. **Set Build Command** to `npm install`
5. **Set Start Command** to `npm start`
6. **Add Environment Variables:**
   - `NODE_ENV=production`
   - `PORT=10000`
7. **Deploy**

## 📊 **Expected Logs After Deployment**

### **Video Call Server:**
```
🚀 PeerJS video call server running on port 10000
📡 PeerJS path: /peerjs
🌍 Environment: production
CORS enabled for: localhost:5173, studysync-enqu.onrender.com, studysync-3435a.web.app, studysync-3435a.firebaseapp.com
```

### **Groups Meeting Server:**
```
🚀 PeerJS meeting server running on port 10000
📡 PeerJS path: /peerjs
🌍 Environment: production
CORS enabled for: localhost:5173, studysync-enqu.onrender.com, studysync-frontend.onrender.com, studysync-3435a.web.app, studysync-3435a.firebaseapp.com
```

## 🧪 **Testing After Deployment**

### **Test Video Call Server:**
```bash
# Health check
curl https://studysync-enqu.onrender.com/health

# PeerJS endpoint
curl https://studysync-enqu.onrender.com/peerjs
```

### **Test Groups Meeting Server:**
```bash
# Health check
curl https://studysync-meeting.onrender.com/health

# PeerJS endpoint
curl https://studysync-meeting.onrender.com/peerjs
```

## 🔗 **Frontend Configuration**

Your frontend is already configured to use these URLs:

- **Video Call Server**: `https://studysync-enqu.onrender.com`
- **Meeting Server**: `https://studysync-meeting.onrender.com`

## ⚠️ **Important Notes**

1. **Two Separate Services**: You need to create **two different services** on Render
2. **Different Root Directories**: Each service points to a different backend folder
3. **Same Commands**: Both use `npm install` and `npm start`
4. **Environment Variables**: Both need `NODE_ENV=production` and `PORT=10000`
5. **CORS Configuration**: Both servers now include your Firebase domains

## 🐛 **Troubleshooting**

### **If services don't start:**
1. Check Render logs for errors
2. Verify package.json files exist in both directories
3. Ensure all dependencies are listed in package.json
4. Check that the start command matches the package.json script

### **If WebSocket connections fail:**
1. Verify both services are running
2. Check CORS configuration includes Firebase domains
3. Ensure PeerJS server is attached to HTTP server
4. Test health endpoints to confirm services are accessible

## 📞 **Final Testing**

After both services are deployed:

1. **Open your Firebase app**: https://studysync-3435a.web.app
2. **Test 1:1 video calls** - should connect to `studysync-enqu.onrender.com`
3. **Test group meetings** - should connect to `studysync-meeting.onrender.com`
4. **Check browser console** for successful PeerJS connections

Both meeting systems should now work properly! 🎉 