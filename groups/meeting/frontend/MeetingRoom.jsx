import React, { useEffect, useRef, useState } from 'react';
import { Peer } from 'peerjs';

const MeetingRoom = ({ groupId, userName }) => {
    const [joined, setJoined] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [peers, setPeers] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    
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
        
        peerRef.current = new Peer(peerId, {
            host: import.meta.env.VITE_PEER_SERVER_HOST || 'studysync-irks.onrender.com',
            port: Number(import.meta.env.VITE_PEER_SERVER_PORT) || 443,
            path: '/peerjs',
            secure: import.meta.env.VITE_PEER_SERVER_SECURE === 'true' || true,
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
        
        setPeers((prev) => {
            const existingPeer = prev.find((p) => p.userId === peerId);
            if (existingPeer) {
                console.log('🔄 Updating existing peer stream for:', peerId);
                return prev.map((p) =>
                    p.userId === peerId ? { ...p, stream: stream } : p
                );
            } else {
                console.log('➕ Adding new peer stream for:', peerId);
                // Extract peer name from peer ID (format: groupId-name-timestamp)
                const peerName = peerId.split('-').slice(1, -1).join('-');
                return [...prev, { userId: peerId, name: peerName, stream: stream }];
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
        
        setPeers((prev) => prev.filter((p) => p.userId !== peerId));
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
            
            localVideoRef.current.srcObject = localStream.current;
            setJoined(true);
            
            console.log('✅ Joined meeting room successfully');
            
        } catch (error) {
            console.error('❌ Error joining room:', error);
            alert('Failed to access camera/microphone. Please check permissions.');
        }
    };

    // Call a peer (this would be triggered when you want to connect to someone)
    const callPeer = async (peerId) => {
        if (!localStream.current || !peerRef.current) return;
        
        console.log('📞 Calling peer:', peerId);
        
        try {
            const call = peerRef.current.call(peerId, localStream.current);
            
            call.on('stream', (remoteStream) => {
                console.log('🎥 Received stream from:', peerId);
                handleRemoteStream(peerId, remoteStream);
            });
            
            call.on('close', () => {
                console.log('📞 Call closed with:', peerId);
                removePeer(peerId);
            });
            
            call.on('error', (error) => {
                console.error('❌ Call error with:', peerId, error);
                removePeer(peerId);
            });
            
            peerConnections.current[peerId] = call;
            
        } catch (error) {
            console.error('❌ Error calling peer:', peerId, error);
        }
    };

    // Toggle mic/cam
    const toggleMic = () => {
        if (!localStream.current) return;
        
        localStream.current.getAudioTracks().forEach(track => {
            track.enabled = !micOn;
        });
        setMicOn(m => !m);
    };

    const toggleCam = () => {
        if (!localStream.current) return;
        
        localStream.current.getVideoTracks().forEach(track => {
            track.enabled = !camOn;
        });
        setCamOn(c => !c);
    };

    return (
        <div>
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
                {connectionStatus === 'connected' && peerRef.current && (
                    <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                        (ID: {peerRef.current.id})
                    </span>
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
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        style={{ width: 240, border: '2px solid #1976d2', borderRadius: 8 }} 
                    />
                    <div>
                        <button onClick={toggleMic}>{micOn ? 'Mute Mic' : 'Unmute Mic'}</button>
                        <button onClick={toggleCam}>{camOn ? 'Turn Off Camera' : 'Turn On Camera'}</button>
                    </div>
                    
                    <h3>Participants ({peers.length})</h3>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {peers.map(p => {
                            // Create a ref for each peer if it doesn't exist
                            if (!remoteVideoRefs.current[p.userId]) {
                                remoteVideoRefs.current[p.userId] = React.createRef();
                            }
                            return (
                                <div key={p.userId} style={{ position: "relative" }}>
                                    <video 
                                        ref={remoteVideoRefs.current[p.userId]}
                                        autoPlay 
                                        playsInline 
                                        style={{ width: 180, border: '1px solid #888', borderRadius: 8 }}
                                        onLoadedMetadata={() => {
                                            if (remoteVideoRefs.current[p.userId].current) {
                                                remoteVideoRefs.current[p.userId].current.srcObject = p.stream;
                                            }
                                        }}
                                    />
                                    <div style={{
                                        position: "absolute",
                                        bottom: 8,
                                        left: 8,
                                        color: "#fff",
                                        background: "rgba(0,0,0,0.7)",
                                        padding: "4px 8px",
                                        borderRadius: 4,
                                        fontSize: 12
                                    }}>
                                        {p.name}
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

                    {/* Debug Info */}
                    <div style={{
                        background: "#f5f5f5",
                        padding: "12px",
                        borderRadius: "4px",
                        marginTop: "16px",
                        fontSize: "12px"
                    }}>
                        <strong>Debug Info:</strong>
                        <div>Peer Connections: {Object.keys(peerConnections.current).length}</div>
                        <div>Peer Streams: {peers.length}</div>
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
                </div>
            )}
        </div>
    );
};

export default MeetingRoom; 