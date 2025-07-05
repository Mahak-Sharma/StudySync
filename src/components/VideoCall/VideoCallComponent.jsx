import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVideoCallContext } from '../../contexts/VideoCallContext';
import io from 'socket.io-client';
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

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const socketRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);

    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    useEffect(() => {
        if (isOpen && user) {
            initializeSocket();
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

    const initializeSocket = () => {
        socketRef.current = io('http://localhost:5002'); // Video call server port

        socketRef.current.on('connect', () => {
            console.log('Connected to video call server');
            socketRef.current.emit('user-ready', { 
                username: user.uid,
                displayName: user.displayName || user.email 
            });
        });

        socketRef.current.on('call-request', (data) => {
            if (data.from === friendId) {
                setIncomingCall({ from: data.from, fromName: data.fromName });
                setShowIncomingModal(true);
                // Also show global notification
                showIncomingCall(data.from, data.fromName);
            }
        });

        socketRef.current.on('call-accepted', (data) => {
            if (data.from === friendId) {
                setCallStatus('connected');
                setIsCallActive(true);
                createPeerConnection();
            }
        });

        socketRef.current.on('call-rejected', (data) => {
            if (data.from === friendId) {
                setCallStatus('ended');
                setIsCallActive(false);
            }
        });

        socketRef.current.on('call-ended', (data) => {
            if (data.from === friendId) {
                endCall();
            }
        });

        socketRef.current.on('ice-candidate', (data) => {
            if (data.from === friendId && peerConnectionRef.current) {
                peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        });

        socketRef.current.on('offer', (data) => {
            if (data.from === friendId) {
                handleOffer({ ...data.offer, from: data.from });
            }
        });

        socketRef.current.on('answer', (data) => {
            if (data.from === friendId && peerConnectionRef.current) {
                handleAnswer(data.answer);
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

    const createPeerConnection = () => {
        peerConnectionRef.current = new RTCPeerConnection(configuration);

        // Add local stream to peer connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peerConnectionRef.current.addTrack(track, localStreamRef.current);
            });
        }

        // Handle incoming streams
        peerConnectionRef.current.ontrack = (event) => {
            console.log('Received remote stream:', event.streams[0]);
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
                remoteVideoRef.current.play().catch(e => console.error('Error playing remote video:', e));
            }
        };

        // Handle ICE candidates
        peerConnectionRef.current.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('ice-candidate', {
                    to: friendId,
                    from: user.uid,
                    candidate: event.candidate
                });
            }
        };
    };

    const startCall = async () => {
        if (!friendId) return;

        setCallStatus('calling');
        createPeerConnection(); // Create peer connection when starting call
        socketRef.current.emit('call-request', {
            to: friendId,
            from: user.uid,
            fromName: user.displayName || user.email
        });
    };

    const handleAcceptCall = async () => {
        if (incomingCall) {
            socketRef.current.emit('call-accepted', {
                to: incomingCall.from,
                from: user.uid
            });
            setCallStatus('connected');
            setIsCallActive(true);
            createPeerConnection();
            setShowIncomingModal(false);
            
            // Create and send offer to the caller
            try {
                const offer = await peerConnectionRef.current.createOffer();
                await peerConnectionRef.current.setLocalDescription(offer);
                
                socketRef.current.emit('offer', {
                    to: incomingCall.from,
                    from: user.uid,
                    offer: offer
                });
            } catch (error) {
                console.error('Error creating offer:', error);
            }
        }
    };

    const handleRejectCall = () => {
        if (incomingCall) {
            socketRef.current.emit('call-rejected', {
                to: incomingCall.from,
                from: user.uid
            });
            setShowIncomingModal(false);
            setIncomingCall(null);
        }
    };

    const handleOffer = async (offer) => {
        try {
            if (!peerConnectionRef.current) {
                createPeerConnection();
            }
            
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            
            // Send answer to the person who sent the offer
            const offerFrom = offer.from || friendId;
            socketRef.current.emit('answer', {
                to: offerFrom,
                from: user.uid,
                answer: answer
            });
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    };

    const handleAnswer = async (answer) => {
        try {
            if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    };

    const endCall = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        setLocalStream(null);
        setRemoteStream(null);
        setIsCallActive(false);
        setCallStatus('ended');

        socketRef.current.emit('call-ended', {
            to: friendId,
            from: user.uid
        });
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const cleanup = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="video-call-overlay">
            <div className="video-call-container">
                <div className="video-call-header">
                    <h3>Video Call with {friendName}</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
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
                            <button 
                                className="call-btn start-call"
                                onClick={startCall}
                            >
                                📞 Start Call
                            </button>
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
                                    className={`control-btn ${isMuted ? 'muted' : ''}`}
                                    onClick={toggleMute}
                                >
                                    {isMuted ? '🔇' : '🔊'}
                                </button>
                                <button 
                                    className={`control-btn ${isVideoOff ? 'video-off' : ''}`}
                                    onClick={toggleVideo}
                                >
                                    {isVideoOff ? '📷' : '📹'}
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
            <IncomingCallModal
                open={showIncomingModal}
                callerName={incomingCall?.fromName || 'Unknown'}
                onAccept={handleAcceptCall}
                onReject={handleRejectCall}
            />
        </div>
    );
};

export default VideoCallComponent; 