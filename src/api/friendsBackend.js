import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

const app = express();
const PORT = 5000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());

// In-memory data
let friendRequests = [];
// { id, fromUserId, toUserId, status: 'pending' | 'accepted' | 'rejected' }
let friends = [];
// { userId, friendId }
let groupInvites = [];
// { id, groupId, toUserId, fromUserId, status: 'pending' | 'accepted' | 'rejected' }
let groupMembers = {};
// { [groupId]: [userId, ...] }

// Search users by id or name using Firebase Auth
app.get('/user/search', async (req, res) => {
    const query = req.query.query?.toLowerCase() || '';
    try {
        // Try to find by UID
        let user = null;
        try {
            user = await admin.auth().getUser(query);
        } catch (e) { }
        let users = [];
        if (user) {
            users.push({ id: user.uid, name: user.displayName || user.email || user.uid });
        } else {
            // List all users and filter by displayName or email
            const listUsersResult = await admin.auth().listUsers(1000);
            users = listUsersResult.users
                .filter(u =>
                    (u.displayName && u.displayName.toLowerCase().includes(query)) ||
                    (u.email && u.email.toLowerCase().includes(query))
                )
                .map(u => ({ id: u.uid, name: u.displayName || u.email || u.uid }));
        }
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// Send friend request
app.post('/friend-request', (req, res) => {
    const { fromUserId, toUserId } = req.body;
    if (fromUserId === toUserId) return res.status(400).json({ error: 'Cannot friend yourself.' });
    if (friendRequests.find(r => r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === 'pending')) {
        return res.status(400).json({ error: 'Request already sent.' });
    }
    const id = String(friendRequests.length + 1);
    friendRequests.push({ id, fromUserId, toUserId, status: 'pending' });
    res.json({ success: true, requestId: id });
});

// Get incoming friend requests
app.get('/friend-requests', (req, res) => {
    const userId = req.query.userId;
    const requests = friendRequests.filter(r => r.toUserId === userId && r.status === 'pending');
    res.json({ requests });
});

// Respond to friend request
app.post('/friend-request/respond', (req, res) => {
    const { requestId, accept } = req.body;
    const reqIndex = friendRequests.findIndex(r => r.id === requestId);
    if (reqIndex === -1) return res.status(404).json({ error: 'Request not found.' });
    friendRequests[reqIndex].status = accept ? 'accepted' : 'rejected';
    if (accept) {
        const { fromUserId, toUserId } = friendRequests[reqIndex];
        friends.push({ userId: fromUserId, friendId: toUserId });
        friends.push({ userId: toUserId, friendId: fromUserId });
    }
    res.json({ success: true });
});

// Get friends list using Firebase Auth for names
app.get('/friends', async (req, res) => {
    const userId = req.query.userId;
    const friendIds = friends.filter(f => f.userId === userId).map(f => f.friendId);
    try {
        const friendObjs = await Promise.all(friendIds.map(async (fid) => {
            try {
                const user = await admin.auth().getUser(fid);
                return { id: user.uid, name: user.displayName || user.email || user.uid };
            } catch {
                return { id: fid, name: fid };
            }
        }));
        res.json({ friends: friendObjs });
    } catch {
        res.status(500).json({ error: 'Failed to fetch friends' });
    }
});

// Send group invite
app.post('/group-invite', (req, res) => {
    const { friendId, groupId } = req.body;
    // For demo, assume fromUserId is not tracked (could add if needed)
    if (!groupInvites.find(inv => inv.groupId === groupId && inv.toUserId === friendId && inv.status === 'pending')) {
        const id = String(groupInvites.length + 1);
        groupInvites.push({ id, groupId, toUserId: friendId, status: 'pending' });
        res.json({ success: true, inviteId: id });
    } else {
        res.status(400).json({ error: 'Invite already sent.' });
    }
});

// Get incoming group invites for a user
app.get('/group-invites', (req, res) => {
    const userId = req.query.userId;
    const invites = groupInvites.filter(inv => inv.toUserId === userId && inv.status === 'pending');
    res.json({ invites });
});

// Respond to group invite (accept/reject)
app.post('/group-invite/respond', (req, res) => {
    const { inviteId, accept } = req.body;
    const inviteIndex = groupInvites.findIndex(inv => inv.id === inviteId);
    if (inviteIndex === -1) return res.status(404).json({ error: 'Invite not found.' });
    groupInvites[inviteIndex].status = accept ? 'accepted' : 'rejected';
    if (accept) {
        const { groupId, toUserId } = groupInvites[inviteIndex];
        if (!groupMembers[groupId]) groupMembers[groupId] = [];
        if (!groupMembers[groupId].includes(toUserId)) groupMembers[groupId].push(toUserId);
    }
    res.json({ success: true });
});

// Fetch group members (for demo, use groupMembers in-memory)
app.get('/group-members', (req, res) => {
    const groupId = req.query.groupId;
    const memberIds = groupMembers[groupId] || [];
    res.json({ members: memberIds });
});

app.listen(PORT, () => {
    console.log(`Friends backend running on http://localhost:${PORT}`);
}); 