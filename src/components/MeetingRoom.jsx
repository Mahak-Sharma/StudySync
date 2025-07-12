import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./MeetingRoom.css";

// Set SERVER_URL for production and development
const SERVER_URL =
  import.meta.env.VITE_MEETING_SERVER_URL ||
  (import.meta.env.PROD
    ? 'https://studysync-enqu.onrender.com' // Use the integrated server
    : 'http://localhost:5002'); // Local video call server (now includes meeting functionality)
// The video call server now handles both 1:1 calls and group meetings

const MeetingRoom = ({ groupId, userName }) => {
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [participants, setParticipants] = useState([]); // [{id, name}]
  const [peerStreams, setPeerStreams] = useState([]); // [{id, name, stream}]
  const [leaving, setLeaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const localVideoRef = useRef();
  const socketRef = useRef();
  const peerConnections = useRef({});
  const localStream = useRef();
  // Add a ref object to store refs for each remote participant
  const remoteVideoRefs = useRef({});
  const makingOffer = useRef(false);

  // Connect socket
  useEffect(() => {
    console.log('Connecting to meeting server:', SERVER_URL);
    console.log('Environment:', import.meta.env.PROD ? 'production' : 'development');

    socketRef.current = io(SERVER_URL, {
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      secure: SERVER_URL.startsWith('https'),
      withCredentials: true,
      timeout: 20000, // 20 second timeout
      forceNew: true
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to meeting server');
      setConnectionStatus('connected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Failed to connect to meeting server:', error);
      console.error('Server URL:', SERVER_URL);
      console.error('Error details:', error.message);
      setConnectionStatus('error');
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from meeting server:', reason);
    });

    socketRef.current.on('error', (error) => {
      console.error('🚨 Socket error:', error);
    });

    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Join room and get media
  const joinRoom = async () => {
    localStream.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setJoined(true);
    socketRef.current.emit("join-room", { roomId: groupId, name: userName });
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
        // Only set srcObject if it has changed
        if (videoElement.srcObject !== peer.stream) {
          videoElement.srcObject = peer.stream;
          videoElement.play().then(() => {
            console.log('✅ Successfully playing video for peer:', peer.id);
          }).catch(error => {
            console.error('❌ Error playing video for peer:', peer.id, error);
          });
        } else if (videoElement.paused) {
          // If already set but paused, try to play
          videoElement.play().catch(error => {
            console.error('❌ Error playing video for peer:', peer.id, error);
          });
        }
      }
    });
  }, [peerStreams]);

  // Handle participants and signaling
  useEffect(() => {
    if (!joined) return;
    const socket = socketRef.current;

    // Announce self
    socket.emit("announce", { groupId, userId: socket.id, name: userName });

    // Receive full participant list
    socket.on("participants", (list) => {
      setParticipants(list);
      // For each existing user (except self), create a peer connection and offer if our socket.id is lower
      list.forEach(({ id, name }) => {
        if (id !== socket.id && !peerConnections.current[id]) {
          const shouldInitiate = socket.id < id; // Only the peer with lower socket.id sends the offer
          createPeerConnection(id, name, shouldInitiate);
        }
      });
    });

    // New user joined
    socket.on("user-joined", ({ id, name }) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.id === id)) return prev;
        return [...prev, { id, name }];
      });
      if (id !== socket.id && !peerConnections.current[id]) {
        // Both sides create a peer connection, but only the one with lower socket.id sends the offer
        const shouldInitiate = socket.id < id;
        createPeerConnection(id, name, shouldInitiate);
      }
    });

    // Announce
    socket.on("announce", ({ userId, name }) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.id === userId)) return prev;
        return [...prev, { id: userId, name }];
      });
    });

    // Handle signaling
    socket.on("signal", async ({ sender, data }) => {
      console.log('📨 Received signal from', sender, 'type:', data.type);

      let pc = peerConnections.current[sender];
      if (!pc) {
        // Defensive: create if missing
        const peerName =
          participants.find((p) => p.id === sender)?.name || sender;
        console.log('🆕 Creating missing peer connection for:', sender);
        pc = createPeerConnection(sender, peerName, false);
      }

      try {
        if (data.type === "offer") {
          console.log('📥 Processing offer from:', sender);
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log('📤 Sending answer to:', sender);
          socket.emit("signal", {
            roomId: groupId,
            data: { type: "answer", answer, to: sender },
          });
        } else if (data.type === "answer") {
          console.log('📥 Processing answer from:', sender);
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          } else {
            console.warn('⚠️ Skipping setRemoteDescription(answer): wrong signaling state', pc.signalingState);
          }
        } else if (data.type === "candidate") {
          console.log('📥 Processing ICE candidate from:', sender);
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (error) {
        console.error('❌ Error processing signal from', sender, ':', error);
      }
    });

    // User left
    socket.on("user-left", (userId) => {
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
      setPeerStreams((prev) => prev.filter((p) => p.id !== userId));
      setParticipants((prev) => prev.filter((p) => p.id !== userId));
    });

    return () => {
      socket.off("participants");
      socket.off("user-joined");
      socket.off("announce");
      socket.off("signal");
      socket.off("user-left");
    };
  }, [joined, groupId, userName, participants]);

  // Create peer connection
  function createPeerConnection(peerId, peerName, isInitiator) {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject"
        }
      ]
    });
    peerConnections.current[peerId] = pc;

    // Add local tracks
    if (localStream.current) {
      localStream.current
        .getTracks()
        .forEach((track) => {
          console.log('Adding local track to', peerId, track.kind, track);
          pc.addTrack(track, localStream.current);
        });
    }

    // ICE
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("signal", {
          roomId: groupId,
          data: { type: "candidate", candidate: event.candidate, to: peerId },
        });
      }
    };

    // ICE connection state debugging
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state with', peerId, ':', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected') {
        console.log('✅ WebRTC connection established with', peerId);
      } else if (pc.iceConnectionState === 'failed') {
        console.error('❌ WebRTC connection failed with', peerId);
      }
    };

    // Connection state debugging
    pc.onconnectionstatechange = () => {
      console.log('Connection state with', peerId, ':', pc.connectionState);
    };

    // Track
    pc.ontrack = (event) => {
      console.log('🎥 Received remote track from', peerId, event.track.kind, event.track);
      console.log('📊 All remote tracks:', event.streams[0].getTracks());
      console.log('🆔 Stream ID:', event.streams[0].id);
      console.log('✅ Stream active:', event.streams[0].active);
      console.log('🎬 Stream readyState:', event.streams[0].readyState);

      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        console.log('🎯 Adding stream to peerStreams for peer:', peerId);
        console.log('📹 Video tracks in stream:', stream.getVideoTracks().length);
        console.log('🔊 Audio tracks in stream:', stream.getAudioTracks().length);

        setPeerStreams((prev) => {
          // Only add if not already present
          if (prev.some((p) => p.id === peerId)) {
            console.log('🔄 Updating existing peer stream for:', peerId);
            return prev.map((p) =>
              p.id === peerId ? { ...p, stream: stream } : p
            );
          } else {
            console.log('➕ Adding new peer stream for:', peerId);
            return [
              ...prev,
              { id: peerId, name: peerName, stream: stream },
            ];
          }
        });
      } else {
        console.error('❌ No streams received from peer:', peerId);
      }
    };

    // Offer/Answer
    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          if (makingOffer.current) return;
          makingOffer.current = true;
          console.log('🔄 Negotiation needed for peer:', peerId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log('📤 Sending offer to peer:', peerId);
          socketRef.current.emit("signal", {
            roomId: groupId,
            data: { type: "offer", offer, to: peerId },
          });
        } catch (e) {
          console.error('❌ Error creating offer for peer:', peerId, e);
        } finally {
          makingOffer.current = false;
        }
      };
    }
    return pc;
  }

  // Toggle mic/cam
  const toggleMic = async () => {
    if (!localStream.current) return;
    if (micOn) {
      localStream.current.getAudioTracks().forEach((track) => {
        track.stop();
        localStream.current.removeTrack(track);
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc
            .getSenders()
            .find((s) => s.track && s.track.kind === "audio");
          if (sender) pc.removeTrack(sender);
        });
      });
      setMicOn(false);
    } else {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      audioStream.getAudioTracks().forEach((track) => {
        localStream.current.addTrack(track);
        Object.values(peerConnections.current).forEach((pc) => {
          pc.addTrack(track, localStream.current);
        });
      });
      setMicOn(true);
    }
  };

  const toggleCam = async () => {
    if (!localStream.current) return;
    if (camOn) {
      localStream.current.getVideoTracks().forEach((track) => {
        track.stop();
        localStream.current.removeTrack(track);
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) pc.removeTrack(sender);
        });
      });
      setCamOn(false);
    } else {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      videoStream.getVideoTracks().forEach((track) => {
        localStream.current.addTrack(track);
        Object.values(peerConnections.current).forEach((pc) => {
          pc.addTrack(track, localStream.current);
        });
      });
      setCamOn(true);
    }
  };

  // Leave meeting
  const leaveMeeting = () => {
    setLeaving(true);
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
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
        Status: {connectionStatus === 'connected' ? 'Connected' :
          connectionStatus === 'connecting' ? 'Connecting...' :
            connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
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
                  fontWeight: p.id === socketRef.current.id ? 700 : 400,
                  padding: "4px 0"
                }}
              >
                {p.id === socketRef.current.id ? "You" : p.name}
                {peerConnections.current[p.id] && (
                  <span style={{
                    marginLeft: "8px",
                    fontSize: "12px",
                    color: peerConnections.current[p.id].connectionState === 'connected' ? '#4caf50' : '#ff9800'
                  }}>
                    ({peerConnections.current[p.id].connectionState})
                  </span>
                )}
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
        </div>
      )}
    </div>
  );
};

export default MeetingRoom;
