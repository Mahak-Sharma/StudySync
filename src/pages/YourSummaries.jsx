import React, { useEffect, useState } from 'react';
import { fetchUserSummaries } from '../api/api';
import FileList from '../components/Files/FileList';

// TODO: Replace with real user ID from context
const USER_ID = 'demo-user';

const YourSummaries = () => {
  const [summaries, setSummaries] = useState([]);

  useEffect(() => {
    fetchUserSummaries(USER_ID).then(setSummaries);
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '32px auto', padding: 24, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)' }}>
      <h2 style={{ color: '#1976d2', fontWeight: 800, marginBottom: 24 }}>Your Summaries</h2>
      <FileList />
      {summaries.length === 0 ? (
        <div>No personal summaries yet.</div>
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
  );
};

export default YourSummaries; 