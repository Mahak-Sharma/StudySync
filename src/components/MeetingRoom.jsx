import React, { useEffect, useRef, useState } from "react";
import { Peer } from "peerjs";
import "./MeetingRoom.css";

const MeetingRoom = ({ groupId, userName }) => {
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [participants, setParticipants] = useState([]); // [{id, name}]
  const [peerStreams, setPeerStreams] = useState([]); // [{id, name, stream}]
  const [leaving, setLeaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  
  const localVideoRef = useRef();
  const peerRef = useRef();
  const localStream = useRef();
  const peerConnections = useRef({});
  const remoteVideoRefs = useRef({});

  // Initialize PeerJS
  useEffect(() => {
    console.log('Initializing PeerJS for meeting room:', groupId);
    
    // Create a unique peer ID for this user in this room
    const peerId = `${groupId}-${userName}-${Date.now()}`;
    
    // Clean up host URL - remove protocol if present
    const host = (import.meta.env.VITE_PEER_SERVER_HOST || 'studysync-enqu.onrender.com').replace(/^https?:\/\//, '');
    
    peerRef.current = new Peer(peerId, {
      host: host,
      port: import.meta.env.VITE_PEER_SERVER_PORT || 443, // Use 443 for Render HTTPS
      path: '/peerjs',
      secure: import.meta.env.VITE_PEER_SERVER_SECURE === 'true' || import.meta.env.PROD,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
          },
          {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject"
          }
        ]
      }
    });

    peerRef.current.on('open', (id) => {
      console.log('✅ PeerJS connected with ID:', id);
      setConnectionStatus('connected');
    });

    peerRef.current.on('error', (error) => {
      console.error('❌ PeerJS error:', error);
      setConnectionStatus('error');
    });

    peerRef.current.on('disconnected', () => {
      console.log('🔌 PeerJS disconnected');
      setConnectionStatus('disconnected');
    });

    // Handle incoming calls
    peerRef.current.on('call', async (call) => {
      console.log('📞 Incoming call from:', call.peer);
      
      if (localStream.current) {
        call.answer(localStream.current);
        
        call.on('stream', (remoteStream) => {
          console.log('🎥 Received stream from:', call.peer);
          handleRemoteStream(call.peer, remoteStream);
        });
        
        call.on('close', () => {
          console.log('📞 Call closed with:', call.peer);
          removePeer(call.peer);
        });
        
        call.on('error', (error) => {
          console.error('❌ Call error with:', call.peer, error);
          removePeer(call.peer);
        });
        
        peerConnections.current[call.peer] = call;
      }
    });

    return () => {
      if (peerRef.current) {
        console.log('Cleaning up PeerJS connection');
        peerRef.current.destroy();
      }
    };
  }, [groupId, userName]);

  // Handle remote stream
  const handleRemoteStream = (peerId, stream) => {
    console.log('🎥 Processing remote stream from:', peerId);
    
    setPeerStreams((prev) => {
      const existingPeer = prev.find((p) => p.id === peerId);
      if (existingPeer) {
        console.log('🔄 Updating existing peer stream for:', peerId);
        return prev.map((p) =>
          p.id === peerId ? { ...p, stream: stream } : p
        );
      } else {
        console.log('➕ Adding new peer stream for:', peerId);
        // Extract peer name from peer ID (format: groupId-name-timestamp)
        const peerName = peerId.split('-').slice(1, -1).join('-');
        return [...prev, { id: peerId, name: peerName, stream: stream }];
      }
    });
  };

  // Remove peer
  const removePeer = (peerId) => {
    console.log('👋 Removing peer:', peerId);
    
    if (peerConnections.current[peerId]) {
      peerConnections.current[peerId].close();
      delete peerConnections.current[peerId];
    }
    
    setPeerStreams((prev) => prev.filter((p) => p.id !== peerId));
    setParticipants((prev) => prev.filter((p) => p.id !== peerId));
  };

  // Join room and get media
  const joinRoom = async () => {
    try {
      console.log('🎬 Joining meeting room:', groupId);
      
      // Get user media
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      setJoined(true);
      
      // Add self to participants
      setParticipants([{ id: peerRef.current.id, name: userName }]);
      
      // For demo purposes, we'll simulate other participants
      // In a real app, you'd get this from your backend
      console.log('✅ Joined meeting room successfully');
      
    } catch (error) {
      console.error('❌ Error joining room:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
    }
  };

  // Set local video
  useEffect(() => {
    if (joined && localVideoRef.current && localStream.current) {
      localVideoRef.current.srcObject = localStream.current;
    }
  }, [joined]);

  // Ensure remote videos get their streams
  useEffect(() => {
    peerStreams.forEach(peer => {
      if (
        peer.stream &&
        remoteVideoRefs.current[peer.id] &&
        remoteVideoRefs.current[peer.id].current
      ) {
        const videoElement = remoteVideoRefs.current[peer.id].current;
        if (videoElement.srcObject !== peer.stream) {
          videoElement.srcObject = peer.stream;
          videoElement.play().then(() => {
            console.log('✅ Successfully playing video for peer:', peer.id);
          }).catch(error => {
            if (error.name === 'AbortError') {
              return;
            }
            console.error('❌ Error playing video for peer:', peer.id, error);
          });
        } else if (videoElement.paused) {
          videoElement.play().catch(error => {
            if (error.name === 'AbortError') {
              return;
            }
            console.error('❌ Error playing video for peer:', peer.id, error);
          });
        }
      }
    });
  }, [peerStreams]);

  // Call a peer (this would be triggered when you want to connect to someone)
  const callPeer = async (peerId) => {
    if (!localStream.current || !peerRef.current) return;
    
    // Don't call if already connected
    if (peerConnections.current[peerId]) {
      console.log('⚠️ Already connected to peer:', peerId);
      return;
    }
    
    console.log('📞 Calling peer:', peerId);
    
    // Set connecting status
    setParticipants(prev => prev.map(p => 
      p.id === peerId 
        ? { ...p, status: 'connecting', error: null }
        : p
    ));
    
    try {
      const call = peerRef.current.call(peerId, localStream.current);
      
      call.on('stream', (remoteStream) => {
        console.log('🎥 Received stream from:', peerId);
        handleRemoteStream(peerId, remoteStream);
        
        // Clear connecting status on success
        setParticipants(prev => prev.map(p => 
          p.id === peerId 
            ? { ...p, status: 'connected', error: null }
            : p
        ));
      });
      
      call.on('close', () => {
        console.log('📞 Call closed with:', peerId);
        removePeer(peerId);
      });
      
      call.on('error', (error) => {
        console.error('❌ Call error with:', peerId, error);
        
        // Handle different types of errors
        if (error.type === 'peer-unavailable' || error.message?.includes('Could not connect to peer')) {
          console.log('⚠️ Peer is unavailable or offline:', peerId);
          // Show user-friendly message
          setParticipants(prev => prev.map(p => 
            p.id === peerId 
              ? { ...p, status: 'offline', error: 'User is offline or not available' }
              : p
          ));
        } else if (error.type === 'network') {
          console.log('⚠️ Network error with peer:', peerId);
          setParticipants(prev => prev.map(p => 
            p.id === peerId 
              ? { ...p, status: 'error', error: 'Network connection failed' }
              : p
          ));
        } else {
          console.log('❌ Removing peer due to error:', peerId);
          removePeer(peerId);
        }
      });
      
      peerConnections.current[peerId] = call;
      
    } catch (error) {
      console.error('❌ Error calling peer:', peerId, error);
      // Show user-friendly error message
      if (error.message.includes('Could not connect to peer')) {
        console.log('⚠️ Peer is offline or not available');
      }
    }
  };

  // Toggle mic/cam
  const toggleMic = async () => {
    if (!localStream.current) return;
    
    if (micOn) {
      localStream.current.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      setMicOn(false);
    } else {
      localStream.current.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      setMicOn(true);
    }
  };

  const toggleCam = async () => {
    if (!localStream.current) return;
    
    if (camOn) {
      localStream.current.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
      setCamOn(false);
    } else {
      localStream.current.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });
      setCamOn(true);
    }
  };

  // Leave meeting
  const leaveMeeting = () => {
    setLeaving(true);
    
    // Close all peer connections
    Object.values(peerConnections.current).forEach((call) => call.close());
    peerConnections.current = {};
    
    // Stop local stream
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    
    // Clean up state
    setPeerStreams([]);
    setParticipants([]);
    setJoined(false);
    setMicOn(true);
    setCamOn(true);
    setLeaving(false);
  };

  return (
    <div className="meeting-room">
      <h2>Meeting Room: {groupId}</h2>

      {/* Connection Status */}
      <div style={{
        padding: '8px 12px',
        marginBottom: '16px',
        borderRadius: '4px',
        backgroundColor: connectionStatus === 'connected' ? '#4caf50' :
          connectionStatus === 'connecting' ? '#ff9800' :
            connectionStatus === 'error' ? '#f44336' : '#9e9e9e',
        color: 'white',
        fontSize: '14px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            Status: {connectionStatus === 'connected' ? 'Connected to PeerJS Server' :
              connectionStatus === 'connecting' ? 'Connecting to PeerJS Server...' :
                connectionStatus === 'error' ? 'Connection Error - Check Server' : 'Disconnected'}
          </span>
          {connectionStatus === 'connected' && peerRef.current && (
            <span style={{ fontSize: '12px', opacity: 0.8 }}>
              ID: {peerRef.current.id}
            </span>
          )}
        </div>
        {connectionStatus === 'error' && (
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
            Make sure the PeerJS server is running on port 9000
          </div>
        )}
      </div>

      {!joined ? (
        <button
          onClick={joinRoom}
          disabled={connectionStatus !== 'connected'}
          style={{
            opacity: connectionStatus !== 'connected' ? 0.5 : 1,
            cursor: connectionStatus !== 'connected' ? 'not-allowed' : 'pointer'
          }}
        >
          {connectionStatus === 'connected' ? 'Join Meeting' :
            connectionStatus === 'connecting' ? 'Connecting...' :
              connectionStatus === 'error' ? 'Connection Failed' : 'Waiting for Connection...'}
        </button>
      ) : (
        <div>
          {/* Local video */}
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="local-video"
            style={{
              width: "300px",
              height: "225px",
              backgroundColor: "#000",
              borderRadius: "8px",
              border: "2px solid #4caf50",
              marginBottom: "16px"
            }}
          />
          <div>
            <button onClick={toggleMic}>
              {micOn ? "Mute Mic" : "Unmute Mic"}
            </button>
            <button onClick={toggleCam}>
              {camOn ? "Turn Off Camera" : "Turn On Camera"}
            </button>
            <button
              onClick={leaveMeeting}
              disabled={leaving}
              style={{
                marginLeft: 12,
                background: "#d32f2f",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "4px 12px",
                fontWeight: 600,
              }}
            >
              {leaving ? "Leaving..." : "Leave Meeting"}
            </button>
          </div>
          
          <h3>Participants ({participants.length})</h3>
          <ul style={{ marginBottom: 12 }}>
            {participants.map((p) => (
              <li
                key={p.id}
                style={{
                  fontWeight: p.id === peerRef.current?.id ? 700 : 400,
                  padding: "8px 12px",
                  margin: "4px 0",
                  borderRadius: "4px",
                  backgroundColor: p.status === 'error' ? '#ffebee' : 
                    p.status === 'offline' ? '#fff3e0' : 
                    p.status === 'connecting' ? '#e3f2fd' :
                    peerConnections.current[p.id] ? '#e8f5e8' : '#f5f5f5',
                  border: p.status === 'error' ? '1px solid #f44336' :
                    p.status === 'offline' ? '1px solid #ff9800' :
                    p.status === 'connecting' ? '1px solid #1976d2' :
                    peerConnections.current[p.id] ? '1px solid #4caf50' : '1px solid #ddd'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    {p.id === peerRef.current?.id ? "You" : p.name}
                    <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                      ({p.id})
                    </span>
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {p.status === 'error' && (
                      <span style={{ fontSize: '12px', color: '#f44336' }}>
                        ❌ {p.error}
                      </span>
                    )}
                    {p.status === 'offline' && (
                      <span style={{ fontSize: '12px', color: '#ff9800' }}>
                        ⚠️ {p.error}
                      </span>
                    )}
                    {p.status === 'connecting' && (
                      <span style={{ fontSize: '12px', color: '#1976d2' }}>
                        🔄 Connecting...
                      </span>
                    )}
                    {peerConnections.current[p.id] && (
                      <span style={{
                        fontSize: "12px",
                        color: '#4caf50',
                        fontWeight: 'bold'
                      }}>
                        ✅ Connected
                      </span>
                    )}
                    {!peerConnections.current[p.id] && p.id !== peerRef.current?.id && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => callPeer(p.id)}
                          style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            background: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Connect
                        </button>
                        {(p.status === 'error' || p.status === 'offline') && (
                          <button
                            onClick={() => {
                              // Clear error status and retry
                              setParticipants(prev => prev.map(participant => 
                                participant.id === p.id 
                                  ? { ...participant, status: 'connecting', error: null }
                                  : participant
                              ));
                              setTimeout(() => callPeer(p.id), 1000);
                            }}
                            style={{
                              fontSize: '12px',
                              padding: '4px 8px',
                              background: '#ff9800',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Debug Info */}
          <div style={{
            background: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "16px",
            fontSize: "12px"
          }}>
            <strong>Debug Info:</strong>
            <div>Peer Connections: {Object.keys(peerConnections.current).length}</div>
            <div>Peer Streams: {peerStreams.length}</div>
            <div>Local Stream: {localStream.current ? 'Active' : 'None'}</div>
            {localStream.current && (
              <div>
                Local Video Tracks: {localStream.current.getVideoTracks().length}
                Local Audio Tracks: {localStream.current.getAudioTracks().length}
              </div>
            )}
            {peerRef.current && (
              <div>Peer ID: {peerRef.current.id}</div>
            )}
          </div>

          {/* Remote videos */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {peerStreams.map(peer => {
              // Create a ref for each peer if it doesn't exist
              if (!remoteVideoRefs.current[peer.id]) {
                remoteVideoRefs.current[peer.id] = React.createRef();
              }
              return (
                <div key={peer.id} style={{ position: "relative", minWidth: "300px", minHeight: "225px" }}>
                  <video
                    ref={remoteVideoRefs.current[peer.id]}
                    autoPlay
                    playsInline
                    className="remote-video"
                    style={{
                      width: "100%",
                      height: "100%",
                      minWidth: "300px",
                      minHeight: "225px",
                      backgroundColor: "#000",
                      borderRadius: "8px",
                      border: "2px solid #1976d2"
                    }}
                    onLoadedMetadata={() => {
                      console.log('Video metadata loaded for peer:', peer.id);
                    }}
                    onCanPlay={() => {
                      console.log('Video can play for peer:', peer.id);
                    }}
                    onError={(e) => {
                      console.error('Video error for peer:', peer.id, e);
                    }}
                  />
                  {/* Black overlay if no video track */}
                  {(!peer.stream || !peer.stream.getVideoTracks().length) && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "#000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        borderRadius: "8px"
                      }}
                    >
                      <div>
                        <div>📹</div>
                        <div>Camera Off</div>
                      </div>
                    </div>
                  )}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: 8,
                      color: "#fff",
                      background: "rgba(0,0,0,0.7)",
                      padding: "4px 12px",
                      borderRadius: 4,
                      fontSize: 14,
                      fontWeight: "bold"
                    }}
                  >
                    {peer.name}
                  </div>
                  {/* Debug info */}
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: "#fff",
                      background: "rgba(0,0,0,0.7)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12
                    }}
                  >
                    {peer.stream ? `${peer.stream.getVideoTracks().length}V ${peer.stream.getAudioTracks().length}A` : 'No Stream'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Demo: Connect to another peer */}
          <div style={{ marginTop: '20px', padding: '16px', background: '#f0f0f0', borderRadius: '8px' }}>
            <h4>Demo: Connect to another peer</h4>
            <p style={{ fontSize: '14px', marginBottom: '12px' }}>
              To test peer connections, open another browser tab/window and join the same meeting room.
              Then use the peer ID shown above to connect.
            </p>
            <input
              type="text"
              placeholder="Enter peer ID to connect"
              style={{
                padding: '8px 12px',
                marginRight: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                width: '300px'
              }}
              id="peerIdInput"
            />
            <button
              onClick={() => {
                const peerId = document.getElementById('peerIdInput').value;
                if (peerId) {
                  callPeer(peerId);
                }
              }}
              style={{
                padding: '8px 16px',
                background: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Connect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingRoom;
