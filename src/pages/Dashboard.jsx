import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaFileAlt, FaComments, FaListAlt, FaEye, FaBell } from 'react-icons/fa';
import React, { useState, useEffect, useRef } from 'react';
import CreateGroupModal from '../components/Groups/CreateGroupModal';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { sendGroupInvite, fetchGroupMembers, fetchPersonalSummaries } from '../api/api';
import { db } from '../api/firebaseConfig';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getFriends } from '../api/api';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

const features = [
  { icon: FaUsers, label: "Groups", path: "/group" },
  { icon: FaFileAlt, label: "Files", path: "/files" },
  { icon: FaComments, label: "Chat", path: "/chat" },
  { icon: FaListAlt, label: "Todo", path: "/todo" },
];

const featureVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: i => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.13 + 0.3,
      type: 'spring',
      stiffness: 80,
      damping: 12
    }
  })
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [groupInvites, setGroupInvites] = useState([]);
  const [inviteMessage, setInviteMessage] = useState('');
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [recentSummaries, setRecentSummaries] = useState([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [invitesOpen, setInvitesOpen] = useState(false);
  const bellRef = useRef();
  const popoverRef = useRef();

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
    if (currentUser) {
      fetchInvites(currentUser.uid);
      fetchRecentSummaries(currentUser.uid);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!invitesOpen) return;
    function handleClick(e) {
      if (
        bellRef.current && bellRef.current.contains(e.target)
      ) return;
      if (
        popoverRef.current && popoverRef.current.contains(e.target)
      ) return;
      setInvitesOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [invitesOpen]);

  // Fetch recent summaries function
  const fetchRecentSummaries = async (userId) => {
    // Use the same user ID logic as YourSummaries page
    const actualUserId = userId || '64S2rM9XFRZtNesIWdxvUxwyBO43';
    setLoadingSummaries(true);
    try {
      const summaries = await fetchPersonalSummaries(actualUserId);
      // Get only the 3 most recent summaries
      setRecentSummaries(summaries.slice(0, 3));
    } catch (error) {
      console.error('Error fetching summaries:', error);
      setRecentSummaries([]);
    }
    setLoadingSummaries(false);
  };

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
    <>
      {/* Animated Futuristic Background Blob */}
      <svg style={{position:'fixed',top:'-120px',right:'-120px',zIndex:0,filter:'blur(40px)',opacity:0.5}} width="600" height="600" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.ellipse
          animate={{
            rx: [260, 300, 260],
            ry: [220, 260, 220],
            rotate: [0, 30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          cx="300" cy="300" rx="260" ry="220"
          fill="url(#paint0_radial)"
        />
        <defs>
          <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientTransform="translate(300 300) rotate(90) scale(300 260)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a5b4fc"/>
            <stop offset="0.5" stopColor="#818cf8"/>
            <stop offset="1" stopColor="#06b6d4"/>
          </radialGradient>
        </defs>
      </svg>
      <Navbar />
      <AnimatePresence>
        <motion.div
          className="dashboard-container"
          initial={{ opacity: 0, y: 60, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.98 }}
          transition={{ duration: 0.8, ease: [0.4, 0.01, 0.165, 0.99] }}
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '1200px',
            minWidth: '340px',
            width: '90vw',
            margin: '48px auto 0 auto',
            boxShadow: '0 2px 8px 0 #0001',
            border: '1px solid #e3eafc',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(8px) saturate(1.1)',
            borderRadius: 40,
            padding: '48px 36px 48px 36px',
            boxSizing: 'border-box',
          }}
        >
          {/* Notification Bell Icon */}
          {currentUser && (
            <div style={{ position: 'absolute', top: 28, right: 36, zIndex: 10 }}>
              <motion.button
                ref={bellRef}
                onClick={() => setInvitesOpen(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', outline: 'none' }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                aria-label="Show group invites"
              >
                <FaBell size={28} color="#1976d2" />
                {groupInvites.length > 0 && (
                  <span style={{ position: 'absolute', top: -6, right: -6, background: '#06b6d4', color: '#fff', borderRadius: '50%', padding: '2px 7px', fontSize: 13, fontWeight: 700 }}>{groupInvites.length}</span>
                )}
              </motion.button>
              <AnimatePresence>
                {invitesOpen && (
                  <motion.div
                    ref={popoverRef}
                    initial={{ opacity: 0, y: -16, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.95 }}
                    transition={{ duration: 0.25, type: 'spring' }}
                    style={{
                      position: 'absolute',
                      top: 38,
                      right: 0,
                      minWidth: 270,
                      background: 'rgba(255,255,255,0.98)',
                      border: '1px solid #e3eafc',
                      borderRadius: 18,
                      boxShadow: '0 2px 8px #0001',
                      padding: 18,
                      zIndex: 100,
                      color: '#222',
                    }}
                  >
                    <h4 style={{ color: '#1976d2', fontWeight: 800, margin: '0 0 10px 0', fontSize: 17 }}>Group Invites</h4>
                    {inviteMessage && <div style={{ color: 'lime', marginBottom: 8, fontWeight: 600, textShadow: '0 1px 8px #06b6d4' }}>{inviteMessage}</div>}
                    {loadingInvites ? (
                      <div>Loading invites...</div>
                    ) : groupInvites.length === 0 ? (
                      <div>No group invites.</div>
                    ) : (
                      <ul style={{ paddingLeft: 0, margin: 0 }}>
                        {groupInvites.map(inv => (
                          <li key={inv.id} style={{ listStyle: 'none', marginBottom: 8 }}>
                            Group ID: {inv.groupId}
                            <motion.button
                              whileHover={{ scale: 1.08, boxShadow: '0 0 8px #e3eafc' }}
                              whileTap={{ scale: 0.96 }}
                              style={{ marginLeft: 12, padding: '4px 12px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, letterSpacing: '0.01em' }}
                              onClick={() => handleInviteResponse(inv.id, inv.groupId, true)}
                            >
                              Accept
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.08, boxShadow: '0 0 8px #e3eafc' }}
                              whileTap={{ scale: 0.96 }}
                              style={{ marginLeft: 8, padding: '4px 12px', background: '#e3eafc', color: '#333', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, letterSpacing: '0.01em' }}
                              onClick={() => handleInviteResponse(inv.id, inv.groupId, false)}
                            >
                              Reject
                            </motion.button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <motion.h1 className="dashboard-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, type: 'spring' }} style={{}}>
            Welcome to StudySync!
          </motion.h1>
          <motion.h2 className="dashboard-subtitle" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7, type: 'spring' }} style={{}}>
            Your all-in-one platform for collaborative group study.
          </motion.h2>
          <motion.button
            className="dashboard-create-group-btn"
            style={{ margin: '18px 0', padding: '12px 28px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '1.08rem', cursor: 'pointer', letterSpacing: '0.02em' }}
            whileHover={{ scale: 1.07, boxShadow: '0 0 8px #e3eafc' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowCreateGroup(true)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
          >
            + Create Group
          </motion.button>
          <motion.div className="dashboard-features" style={{ width: '100%' }} initial="hidden" animate="visible">
            {features.map((feature, idx) => (
              <motion.div
                className="dashboard-feature"
                key={idx}
                custom={idx}
                variants={featureVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.08, boxShadow: '0 0 8px #e3eafc' }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 120, damping: 10 }}
                onClick={() => navigate(feature.path)}
                style={{ cursor: 'pointer', background: '#f7f8fa', border: '1px solid #e3eafc', color: '#1976d2', fontWeight: 700 }}
              >
                <div className="dashboard-feature-icon" style={{ filter: 'drop-shadow(0 2px 8px #818cf8)' }}>
                  <feature.icon />
                </div>
                <div className="dashboard-feature-label">{feature.label}</div>
              </motion.div>
            ))}
          </motion.div>
          {/* Recent Summaries Section */}
          {currentUser && (
            <motion.div style={{ margin: '24px auto', padding: 20, background: '#f7f8fa', borderRadius: 18, boxShadow: '0 2px 8px #0001', width: '100%', maxWidth: 900 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ color: '#1976d2', fontWeight: 700, margin: 0 }}>Recent Summaries</h3>
                <motion.button
                  style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.01em' }}
                  whileHover={{ scale: 1.07, boxShadow: '0 0 8px #e3eafc' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/your-summaries')}
                >
                  <FaEye style={{ marginRight: 8 }} />
                  View All
                </motion.button>
              </div>
              {loadingSummaries ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>Loading summaries...</div>
              ) : recentSummaries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>
                  No summaries yet. 
                  <motion.button
                    style={{ marginLeft: 8, padding: '4px 12px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.01em' }}
                    whileHover={{ scale: 1.07, boxShadow: '0 0 8px #e3eafc' }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate('/your-summaries')}
                  >
                    Add Summary
                  </motion.button>
                </div>
              ) : (
                <ul style={{ paddingLeft: 0 }}>
                  {recentSummaries.map((summary, idx) => (
                    <motion.li key={summary.id || idx} style={{ listStyle: 'none', marginBottom: 12, background: 'rgba(255,255,255,0.13)', borderRadius: 8, padding: 12, color: '#222', fontWeight: 500 }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + idx * 0.1 }}>
                      {summary.text || summary.summary || 'Summary content'}
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
          <CreateGroupModal open={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default Dashboard; 