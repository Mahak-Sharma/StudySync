import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

const getPeerConfig = () => ({
  host: import.meta.env.VITE_PEER_SERVER_HOST || 'video-call-backend-production-bf51.up.railway.app',
  port: Number(import.meta.env.VITE_PEER_SERVER_PORT) || 443,
  path: '/peerjs',
  secure: import.meta.env.VITE_PEER_SERVER_SECURE === 'true' || true,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ],
  },
});

const VideoCallRoom = ({ forceRoomId }) => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState(forceRoomId || '');
  const [userName, setUserName] = useState('');
  const [peers, setPeers] = useState([]);
  const localVideoRef = useRef();
  const remoteVideosRef = useRef({});
  const peerRef = useRef();
  const connectionsRef = useRef({});

  useEffect(() => {
    if (forceRoomId) setRoomId(forceRoomId);
  }, [forceRoomId]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (peerRef.current) peerRef.current.destroy();
      Object.values(connectionsRef.current).forEach((call) => call.close());
    };
  }, []);

  const joinRoom = async () => {
    // Get user media
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    // Create Peer
    const peer = new Peer(`${roomId}-${userName}-${Date.now()}`, getPeerConfig());
    peerRef.current = peer;
    peer.on('open', (id) => {
      setJoined(true);
      // Notify others in the room (via signaling server or custom logic if needed)
    });
    // Handle incoming calls
    peer.on('call', (call) => {
      call.answer(stream);
      call.on('stream', (remoteStream) => {
        addRemoteStream(call.peer, remoteStream);
      });
      connectionsRef.current[call.peer] = call;
    });
    // Discover other peers (simple broadcast, not scalable for production)
    peer.on('connection', (conn) => {
      conn.on('data', (data) => {
        if (data.type === 'join' && data.peerId !== peer.id) {
          // Call the new peer
          const call = peer.call(data.peerId, stream);
          call.on('stream', (remoteStream) => {
            addRemoteStream(data.peerId, remoteStream);
          });
          connectionsRef.current[data.peerId] = call;
        }
      });
    });
  };

  const addRemoteStream = (peerId, stream) => {
    setPeers((prev) => {
      if (prev.find((p) => p.peerId === peerId)) return prev;
      return [...prev, { peerId, stream }];
    });
  };

  if (!joined) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40,
        background: 'linear-gradient(135deg, #f7f8fa 0%, #e3f0ff 100%)',
        borderRadius: 16, boxShadow: '0 4px 24px rgba(25,118,210,0.10)', padding: 32, minWidth: 320, maxWidth: 380
      }}>
        <h2 style={{ fontWeight: 800, color: '#1976d2', marginBottom: 18 }}>Join a Video Call Room</h2>
        {forceRoomId ? null : (
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{
              marginBottom: 14, padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e3eafc', fontSize: 16,
              background: '#f7f8fa', color: '#1976d2', outline: 'none', boxShadow: '0 1px 4px #e3eafc44', width: '100%', transition: 'border 0.2s'
            }}
          />
        )}
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
          onClick={joinRoom}
          disabled={!roomId || !userName}
          style={{
            background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)', color: '#fff', fontWeight: 700, fontSize: 17,
            border: 'none', borderRadius: 10, padding: '12px 0', width: '100%', boxShadow: '0 2px 8px #1976d220', cursor: (!roomId || !userName) ? 'not-allowed' : 'pointer', opacity: (!roomId || !userName) ? 0.6 : 1,
            transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s'
          }}
        >
          Join Room
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
      <h2>Video Call Room: {roomId}</h2>
      <div>
        <video ref={localVideoRef} autoPlay muted playsInline style={{ width: 300, margin: 10, border: '2px solid #333' }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {peers.map(({ peerId, stream }) => (
          <video
            key={peerId}
            ref={(el) => {
              if (el && !remoteVideosRef.current[peerId]) {
                el.srcObject = stream;
                remoteVideosRef.current[peerId] = el;
              }
            }}
            autoPlay
            playsInline
            style={{ width: 300, margin: 10, border: '2px solid #666' }}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoCallRoom; 