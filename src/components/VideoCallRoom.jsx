import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

const getPeerConfig = () => ({
  host: import.meta.env.VITE_PEER_SERVER_HOST || 'studysync-fgg4.onrender.com',
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

const VideoCallRoom = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [peers, setPeers] = useState([]);
  const localVideoRef = useRef();
  const remoteVideosRef = useRef({});
  const peerRef = useRef();
  const connectionsRef = useRef({});

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
        <h2>Join a Video Call Room</h2>
        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <input
          type="text"
          placeholder="Your Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <button onClick={joinRoom} disabled={!roomId || !userName}>
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