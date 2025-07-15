import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const serviceAccount = {
    "type": "service_account",
    "project_id": "studysync-3435a",
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY,
    "client_email": "firebase-adminsdk-fbsvc@studysync-3435a.iam.gserviceaccount.com",
    "client_id": "101362409159616884424",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40studysync-3435a.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
};

const app = express();
const PORT = 5000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());

// Add Firestore reference
const db = admin.firestore();

// Search users by id or name using Firebase Auth and Firestore
app.get('/user/search', async (req, res) => {
    const query = req.query.query || '';
    try {
        let users = [];
        let user = null;
        // Try to find by UID in Auth (case-sensitive)
        try {
            user = await admin.auth().getUser(query);
        } catch (e) { /* not found by UID in Auth */ }
        if (user) {
            users.push({ id: user.uid, name: user.displayName || user.email || user.uid });
        } else {
            // Try to find by email in Auth
            try {
                user = await admin.auth().getUserByEmail(query);
            } catch (e) { /* not found by email in Auth */ }
            if (user) {
                users.push({ id: user.uid, name: user.displayName || user.email || user.uid });
            } else {
                // Try Firestore users collection by UID
                const userDoc = await db.collection('users').doc(query).get();
                if (userDoc.exists) {
                    const data = userDoc.data();
                    users.push({ id: userDoc.id, name: data.displayName || data.email || userDoc.id });
                } else {
                    // List all Auth users and filter by displayName or email
                    const listUsersResult = await admin.auth().listUsers(1000);
                    users = listUsersResult.users
                        .filter(u =>
                            (u.displayName && u.displayName.toLowerCase().includes(query.toLowerCase())) ||
                            (u.email && u.email.toLowerCase().includes(query.toLowerCase()))
                        )
                        .map(u => ({ id: u.uid, name: u.displayName || u.email || u.uid }));
                }
            }
        }
        res.json({ users });
    } catch (err) {
        console.error('User search error:', err);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// Send friend request
app.post('/friend-request', async (req, res) => {
    const { fromUserId, toUserId } = req.body;
    if (fromUserId === toUserId) return res.status(400).json({ error: 'Cannot friend yourself.' });
    // Check for existing pending request
    const existing = await db.collection('friendRequests')
        .where('fromUserId', '==', fromUserId)
        .where('toUserId', '==', toUserId)
        .where('status', '==', 'pending')
        .get();
    if (!existing.empty) return res.status(400).json({ error: 'Request already sent.' });
    const docRef = await db.collection('friendRequests').add({
        fromUserId, toUserId, status: 'pending', createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ success: true, requestId: docRef.id });
});

// Get incoming friend requests
app.get('/friend-requests', async (req, res) => {
    const userId = req.query.userId;
    const snapshot = await db.collection('friendRequests')
        .where('toUserId', '==', userId)
        .where('status', '==', 'pending')
        .get();
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ requests });
});

// Respond to friend request
app.post('/friend-request/respond', async (req, res) => {
    const { requestId, accept } = req.body;
    const docRef = db.collection('friendRequests').doc(requestId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).json({ error: 'Request not found.' });
    await docRef.update({ status: accept ? 'accepted' : 'rejected' });
    if (accept) {
        const { fromUserId, toUserId } = docSnap.data();
        // Add to friends collection (bidirectional)
        await db.collection('friends').add({ userId: fromUserId, friendId: toUserId });
        await db.collection('friends').add({ userId: toUserId, friendId: fromUserId });
    }
    res.json({ success: true });
});

// Get friends list using Firebase Auth for names
app.get('/friends', async (req, res) => {
    const userId = req.query.userId;
    const snapshot = await db.collection('friends').where('userId', '==', userId).get();
    const friendIds = snapshot.docs.map(doc => doc.data().friendId);
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
app.post('/group-invite', async (req, res) => {
    const { friendId, groupId } = req.body;
    // Check for existing pending invite
    const existing = await db.collection('groupInvites')
        .where('groupId', '==', groupId)
        .where('toUserId', '==', friendId)
        .where('status', '==', 'pending')
        .get();
    if (!existing.empty) return res.status(400).json({ error: 'Invite already sent.' });
    const docRef = await db.collection('groupInvites').add({
        groupId, toUserId: friendId, status: 'pending', createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ success: true, inviteId: docRef.id });
});

// Get incoming group invites for a user
app.get('/group-invites', async (req, res) => {
    const userId = req.query.userId;
    const snapshot = await db.collection('groupInvites')
        .where('toUserId', '==', userId)
        .where('status', '==', 'pending')
        .get();
    const invites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ invites });
});

// Respond to group invite (accept/reject)
app.post('/group-invite/respond', async (req, res) => {
    const { inviteId, accept } = req.body;
    const docRef = db.collection('groupInvites').doc(inviteId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).json({ error: 'Invite not found.' });
    await docRef.update({ status: accept ? 'accepted' : 'rejected' });
    if (accept) {
        const { groupId, toUserId } = docSnap.data();
        // Add user to group members (update Firestore group doc)
        const groupRef = db.collection('groups').doc(groupId);
        await groupRef.update({
            members: admin.firestore.FieldValue.arrayUnion(toUserId)
        });
    }
    res.json({ success: true });
});

// Fetch group members (from Firestore group doc)
app.get('/group-members', async (req, res) => {
    const groupId = req.query.groupId;
    const groupRef = db.collection('groups').doc(groupId);
    const groupSnap = await groupRef.get();
    const memberIds = groupSnap.exists ? (groupSnap.data().members || []) : [];
    res.json({ members: memberIds });
});

app.listen(PORT, () => {
    console.log(`Friends backend running on http://localhost:${PORT}`);
}); 