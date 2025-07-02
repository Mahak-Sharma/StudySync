import './GroupDashboard.css';
import React, { useEffect, useState } from 'react';
import { db } from '../../api/firebaseConfig';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const GroupDashboard = () => {
  const { user } = useAuth();
  const [userGroups, setUserGroups] = useState([]);
  const [joinGroupId, setJoinGroupId] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user's groups
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) return;
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const groupIds = userSnap.exists() && userSnap.data().groups ? userSnap.data().groups : [];
      const groupList = [];
      for (const groupObj of groupIds) {
        // groupObj can be a string (old) or object (new)
        let groupId, groupName;
        if (typeof groupObj === 'string') {
          groupId = groupObj;
          groupName = undefined;
        } else {
          groupId = groupObj.id;
          groupName = groupObj.name;
        }
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          groupList.push({ id: groupId, name: groupName || groupSnap.data().name, ...groupSnap.data() });
        }
      }
      setUserGroups(groupList);
      setLoading(false);
    };
    fetchGroups();
  }, [user]);

  // Join group by ID
  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setJoinError('');
    setJoinSuccess('');
    if (!joinGroupId.trim()) {
      setJoinError('Please enter a group ID.');
      return;
    }
    try {
      const groupRef = doc(db, 'groups', joinGroupId.trim());
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) {
        setJoinError('Group not found.');
        return;
      }
      // Add user to group members
      await updateDoc(groupRef, { members: arrayUnion(user.uid) });
      // Add group to user's groups as { id, name }
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { groups: arrayUnion({ id: joinGroupId.trim(), name: groupSnap.data().name }) });
      setJoinSuccess('Successfully joined group!');
      setJoinGroupId('');
      // Refresh group list
      const groupData = groupSnap.data();
      setUserGroups((prev) => [...prev, { id: joinGroupId.trim(), ...groupData }]);
    } catch (err) {
      setJoinError('Error joining group: ' + err.message);
    }
  };

  return (
    <div className="group-dashboard-container">
      <h3 className="group-dashboard-title">Your Groups</h3>
      {loading ? (
        <div>Loading...</div>
      ) : userGroups.length === 0 ? (
        <div style={{ color: '#888', marginBottom: 16 }}>You have not joined or created any groups yet.</div>
      ) : (
        <ul className="group-dashboard-list">
          {userGroups.map((group) => (
            <li
              className="group-dashboard-member group-dashboard-member-clickable"
              key={group.id}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/group/${group.id}`)}
            >
              <span style={{ color: '#1976d2', fontWeight: 600 }}>
                {group.name}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="group-dashboard-header" style={{ marginTop: 24 }}>Join a Group</div>
      <form onSubmit={handleJoinGroup} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input
          type="text"
          className="create-group-modal-input"
          placeholder="Enter Group ID"
          value={joinGroupId}
          onChange={e => setJoinGroupId(e.target.value)}
        />
        <button className="create-group-modal-create" type="submit">Join</button>
      </form>
      {joinError && <div style={{ color: 'red', marginBottom: 8 }}>{joinError}</div>}
      {joinSuccess && <div style={{ color: 'green', marginBottom: 8 }}>{joinSuccess}</div>}
    </div>
  );
};

export default GroupDashboard; 