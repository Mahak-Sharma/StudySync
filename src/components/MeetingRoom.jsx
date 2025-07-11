import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

// const SERVER_URL = 'https://studysync-enqu.onrender.com'; // Change to your backend IP for cross-device
const SERVER_URL = 'http://localhost:5002/'; // Change to your backend IP for cross-device

const MeetingRoom = ({ groupId, userName }) => {
    const [joined, setJoined] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [participants, setParticipants] = useState([]); // [{id, name}]
    const [peerStreams, setPeerStreams] = useState([]); // [{id, name, stream}]
    const [leaving, setLeaving] = useState(false);
    const localVideoRef = useRef();
    const socketRef = useRef();
    const peerConnections = useRef({});
    const localStream = useRef();

    // Connect socket
    useEffect(() => {
        socketRef.current = io(SERVER_URL);
        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    // Join room and get media
    const joinRoom = async () => {
        localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setJoined(true);
        socketRef.current.emit('join-room', { roomId: groupId, name: userName });
    };

    // Set local video
    useEffect(() => {
        if (joined && localVideoRef.current && localStream.current) {
            localVideoRef.current.srcObject = localStream.current;
        }
    }, [joined]);

    // Handle participants and signaling
    useEffect(() => {
        if (!joined) return;
        const socket = socketRef.current;

        // Announce self
        socket.emit('announce', { groupId, userId: socket.id, name: userName });

        // Receive full participant list
        socket.on('participants', (list) => {
            setParticipants(list);
            // For each existing user (except self), create a peer connection and offer
            list.forEach(({ id, name }) => {
                if (id !== socket.id && !peerConnections.current[id]) {
                    createPeerConnection(id, name, true);
                }
            });
        });

        // New user joined
        socket.on('user-joined', ({ id, name }) => {
            setParticipants(prev => {
                if (prev.some(p => p.id === id)) return prev;
                return [...prev, { id, name }];
            });
            if (id !== socket.id && !peerConnections.current[id]) {
                createPeerConnection(id, name, false);
            }
        });

        // Announce
        socket.on('announce', ({ userId, name }) => {
            setParticipants(prev => {
                if (prev.some(p => p.id === userId)) return prev;
                return [...prev, { id: userId, name }];
            });
        });

        // Handle signaling
        socket.on('signal', async ({ sender, data }) => {
            let pc = peerConnections.current[sender];
            if (!pc) {
                // Defensive: create if missing
                const peerName = participants.find(p => p.id === sender)?.name || sender;
                pc = createPeerConnection(sender, peerName, false);
            }
            if (data.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('signal', { roomId: groupId, data: { type: 'answer', answer, to: sender } });
            } else if (data.type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            } else if (data.type === 'candidate') {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        });

        // User left
        socket.on('user-left', (userId) => {
            if (peerConnections.current[userId]) {
                peerConnections.current[userId].close();
                delete peerConnections.current[userId];
            }
            setPeerStreams(prev => prev.filter(p => p.id !== userId));
            setParticipants(prev => prev.filter(p => p.id !== userId));
        });

        return () => {
            socket.off('participants');
            socket.off('user-joined');
            socket.off('announce');
            socket.off('signal');
            socket.off('user-left');
        };
    }, [joined, groupId, userName, participants]);

    // Create peer connection
    function createPeerConnection(peerId, peerName, isInitiator) {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        peerConnections.current[peerId] = pc;

        // Add local tracks
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current));
        }

        // ICE
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('signal', { roomId: groupId, data: { type: 'candidate', candidate: event.candidate, to: peerId } });
            }
        };

        // Track
        pc.ontrack = (event) => {
            setPeerStreams(prev => {
                // Only add if not already present
                if (prev.some(p => p.id === peerId)) return prev.map(p => p.id === peerId ? { ...p, stream: event.streams[0] } : p);
                return [...prev, { id: peerId, name: peerName, stream: event.streams[0] }];
            });
        };

        // Offer/Answer
        if (isInitiator) {
            pc.onnegotiationneeded = async () => {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socketRef.current.emit('signal', { roomId: groupId, data: { type: 'offer', offer, to: peerId } });
                } catch (e) { /* ignore */ }
            };
        }
        return pc;
    }

    // Toggle mic/cam
    const toggleMic = async () => {
        if (!localStream.current) return;
        if (micOn) {
            localStream.current.getAudioTracks().forEach(track => {
                track.stop();
                localStream.current.removeTrack(track);
                Object.values(peerConnections.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
                    if (sender) pc.removeTrack(sender);
                });
            });
            setMicOn(false);
        } else {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.getAudioTracks().forEach(track => {
                localStream.current.addTrack(track);
                Object.values(peerConnections.current).forEach(pc => {
                    pc.addTrack(track, localStream.current);
                });
            });
            setMicOn(true);
        }
    };

    const toggleCam = async () => {
        if (!localStream.current) return;
        if (camOn) {
            localStream.current.getVideoTracks().forEach(track => {
                track.stop();
                localStream.current.removeTrack(track);
                Object.values(peerConnections.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) pc.removeTrack(sender);
                });
            });
            setCamOn(false);
        } else {
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoStream.getVideoTracks().forEach(track => {
                localStream.current.addTrack(track);
                Object.values(peerConnections.current).forEach(pc => {
                    pc.addTrack(track, localStream.current);
                });
            });
            setCamOn(true);
        }
    };

    // Leave meeting
    const leaveMeeting = () => {
        setLeaving(true);
        Object.values(peerConnections.current).forEach(pc => pc.close());
        peerConnections.current = {};
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
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
        <div>
            <h2>Meeting Room: {groupId}</h2>
            {!joined ? (
                <button onClick={joinRoom}>Join Meeting</button>
            ) : (
                <div>
                    <video ref={localVideoRef} autoPlay muted playsInline style={{ width: 240, border: '2px solid #1976d2', borderRadius: 8 }} />
                    <div>
                        <button onClick={toggleMic}>{micOn ? 'Mute Mic' : 'Unmute Mic'}</button>
                        <button onClick={toggleCam}>{camOn ? 'Turn Off Camera' : 'Turn On Camera'}</button>
                        <button onClick={leaveMeeting} disabled={leaving} style={{ marginLeft: 12, background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', fontWeight: 600 }}>
                            {leaving ? 'Leaving...' : 'Leave Meeting'}
                        </button>
                    </div>
                    <h3>Participants</h3>
                    <ul style={{ marginBottom: 12 }}>
                        {participants.map(p => (
                            <li key={p.id} style={{ fontWeight: p.id === socketRef.current.id ? 700 : 400 }}>
                                {p.id === socketRef.current.id ? 'You' : p.name}
                            </li>
                        ))}
                    </ul>
                    <div style={{ display: 'flex', gap: 16 }}>
                        {peerStreams.map(p => (
                            <div key={p.id} style={{ position: 'relative' }}>
                                <video
                                    autoPlay
                                    playsInline
                                    ref={el => { if (el) el.srcObject = p.stream; }}
                                    style={{ width: 180, border: '1px solid #888', borderRadius: 8, background: '#000' }}
                                    onLoadedMetadata={e => { if (!p.stream.getVideoTracks().length) e.target.style.background = '#000'; }}
                                />
                                {/* Black overlay if no video track */}
                                {!p.stream.getVideoTracks().length && (
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#000' }} />
                                )}
                                <div style={{ position: 'absolute', bottom: 4, left: 4, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{p.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingRoom; 
