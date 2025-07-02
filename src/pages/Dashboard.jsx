import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaFileAlt, FaComments, FaListAlt } from 'react-icons/fa';
import React, { useState, useEffect } from 'react';
import CreateGroupModal from '../components/Groups/CreateGroupModal';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { sendGroupInvite, fetchGroupMembers } from '../api/api';
import { db } from '../api/firebaseConfig';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getFriends } from '../api/api';

const features = [
  { icon: FaUsers, label: "Groups", path: "/group" },
  { icon: FaFileAlt, label: "Files", path: "/files" },
  { icon: FaComments, label: "Chat", path: "/chat" },
  { icon: FaListAlt, label: "Todo", path: "/todo" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [groupInvites, setGroupInvites] = useState([]);
  const [inviteMessage, setInviteMessage] = useState('');
  const [loadingInvites, setLoadingInvites] = useState(false);

  // Fetch invites function
  const fetchInvites = async (userId) => {
    if (!userId) return;
    setLoadingInvites(true);
    try {
      const res = await fetch(`http://localhost:5000/group-invites?userId=${userId}`);
      const data = await res.json();
      setGroupInvites(data.invites || []);
    } catch {
      setGroupInvites([]);
    }
    setLoadingInvites(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) fetchInvites(currentUser.uid);
  }, [currentUser]);

  const handleInviteResponse = async (inviteId, groupId, accept) => {
    setInviteMessage('');
    try {
      if (accept) {
        // Add user to group in Firestore
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
          members: arrayUnion(currentUser.uid)
        });
        // Add group to user's groups array
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          groups: arrayUnion({ id: groupId })
        });
      }
      // Mark invite as handled in backend
      await fetch('http://localhost:5000/group-invite/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, accept })
      });
      // Refetch invites to update the list
      fetchInvites(currentUser.uid);
      setInviteMessage(accept ? 'Joined group!' : 'Invite rejected.');
    } catch {
      setInviteMessage('Failed to respond to invite.');
    }
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Welcome to StudySync!</h1>
      <h2 className="dashboard-subtitle">Your all-in-one platform for collaborative group study.</h2>
      {/* Incoming Group Invites Section */}
      {currentUser && (
        <div style={{ margin: '24px 0', padding: 16, background: '#f7f8fa', borderRadius: 8 }}>
          <h3 style={{ color: '#1976d2', fontWeight: 700, marginBottom: 8 }}>Incoming Group Invites</h3>
          {inviteMessage && <div style={{ color: 'green', marginBottom: 8 }}>{inviteMessage}</div>}
          {loadingInvites ? (
            <div>Loading invites...</div>
          ) : groupInvites.length === 0 ? (
            <div>No group invites.</div>
          ) : (
            <ul style={{ paddingLeft: 0 }}>
              {groupInvites.map(inv => (
                <li key={inv.id} style={{ listStyle: 'none', marginBottom: 8 }}>
                  Group ID: {inv.groupId}
                  <button
                    style={{ marginLeft: 12, padding: '4px 12px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => handleInviteResponse(inv.id, inv.groupId, true)}
                  >
                    Accept
                  </button>
                  <button
                    style={{ marginLeft: 8, padding: '4px 12px', background: '#ccc', color: '#333', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => handleInviteResponse(inv.id, inv.groupId, false)}
                  >
                    Reject
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <button
        className="dashboard-create-group-btn"
        style={{ margin: '18px 0', padding: '12px 28px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1.08rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)' }}
        onClick={() => setShowCreateGroup(true)}
      >
        + Create Group
      </button>
      <div className="dashboard-features">
        {features.map((feature, idx) => (
          <div
            className="dashboard-feature"
            key={idx}
            onClick={() => navigate(feature.path)}
            style={{ cursor: 'pointer' }}
          >
            <div className="dashboard-feature-icon">
              <feature.icon />
            </div>
            <div className="dashboard-feature-label">{feature.label}</div>
          </div>
        ))}
      </div>
      <CreateGroupModal open={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
    </div>
  );
};

export default Dashboard; 