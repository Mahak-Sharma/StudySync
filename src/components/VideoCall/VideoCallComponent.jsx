import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVideoCallContext } from '../../contexts/VideoCallContext';
import { Peer } from 'peerjs';
import './VideoCall.css';
import IncomingCallModal from './IncomingCallModal';

const VideoCallComponent = ({ isOpen, onClose, friendId, friendName }) => {
    const { user } = useAuth();
    const { showIncomingCall, getPendingCall, clearPendingCall } = useVideoCallContext();
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected, ended
    const [incomingCall, setIncomingCall] = useState(null); // { from, fromName }
    const [showIncomingModal, setShowIncomingModal] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef = useRef(null);
    const callRef = useRef(null);
    const localStreamRef = useRef(null);

    // Initialize PeerJS
    useEffect(() => {
        if (isOpen && user) {
            initializePeerJS();
            setupMediaStream();

            // Check for pending calls from global context
            const pendingCall = getPendingCall();
            if (pendingCall && pendingCall.from === friendId) {
                setIncomingCall(pendingCall);
                setShowIncomingModal(true);
                clearPendingCall();
            }
        }

        return () => {
            cleanup();
        };
    }, [isOpen, user, friendId, getPendingCall, clearPendingCall]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play?.();
        }
    }, [localStream, localVideoRef]);

    // Ensure remote video always gets the stream
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(e => console.error('Error playing remote video:', e));
        }
    }, [remoteStream, remoteVideoRef]);

    const initializePeerJS = () => {
        console.log('Initializing PeerJS for video call');
        
        // Create a unique peer ID for this user
        const peerId = `user-${user.uid}-${Date.now()}`;
        
        peerRef.current = new Peer(peerId, {
            host: import.meta.env.VITE_PEER_SERVER_HOST || 'studysync-enqu.onrender.com',
            port: import.meta.env.VITE_PEER_SERVER_PORT || 443,
            path: '/peerjs',
            secure: true,
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
            
            // Check if this is from our friend
            if (call.peer.includes(friendId)) {
                setIncomingCall({ from: call.peer, fromName: friendName });
                setShowIncomingModal(true);
                showIncomingCall(call.peer, friendName);
            }
        });
    };

    const setupMediaStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            localStreamRef.current = stream;
            setLocalStream(stream);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing media devices:', error);
        }
    };

    const startCall = async () => {
        if (!friendId || !localStreamRef.current || !peerRef.current) return;

        setCallStatus('calling');
        
        try {
            // Create a peer ID for the friend (this would be known from your app's user system)
            const friendPeerId = `user-${friendId}`;
            
            console.log('📞 Calling peer:', friendPeerId);
            const call = peerRef.current.call(friendPeerId, localStreamRef.current);
            callRef.current = call;
            
            call.on('stream', (remoteStream) => {
                console.log('🎥 Received remote stream from:', friendPeerId);
                setRemoteStream(remoteStream);
                setCallStatus('connected');
                setIsCallActive(true);
            });
            
            call.on('close', () => {
                console.log('📞 Call closed with:', friendPeerId);
                endCall();
            });
            
            call.on('error', (error) => {
                console.error('❌ Call error with:', friendPeerId, error);
                endCall();
            });
            
        } catch (error) {
            console.error('❌ Error starting call:', error);
            setCallStatus('ended');
        }
    };

    const handleAcceptCall = async () => {
        if (incomingCall && localStreamRef.current && peerRef.current) {
            try {
                // Find the call object (this would need to be stored when the call comes in)
                // For now, we'll create a new call to the incoming peer
                const call = peerRef.current.call(incomingCall.from, localStreamRef.current);
                callRef.current = call;
                
                call.on('stream', (remoteStream) => {
                    console.log('🎥 Received remote stream from:', incomingCall.from);
                    setRemoteStream(remoteStream);
                    setCallStatus('connected');
                    setIsCallActive(true);
                });
                
                call.on('close', () => {
                    console.log('📞 Call closed with:', incomingCall.from);
                    endCall();
                });
                
                call.on('error', (error) => {
                    console.error('❌ Call error with:', incomingCall.from, error);
                    endCall();
                });
                
                setShowIncomingModal(false);
                setIncomingCall(null);
                
            } catch (error) {
                console.error('❌ Error accepting call:', error);
            }
        }
    };

    const handleRejectCall = () => {
        setShowIncomingModal(false);
        setIncomingCall(null);
        setCallStatus('ended');
    };

    const endCall = () => {
        if (callRef.current) {
            callRef.current.close();
            callRef.current = null;
        }
        
        setRemoteStream(null);
        setCallStatus('ended');
        setIsCallActive(false);
        setShowIncomingModal(false);
        setIncomingCall(null);
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    const cleanup = () => {
        if (callRef.current) {
            callRef.current.close();
            callRef.current = null;
        }
        
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        
        setLocalStream(null);
        setRemoteStream(null);
        setCallStatus('idle');
        setIsCallActive(false);
        setShowIncomingModal(false);
        setIncomingCall(null);
    };

    if (!isOpen) return null;

    return (
        <div className="video-call-overlay">
            <div className="video-call-container">
                <div className="video-call-header">
                    <h3>Video Call with {friendName}</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

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

                <div className="video-call-content">
                    <div className="video-grid">
                        <div className="remote-video-container">
                            {remoteStream ? (
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="remote-video"
                                />
                            ) : (
                                <div className="no-video">
                                    <p>Waiting for {friendName} to join...</p>
                                </div>
                            )}
                        </div>

                        <div className="local-video-container">
                            {localStream ? (
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="local-video"
                                />
                            ) : (
                                <div className="no-video">
                                    <p>Loading camera...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="call-controls">
                        {callStatus === 'idle' && (
                            <div className="call-controls-idle">
                                <button 
                                    className="call-btn start-call"
                                    onClick={startCall}
                                    disabled={connectionStatus !== 'connected'}
                                    style={{
                                        opacity: connectionStatus !== 'connected' ? 0.5 : 1,
                                        cursor: connectionStatus !== 'connected' ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    📞 Start Call
                                </button>
                            </div>
                        )}

                        {callStatus === 'calling' && (
                            <div className="calling-status">
                                <p>Calling {friendName}...</p>
                                <button 
                                    className="call-btn end-call"
                                    onClick={endCall}
                                >
                                    ❌ Cancel
                                </button>
                            </div>
                        )}

                        {callStatus === 'connected' && (
                            <div className="call-controls-active">
                                <button 
                                    className="call-btn"
                                    onClick={toggleMute}
                                >
                                    {isMuted ? '🔇 Unmute' : '🔊 Mute'}
                                </button>
                                <button 
                                    className="call-btn"
                                    onClick={toggleVideo}
                                >
                                    {isVideoOff ? '📹 Show Video' : '📹 Hide Video'}
                                </button>
                                <button 
                                    className="call-btn end-call"
                                    onClick={endCall}
                                >
                                    ❌ End Call
                                </button>
                            </div>
                        )}

                        {callStatus === 'ended' && (
                            <div className="call-ended">
                                <p>Call ended</p>
                                <button 
                                    className="call-btn start-call"
                                    onClick={startCall}
                                >
                                    📞 Call Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Incoming Call Modal */}
            {showIncomingModal && incomingCall && (
                <IncomingCallModal
                    fromName={incomingCall.fromName}
                    onAccept={handleAcceptCall}
                    onReject={handleRejectCall}
                />
            )}
        </div>
    );
};

export default VideoCallComponent; 