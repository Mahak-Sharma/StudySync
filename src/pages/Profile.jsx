import './Profile.css';
import { useAuth } from '../contexts/AuthContext';
import React, { useEffect, useState } from 'react';
import { db } from '../api/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { FaUser, FaSignOutAlt, FaRegCopy } from 'react-icons/fa';
import { motion } from 'framer-motion';
import BackButton from '../components/BackButton';

const Profile = () => {
  const { user } = useAuth();
  const [createdGroups, setCreatedGroups] = useState([]);

  useEffect(() => {
    const fetchCreatedGroups = async () => {
      if (!user) return;
      const q = query(collection(db, 'groups'), where('createdBy', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const groups = [];
      querySnapshot.forEach(docSnap => {
        groups.push({ id: docSnap.id, ...docSnap.data() });
      });
      setCreatedGroups(groups);
    };
    fetchCreatedGroups();
  }, [user]);

  if (!user) {
    return <div className="profile-container"><div className="profile-card">Not logged in.</div></div>;
  }

  // Floating logout button shake animation
  const shake = {
    rotate: [0, 8, -8, 8, -8, 0],
    scale: [1, 1.08, 0.96, 1.1, 0.95, 1],
    transition: { duration: 0.6, type: 'tween' }
  };

  return (
    <>
      <BackButton />
      <div className="profile-bg" />
      {/* Floating Logout Button */}
      <motion.button
        className="floating-logout-btn"
        initial={{ opacity: 0, y: -30, scale: 0.7 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={shake}
        title="Logout"
        onClick={async () => {
          await user && (await import('../contexts/AuthContext')).logout();
          window.location.href = '/';
        }}
      >
        <FaSignOutAlt size={28} />
      </motion.button>

      {/* Profile Card with entry animation */}
      <motion.div
        className="profile-container"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: 'spring', bounce: 0.22 }}
      >
        <div className="profile-card">
          <div className="profile-avatar futuristic-avatar">
            <FaUser size={48} />
          </div>
          <h2 className="profile-name">{user.displayName || 'No Name'}</h2>
          <div className="profile-email">{user.email}</div>
          <div className="profile-uid">User ID: {user.uid}
            <button
              style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#1976d2', fontSize: 18, verticalAlign: 'middle' }}
              title="Copy User ID"
              onClick={() => navigator.clipboard.writeText(user.uid)}
            >
              <FaRegCopy />
            </button>
          </div>
          {/* Floating Groups Card */}
          {createdGroups.length > 0 && (
            <motion.div
              className="profile-groups-floating"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, type: 'spring', bounce: 0.22, delay: 0.2 }}
            >
              <h3 className="profile-groups-title">Groups You Created</h3>
              <ul className="profile-groups-list">
                {createdGroups.map(group => (
                  <li className="profile-groups-item" key={group.id}>
                    <span style={{ fontWeight: 600 }}>{group.name}</span>
                    <span style={{ color: '#1976d2', fontSize: '0.95em', marginLeft: 8 }}>
                      ID: {group.id}
                      <button
                        style={{ marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#1976d2', fontSize: 16, verticalAlign: 'middle' }}
                        title="Copy Group ID"
                        onClick={() => navigator.clipboard.writeText(group.id)}
                      >
                        <FaRegCopy />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              <div style={{ color: '#888', fontSize: '0.98em', marginTop: 6 }}>
                Share the Group ID with friends so they can join!
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default Profile; 