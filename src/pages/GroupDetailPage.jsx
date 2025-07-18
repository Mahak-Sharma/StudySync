import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatBox from '../components/Chat/ChatBox';
import FileList from '../components/Files/FileList';
import TodoBoard from '../components/Todo/TodoBoard';
import { fetchGroupSummaries, getFriends, fetchGroupMembers, sendGroupInvite } from '../api/api';
import { db } from '../api/firebaseConfig';
import { doc, getDoc, updateDoc, arrayRemove, deleteDoc, arrayUnion } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { FaHome, FaComments, FaFileAlt, FaListAlt, FaBars, FaVideo, FaUsers } from 'react-icons/fa';
import { FaRegCopy } from 'react-icons/fa';
import VideoCallRoom from '../components/VideoCallRoom';
import BackButton from '../components/BackButton';
import QuizMain from '../components/Quiz/QuizMain'; // Placeholder for the main quiz component

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
  const [selectedSection, setSelectedSection] = useState('members'); // Default to members section
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
    <>
      <BackButton />
      <div className="group-detail-flex-layout">
        <div className={`group-side-panel${collapsed ? ' side-panel-collapsed' : ''}`}>
          <button className="side-panel-toggle-btn" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand' : 'Collapse'}>
            <FaBars />
          </button>
          <button className={`side-panel-btn${selectedSection === 'dashboard' ? ' active' : ''}`} onClick={() => navigate('/dashboard')}>
            <span className="side-panel-icon"><FaHome /></span>
            {!collapsed && <span className="side-panel-label">Home</span>}
          </button>
          <button className={`side-panel-btn${selectedSection === 'members' ? ' active' : ''}`} onClick={() => handleSectionChange('members')}>
            <span className="side-panel-icon"><FaUsers /></span>
            {!collapsed && <span className="side-panel-label">Members</span>}
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
          <button className={`side-panel-btn${selectedSection === 'quiz' ? ' active' : ''}`} onClick={() => handleSectionChange('quiz')}>
            <span className="side-panel-icon">📝</span>
            {!collapsed && <span className="side-panel-label">Quiz</span>}
          </button>
        </div>
        <div className={`group-main-content${fade ? ' fade-out' : ''}`}>
          {selectedSection === 'members' && (
            <>
              <h2 style={{ color: '#1976d2', fontWeight: 800, marginBottom: 12 }}>
                {loadingGroupName ? 'Loading group...' : `Group: ${groupName}`}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ fontWeight: 600, color: '#333', marginRight: 8 }}>Group ID:</span>
                <span style={{ fontFamily: 'monospace', background: '#e3f0fc', padding: '2px 8px', borderRadius: 4, fontSize: 15 }}>{groupId}</span>
                <button
                  style={{ marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#1976d2', fontSize: 20, padding: 2, display: 'flex', alignItems: 'center' }}
                  title="Copy Group ID"
                  onClick={() => {navigator.clipboard.writeText(groupId)}}
                >
                  <FaRegCopy />
                </button>
              </div>
              {/* Add Member by User ID */}
              <div style={{ marginBottom: 18, background: '#f7f8fa', padding: 16, borderRadius: 8, maxWidth: 400 }}>
                <h4 style={{ marginBottom: 8 }}>Add Member by User ID</h4>
                <AddMemberById groupId={groupId} setMembers={setMembers} />
              </div>
              {/* Invite Friends UI (existing) */}
              <div style={{ marginBottom: 18, background: '#f7f8fa', padding: 16, borderRadius: 8, maxWidth: 400 }}>
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
              {/* Members List */}
              <h3 style={{ color: '#1976d2', fontWeight: 700 }}>Group Members</h3>
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
            </>
          )}
          {selectedSection === 'chat' && (
            <>
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ color: '#1976d2', fontWeight: 700 }}>Group Chat</h3>
                <ChatBox groupId={groupId} />
              </div>
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
              <h3 style={{ color: '#1976d2', fontWeight: 700, marginBottom: 24 }}>Group Meeting</h3>
              <VideoCallRoom forceRoomId={groupId} />
            </div>
          )}
          {selectedSection === 'quiz' && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ color: '#1976d2', fontWeight: 700 }}>Group Quizzes</h3>
              <QuizMain groupId={groupId} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GroupDetailPage;

// Add this helper component at the top-level (outside GroupDetailPage)
function AddMemberById({ groupId, setMembers }) {
  const [userId, setUserId] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const handleAdd = async () => {
    setError("");
    setSuccess("");
    if (!userId.trim()) {
      setError("Please enter a user ID.");
      return;
    }
    setAdding(true);
    try {
      // Add userId to group members in Firestore
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, { members: arrayUnion(userId.trim()) });
      // Optionally, add group to user's groups array
      const userRef = doc(db, 'users', userId.trim());
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userGroups = userSnap.data().groups || [];
        await updateDoc(userRef, { groups: arrayUnion({ id: groupId }) });
      }
      setSuccess("Member added!");
      setUserId("");
      // Optionally, refresh members list
      if (typeof setMembers === 'function') {
        setMembers(members => [...members, { uid: userId.trim(), displayName: null, email: null }]);
      }
    } catch (e) {
      setError("Failed to add member. Make sure the user ID is correct.");
    }
    setAdding(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="text"
        placeholder="Enter User ID"
        value={userId}
        onChange={e => setUserId(e.target.value)}
        style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #b0b0b0', fontSize: 15, minWidth: 160 }}
        disabled={adding}
      />
      <button
        onClick={handleAdd}
        style={{ padding: '6px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
        disabled={adding}
      >
        {adding ? 'Adding...' : 'Add'}
      </button>
      {error && <span style={{ color: 'red', marginLeft: 8 }}>{error}</span>}
      {success && <span style={{ color: 'green', marginLeft: 8 }}>{success}</span>}
    </div>
  );
} 