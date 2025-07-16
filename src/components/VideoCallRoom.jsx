import React from "react";
import { HMSPrebuilt } from "@100mslive/roomkit-react";
import { useAuth } from "../../contexts/AuthContext";

const VideoCallRoom = ({ forceRoomId }) => {
  const { user } = useAuth();
  const [join, setJoin] = React.useState(false);
  const [userName, setUserName] = React.useState(user?.displayName || "");

  if (join) {
    return (
      <div style={{ height: "70vh", minWidth: 320 }}>
        <HMSPrebuilt roomCode={forceRoomId} userName={userName} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f7f8fa 0%, #e3f0ff 100%)',
      borderRadius: 16, boxShadow: '0 4px 24px rgba(25,118,210,0.10)', padding: 32, minWidth: 320, maxWidth: 380
    }}>
      <h2 style={{ fontWeight: 800, color: '#1976d2', marginBottom: 18 }}>Join Group Meeting</h2>
      <label style={{ alignSelf: 'flex-start', color: '#1976d2', fontWeight: 600, marginBottom: 4, marginLeft: 2 }}>Your Name</label>
      <input
        type="text"
        placeholder="Your Name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        style={{
          marginBottom: 18, padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e3eafc', fontSize: 16,
          background: '#f7f8fa', color: '#1976d2', outline: 'none', boxShadow: '0 1px 4px #e3eafc44', width: '100%', transition: 'border 0.2s'
        }}
      />
      <button
        onClick={() => setJoin(true)}
        disabled={!userName}
        style={{
          background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)', color: '#fff', fontWeight: 700, fontSize: 17,
          border: 'none', borderRadius: 10, padding: '12px 0', width: '100%', boxShadow: '0 2px 8px #1976d220', cursor: (!userName) ? 'not-allowed' : 'pointer', opacity: (!userName) ? 0.6 : 1,
          transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s'
        }}
      >
        Join Meeting
      </button>
    </div>
  );
};

export default VideoCallRoom; 