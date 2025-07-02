import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatBox from '../components/Chat/ChatBox';
import FileList from '../components/Files/FileList';
import TodoBoard from '../components/Todo/TodoBoard';
import { fetchGroupSummaries } from '../api/api';
import { db } from '../api/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const [summaries, setSummaries] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [loadingGroupName, setLoadingGroupName] = useState(true);

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
        } else {
          setGroupName(groupId);
        }
      } catch (err) {
        setGroupName(groupId);
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
          // Fetch user info for each member
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

  return (
    <div className="group-detail-container" style={{ maxWidth: 900, margin: '32px auto', padding: 24, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)' }}>
      <h2 style={{ color: '#1976d2', fontWeight: 800, marginBottom: 24 }}>
        {loadingGroupName ? 'Loading group...' : `Group: ${groupName}`}
      </h2>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ color: '#1976d2', fontWeight: 700 }}>Group Members</h3>
        {loadingMembers ? (
          <div>Loading members...</div>
        ) : members.length === 0 ? (
          <div>No members found.</div>
        ) : (
          <ul style={{ paddingLeft: 0, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {members.map((m) => (
              <li key={m.uid} style={{ listStyle: 'none', background: '#e3f0fc', padding: 8, borderRadius: 6, minWidth: 120 }}>
                <span style={{ fontWeight: 600 }}>{m.displayName || m.email || m.uid}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ color: '#1976d2', fontWeight: 700 }}>Group Chat</h3>
        <ChatBox groupId={groupId} />
      </div>
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
      <div>
        <h3 style={{ color: '#1976d2', fontWeight: 700 }}>Todo List</h3>
        <TodoBoard groupId={groupId} />
      </div>
    </div>
  );
};

export default GroupDetailPage; 