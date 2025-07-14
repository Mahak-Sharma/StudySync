import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatBox from '../components/Chat/ChatBox';
import FileList from '../components/Files/FileList';
import TodoBoard from '../components/Todo/TodoBoard';
import { fetchGroupSummaries, getFriends, fetchGroupMembers, sendGroupInvite } from '../api/api';
import { db } from '../api/firebaseConfig';
import { doc, getDoc, updateDoc, arrayRemove, deleteDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { FaHome, FaTachometerAlt, FaComments, FaFileAlt, FaListAlt, FaBars, FaVideo } from 'react-icons/fa';

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const [summaries, setSummaries] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [loadingGroupName, setLoadingGroupName] = useState(true);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [friends, setFriends] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);
  const [creatorId, setCreatorId] = useState(null);
  const [removingMember, setRemovingMember] = useState('');
  const [deletingGroup, setDeletingGroup] = useState(false);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  const [fade, setFade] = useState(false);
  const [groupCallOpen, setGroupCallOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchGroupSummaries(groupId).then(setSummaries);
  }, [groupId]);

  useEffect(() => {
    const fetchGroupInfo = async () => {
      setLoadingGroupName(true);
      try {
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          setGroupName(groupSnap.data().name || groupId);
          setCreatorId(groupSnap.data().creator || null);
        } else {
          setGroupName(groupId);
          setCreatorId(null);
        }
      } catch (err) {
        setGroupName(groupId);
        setCreatorId(null);
      }
      setLoadingGroupName(false);
    };
    fetchGroupInfo();
  }, [groupId]);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          const memberIds = groupSnap.data().members || [];
          const userDocs = await Promise.all(
            memberIds.map(async (uid) => {
              const userRef = doc(db, 'users', uid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const data = userSnap.data();
                return { uid, displayName: data.displayName, email: data.email };
              } else {
                return { uid, displayName: null, email: null };
              }
            })
          );
          setMembers(userDocs);
        } else {
          setMembers([]);
        }
      } catch (err) {
        setMembers([]);
      }
      setLoadingMembers(false);
    };
    fetchMembers();
  }, [groupId]);

  useEffect(() => {
    const fetchFriendsList = async () => {
      if (!currentUser) return;
      try {
        const frs = await getFriends(currentUser.uid);
        console.log('Fetched friends:', frs); // Debug output
        setFriends(frs);
      } catch (e) {
        console.error('Error fetching friends:', e); // Debug output
        setFriends([]);
      }
    };
    fetchFriendsList();
  }, [currentUser]);

  const memberIds = members.map(m => m.uid);
  const friendsNotInGroup = friends.filter(f => !memberIds.includes(f.id));

  const handleInvite = async (friendId) => {
    setInviting(true);
    setInviteMessage('');
    try {
      await sendGroupInvite(friendId, groupId);
      setInviteMessage('Invite sent!');
    } catch (e) {
      setInviteMessage('Failed to send invite');
    }
    setInviting(false);
  };

  // Remove member from group (creator only)
  const handleRemoveMember = async (uid) => {
    setRemovingMember(uid);
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, { members: arrayRemove(uid) });
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userGroups = userSnap.data().groups || [];
        const updatedGroups = userGroups.filter(g => (typeof g === 'string' ? g !== groupId : g.id !== groupId));
        await updateDoc(userRef, { groups: updatedGroups });
      }
      setMembers(members => members.filter(m => m.uid !== uid));
    } catch (e) {
      alert('Failed to remove member');
    }
    setRemovingMember('');
  };

  // Delete group (creator only)
  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? This cannot be undone.')) return;
    setDeletingGroup(true);
    try {
      for (const m of members) {
        const userRef = doc(db, 'users', m.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userGroups = userSnap.data().groups || [];
          const updatedGroups = userGroups.filter(g => (typeof g === 'string' ? g !== groupId : g.id !== groupId));
          await updateDoc(userRef, { groups: updatedGroups });
        }
      }
      await deleteDoc(doc(db, 'groups', groupId));
      window.location.href = '/group';
    } catch (e) {
      alert('Failed to delete group');
    }
    setDeletingGroup(false);
  };

  const handleSectionChange = (section) => {
    setFade(true);
    setTimeout(() => {
      setSelectedSection(section);
      setFade(false);
    }, 350);
  };

  return (
    <div className="group-detail-flex-layout">
      <div className={`group-side-panel${collapsed ? ' side-panel-collapsed' : ''}`}>
        <button className="side-panel-toggle-btn" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand' : 'Collapse'}>
          <FaBars />
        </button>
        <button className="side-panel-btn" onClick={() => navigate('/')}>
          <span className="side-panel-icon"><FaHome /></span>
          {!collapsed && <span className="side-panel-label">Home</span>}
        </button>
        <button className="side-panel-btn" onClick={() => navigate('/dashboard')}>
          <span className="side-panel-icon"><FaTachometerAlt /></span>
          {!collapsed && <span className="side-panel-label">Dashboard</span>}
        </button>
        <button className={`side-panel-btn${selectedSection === 'chat' ? ' active' : ''}`} onClick={() => handleSectionChange('chat')}>
          <span className="side-panel-icon"><FaComments /></span>
          {!collapsed && <span className="side-panel-label">Group Chat</span>}
        </button>
        <button className={`side-panel-btn${selectedSection === 'meeting' ? ' active' : ''}`} onClick={() => handleSectionChange('meeting')}>
          <span className="side-panel-icon"><FaVideo /></span>
          {!collapsed && <span className="side-panel-label">Meeting</span>}
        </button>
        <button className={`side-panel-btn${selectedSection === 'files' ? ' active' : ''}`} onClick={() => handleSectionChange('files')}>
          <span className="side-panel-icon"><FaFileAlt /></span>
          {!collapsed && <span className="side-panel-label">Files & Summarize</span>}
        </button>
        <button className={`side-panel-btn${selectedSection === 'todo' ? ' active' : ''}`} onClick={() => handleSectionChange('todo')}>
          <span className="side-panel-icon"><FaListAlt /></span>
          {!collapsed && <span className="side-panel-label">Todo List</span>}
        </button>
      </div>
      <div className={`group-main-content${fade ? ' fade-out' : ''}`}>
        {selectedSection === '' && (
          <>
            <h2 style={{ color: '#1976d2', fontWeight: 800, marginBottom: 24 }}>
              {loadingGroupName ? 'Loading group...' : `Group: ${groupName}`}
            </h2>
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ color: '#1976d2', fontWeight: 700 }}>Group Members</h3>
              {currentUser && creatorId === currentUser.uid && (
                <button
                  style={{ marginBottom: 12, marginLeft: 12, padding: '6px 16px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                  onClick={handleDeleteGroup}
                  disabled={deletingGroup}
                >
                  {deletingGroup ? 'Deleting...' : 'Delete Group'}
                </button>
              )}
              <button
                style={{ marginBottom: 12, padding: '6px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setShowAddMembers(v => !v)}
                disabled={!currentUser}
              >
                {showAddMembers ? 'Close' : 'Add Members'}
              </button>
              {showAddMembers && (
                <div style={{ margin: '16px 0', padding: 16, background: '#f7f8fa', borderRadius: 8 }}>
                  <h4 style={{ marginBottom: 8 }}>Invite Friends to Group</h4>
                  {inviteMessage && <div style={{ color: 'green', marginBottom: 8 }}>{inviteMessage}</div>}
                  {friendsNotInGroup.length === 0 ? (
                    <div>No friends to invite.</div>
                  ) : (
                    <ul style={{ paddingLeft: 0 }}>
                      {friendsNotInGroup.map(f => (
                        <li key={f.id} style={{ listStyle: 'none', marginBottom: 8 }}>
                          {f.name} (ID: {f.id})
                          <button
                            style={{ marginLeft: 12, padding: '4px 12px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => handleInvite(f.id)}
                            disabled={inviting}
                          >
                            Invite
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {loadingMembers ? (
                <div>Loading members...</div>
              ) : members.length === 0 ? (
                <div>No members found.</div>
              ) : (
                <ul style={{ paddingLeft: 0, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {members.map((m) => (
                    <li key={m.uid} style={{ listStyle: 'none', background: '#e3f0fc', padding: 8, borderRadius: 6, minWidth: 120, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>{m.displayName || m.email || m.uid}</span>
                      {currentUser && creatorId === currentUser.uid && m.uid !== creatorId && (
                        <button
                          style={{ marginLeft: 8, padding: '4px 10px', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                          onClick={() => handleRemoveMember(m.uid)}
                          disabled={removingMember === m.uid}
                        >
                          {removingMember === m.uid ? 'Removing...' : 'Remove'}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
        {selectedSection === 'chat' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <button
                className="group-call-btn"
                onClick={() => setGroupCallOpen(true)}
              >
                📹 Start Group Call
              </button>
            </div>
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ color: '#1976d2', fontWeight: 700 }}>Group Chat</h3>
              <ChatBox groupId={groupId} />
            </div>
            <GroupVideoCallComponent
              isOpen={groupCallOpen}
              onClose={() => setGroupCallOpen(false)}
              groupId={groupId}
              groupName={groupName}
            />
          </>
        )}
        {selectedSection === 'files' && (
          <>
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ color: '#1976d2', fontWeight: 700 }}>Files & Summarize</h3>
              <FileList groupId={groupId} />
            </div>
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ color: '#1976d2', fontWeight: 700 }}>Summary History</h3>
              {summaries.length === 0 ? (
                <div>No summaries yet.</div>
              ) : (
                <ul style={{ paddingLeft: 0 }}>
                  {summaries.map(s => (
                    <li key={s.id} style={{ marginBottom: 16, listStyle: 'none', background: '#f7f8fa', padding: 12, borderRadius: 8 }}>
                      <div><b>File:</b> {s.filename}</div>
                      <div><b>Summary:</b> {s.summary}</div>
                      <div style={{ fontSize: 12, color: '#888' }}><b>Time:</b> {new Date(s.timestamp).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
        {selectedSection === 'todo' && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ color: '#1976d2', fontWeight: 700 }}>Todo List</h3>
            <TodoBoard groupId={groupId} />
          </div>
        )}
        {selectedSection === 'meeting' && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ color: '#1976d2', fontWeight: 700 }}>Group Meeting</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetailPage; 