import React from 'react';

const QuizMain = ({ groupId }) => {
  return (
    <div style={{ padding: 24, background: '#f7f8fa', borderRadius: 12, minHeight: 200 }}>
      <h4 style={{ color: '#1976d2', marginBottom: 16 }}>Quiz Platform (Live for Group)</h4>
      <div style={{ color: '#888' }}>
        Quiz features (create, participate, leaderboard) will appear here for group: <b>{groupId}</b>.
      </div>
    </div>
  );
};

export default QuizMain; 