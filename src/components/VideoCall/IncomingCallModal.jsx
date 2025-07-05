import React from 'react';
import './VideoCall.css';

const IncomingCallModal = ({ open, callerName, onAccept, onReject }) => {
  if (!open) return null;
  return (
    <div className="video-call-overlay" style={{ zIndex: 2000, background: 'rgba(0,0,0,0.7)' }}>
      <div className="incoming-call-modal">
        <div className="incoming-call-title">Incoming Call</div>
        <div className="incoming-call-caller">{callerName} is calling you…</div>
        <div className="incoming-call-actions">
          <button className="call-btn start-call" onClick={onAccept}>Accept</button>
          <button className="call-btn end-call" onClick={onReject}>Reject</button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal; 