import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const SERVER_URL = 'http://localhost:5001'; // Change to your backend IP for cross-device

const MeetingRoom = ({ groupId, userName }) => {
    const [joined, setJoined] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [peers, setPeers] = useState([]);
    const localVideoRef = useRef();
    const socketRef = useRef();
    const peerConnections = useRef({});
    const localStream = useRef();

    useEffect(() => {
        socketRef.current = io(SERVER_URL);
        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    const joinRoom = async () => {
        localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = localStream.current;
        socketRef.current.emit('join-room', groupId);
        setJoined(true);
    };

    // Handle signaling
    useEffect(() => {
        if (!joined) return;
        const socket = socketRef.current;
        socket.on('user-joined', handleUserJoined);
        socket.on('signal', handleSignal);
        socket.on('user-left', handleUserLeft);
        return () => {
            socket.off('user-joined', handleUserJoined);
            socket.off('signal', handleSignal);
            socket.off('user-left', handleUserLeft);
        };
        // eslint-disable-next-line
    }, [joined]);

    const handleUserJoined = async (userId) => {
        const pc = createPeerConnection(userId);
        peerConnections.current[userId] = pc;
        localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current.emit('signal', { roomId: groupId, data: { type: 'offer', offer, to: userId } });
    };

    const handleSignal = async ({ sender, data }) => {
        let pc = peerConnections.current[sender];
        if (!pc) {
            pc = createPeerConnection(sender);
            peerConnections.current[sender] = pc;
            localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current));
        }
        if (data.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socketRef.current.emit('signal', { roomId: groupId, data: { type: 'answer', answer, to: sender } });
        } else if (data.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } else if (data.type === 'candidate') {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    };

    const handleUserLeft = (userId) => {
        if (peerConnections.current[userId]) {
            peerConnections.current[userId].close();
            delete peerConnections.current[userId];
        }
        setPeers(peers => peers.filter(p => p.userId !== userId));
    };

    const createPeerConnection = (userId) => {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('signal', { roomId: groupId, data: { type: 'candidate', candidate: event.candidate, to: userId } });
            }
        };
        pc.ontrack = (event) => {
            setPeers(peers => {
                if (peers.find(p => p.userId === userId)) return peers;
                return [...peers, { userId, stream: event.streams[0] }];
            });
        };
        return pc;
    };

    const toggleMic = () => {
        localStream.current.getAudioTracks().forEach(track => {
            track.enabled = !micOn;
        });
        setMicOn(m => !m);
    };

    const toggleCam = () => {
        localStream.current.getVideoTracks().forEach(track => {
            track.enabled = !camOn;
        });
        setCamOn(c => !c);
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
                    </div>
                    <h3>Participants</h3>
                    <div style={{ display: 'flex', gap: 16 }}>
                        {peers.map(p => (
                            <video key={p.userId} autoPlay playsInline ref={el => { if (el) el.srcObject = p.stream; }} style={{ width: 180, border: '1px solid #888', borderRadius: 8 }} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingRoom; 