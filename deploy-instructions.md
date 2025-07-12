# Deployment Instructions for StudySync

## 🚀 Updated Server Deployment

Your video call server at `https://studysync-enqu.onrender.com` has been updated to handle both:
- ✅ **1:1 Video Calls** (existing functionality)
- ✅ **Group Meeting Rooms** (new functionality)

## 📋 Steps to Deploy

### 1. Commit and Push Changes
```bash
git add .
git commit -m "Add meeting room functionality to video call server"
git push origin main
```

### 2. Verify Render Deployment
- Go to your Render dashboard
- Check that the deployment is successful
- The server should now show: `🤝 Meeting room functionality enabled`

### 3. Test the Server
Visit these URLs to verify the server is working:

- **Health Check**: `https://studysync-enqu.onrender.com/health`
- **Users**: `https://studysync-enqu.onrender.com/users`
- **Meeting Rooms**: `https://studysync-enqu.onrender.com/meeting-rooms`

## 🧪 Testing Meeting Rooms

### Local Testing
1. Start your development environment:
   ```bash
   npm run dev:all
   ```

2. Open two different browsers or devices
3. Navigate to a group and start a meeting
4. Check browser console for connection messages

### Production Testing
1. Visit your deployed app: `https://studysync-enqu.onrender.com`
2. Open two different browsers or devices
3. Create a group and start a meeting
4. Check browser console for connection status

## 🔍 Debugging

### Check Connection Status
Look for these console messages:
- ✅ `Connected to meeting server`
- ✅ `User [name] joining room [groupId]`
- ✅ `WebRTC connection established with [peerId]`

### Common Issues
1. **CORS Errors**: Server is configured to allow your domain
2. **Connection Failed**: Check if the server is running
3. **No Video**: Ensure camera permissions are granted

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify the server health endpoint
3. Test with different browsers/devices
4. Check camera and microphone permissions

## 🎯 Expected Behavior

After deployment, you should see:
- ✅ Connection status shows "Connected"
- ✅ "Join Meeting" button becomes clickable
- ✅ Participants list updates when users join
- ✅ Video streams appear for all participants
- ✅ Audio and video controls work properly 