import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatBox from '../components/Chat/ChatBox';
import FileList from '../components/Files/FileList';
import TodoBoard from '../components/Todo/TodoBoard';
import { fetchGroupSummaries } from '../api/api';

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const [summaries, setSummaries] = useState([]);

  useEffect(() => {
    fetchGroupSummaries(groupId).then(setSummaries);
  }, [groupId]);

  return (
    <div className="group-detail-container" style={{ maxWidth: 900, margin: '32px auto', padding: 24, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)' }}>
      <h2 style={{ color: '#1976d2', fontWeight: 800, marginBottom: 24 }}>Group: {groupId}</h2>
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