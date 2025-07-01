import './Profile.css';
import { useAuth } from '../contexts/AuthContext';
import React, { useEffect, useState } from 'react';
import { db } from '../api/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

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

  return (
    <div className="profile-container">
      <div className="profile-card">
        <img
          className="profile-avatar"
          alt={user.displayName || user.email || 'User'}
        />
        <h2 className="profile-name">{user.displayName || 'No Name'}</h2>
        <div className="profile-email">{user.email}</div>
        <div className="profile-uid">User ID: {user.uid}</div>
        {createdGroups.length > 0 && (
          <div className="profile-groups-section" style={{ marginTop: 24 }}>
            <h3 className="profile-groups-title">Groups You Created</h3>
            <ul className="profile-groups-list">
              {createdGroups.map(group => (
                <li className="profile-groups-item" key={group.id}>
                  <span style={{ fontWeight: 600 }}>{group.name}</span>
                  <span style={{ color: '#1976d2', fontSize: '0.95em', marginLeft: 8 }}>ID: {group.id}</span>
                </li>
              ))}
            </ul>
            <div style={{ color: '#888', fontSize: '0.98em', marginTop: 6 }}>
              Share the Group ID with friends so they can join!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 