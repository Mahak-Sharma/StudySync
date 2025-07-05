import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';
import IncomingCallModal from '../components/VideoCall/IncomingCallModal';

const VideoCallContext = createContext();

export const VideoCallProvider = ({ children }) => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState(null); // { from, fromName, groupId }
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [activeCall, setActiveCall] = useState(null); // { type: '1:1' | 'group', friendId, friendName, groupId, groupName }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [groupParticipants, setGroupParticipants] = useState([]); // For group calls: [{ userId, displayName, stream }]
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected, ended

  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const groupPeersRef = useRef({}); // For group calls: userId -> RTCPeerConnection
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Connect to socket server globally
  useEffect(() => {
    if (!user) return;
    if (socketRef.current) return;
    
    socketRef.current = io('http://localhost:5002');
    socketRef.current.on('connect', () => {
      socketRef.current.emit('user-ready', {
        username: user.uid,
        displayName: user.displayName || user.email
      });
    });

    // Listen for incoming calls
    socketRef.current.on('call-request', (data) => {
      console.log('Global incoming call:', data);
      setIncomingCall({ 
        from: data.from, 
        fromName: data.fromName,
        groupId: data.groupId 
      });
      setShowIncomingModal(true);
    });

    // Handle call accepted
    socketRef.current.on('call-accepted', (data) => {
      if (activeCall && data.from === activeCall.friendId) {
        setCallStatus('connected');
        createPeerConnection();
      }
    });

    // Handle call rejected
    socketRef.current.on('call-rejected', (data) => {
      if (activeCall && data.from === activeCall.friendId) {
        setCallStatus('ended');
        setActiveCall(null);
      }
    });

    // Handle offers
    socketRef.current.on('offer', (data) => {
      console.log('Received offer from:', data.from, 'for active call:', activeCall);
      if (activeCall && data.from === activeCall.friendId) {
        handleOffer(data.offer);
      }
    });

    // Handle answers
    socketRef.current.on('answer', (data) => {
      console.log('Received answer from:', data.from, 'for active call:', activeCall);
      if (activeCall && data.from === activeCall.friendId && peerConnectionRef.current) {
        handleAnswer(data.answer);
      }
    });

    // Handle ICE candidates
    socketRef.current.on('ice-candidate', (data) => {
      if (activeCall && data.from === activeCall.friendId && peerConnectionRef.current) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    // Group call events
    socketRef.current.on('user-joined-room', async ({ userId, displayName }) => {
      if (activeCall && activeCall.type === 'group' && userId !== user.uid) {
        console.log('User joined group call:', userId, displayName);
        createGroupPeerConnection(userId, displayName, true);
      }
    });

    socketRef.current.on('user-left-room', ({ userId }) => {
      if (activeCall && activeCall.type === 'group') {
        console.log('User left group call:', userId);
        if (groupPeersRef.current[userId]) {
          groupPeersRef.current[userId].close();
          delete groupPeersRef.current[userId];
        }
        setGroupParticipants(prev => prev.filter(p => p.userId !== userId));
      }
    });

    socketRef.current.on('group-offer', async ({ from, offer }) => {
      if (activeCall && activeCall.type === 'group' && from !== user.uid) {
        console.log('Received group offer from:', from);
        if (!groupPeersRef.current[from]) {
          createGroupPeerConnection(from, 'Unknown', false);
        }
        await groupPeersRef.current[from].setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await groupPeersRef.current[from].createAnswer();
        await groupPeersRef.current[from].setLocalDescription(answer);
        socketRef.current.emit('group-answer', {
          roomId: activeCall.groupId,
          from: user.uid,
          answer
        });
      }
    });

    socketRef.current.on('group-answer', async ({ from, answer }) => {
      if (activeCall && activeCall.type === 'group' && from !== user.uid) {
        console.log('Received group answer from:', from);
        if (groupPeersRef.current[from]) {
          await groupPeersRef.current[from].setRemoteDescription(new RTCSessionDescription(answer));
        }
      }
    });

    socketRef.current.on('group-ice-candidate', async ({ from, candidate }) => {
      if (activeCall && activeCall.type === 'group' && from !== user.uid) {
        console.log('Received group ICE candidate from:', from);
        if (groupPeersRef.current[from]) {
          try {
            await groupPeersRef.current[from].addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            // ignore
          }
        }
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [user]);

  // Setup media stream
  const setupMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      return null;
    }
  };

  // Create peer connection
  const createPeerConnection = (stream) => {
    console.log('Creating peer connection for 1:1 call');
    peerConnectionRef.current = new RTCPeerConnection(configuration);

    const mediaStream = stream || localStream;
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, mediaStream);
      });
    }

    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote stream in 1:1 call:', event.streams[0]);
      setRemoteStream(event.streams[0]);
    };

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && activeCall) {
        socketRef.current.emit('ice-candidate', {
          to: activeCall.friendId,
          from: user.uid,
          candidate: event.candidate
        });
      }
    };
  };

  // Handle offer
  const handleOffer = async (offer) => {
    try {
      console.log('Handling offer in 1:1 call');
      if (!peerConnectionRef.current) {
        createPeerConnection();
      }
      
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      socketRef.current.emit('answer', {
        to: activeCall.friendId,
        from: user.uid,
        answer: answer
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  // Handle answer
  const handleAnswer = async (answer) => {
    try {
      console.log('Handling answer in 1:1 call');
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  // Create peer connection for group calls
  const createGroupPeerConnection = (peerId, displayName, isInitiator) => {
    const pc = new RTCPeerConnection(configuration);
    groupPeersRef.current[peerId] = pc;

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received group remote stream from:', peerId, event.streams[0]);
      setGroupParticipants(prev => {
        const exists = prev.some(p => p.userId === peerId);
        if (!exists) {
          return [...prev, { userId: peerId, displayName, stream: event.streams[0] }];
        } else {
          return prev.map(p => p.userId === peerId ? { ...p, stream: event.streams[0] } : p);
        }
      });
    };

    // ICE candidate
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && activeCall) {
        socketRef.current.emit('group-ice-candidate', {
          roomId: activeCall.groupId,
          from: user.uid,
          candidate: event.candidate
        });
      }
    };

    // Initiator creates offer
    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (socketRef.current && activeCall) {
            socketRef.current.emit('group-offer', {
              roomId: activeCall.groupId,
              from: user.uid,
              offer
            });
          }
        } catch (e) {
          console.error('Error creating group offer:', e);
        }
      };
    }
  };

  // Start outgoing call
  const startCall = async (friendId, friendName, groupId = null, groupName = null) => {
    console.log('Starting call:', { friendId, friendName, groupId, groupName });
    if (!socketRef.current || !user) return;

    const stream = await setupMediaStream();
    if (!stream) return;

    setActiveCall({
      type: groupId ? 'group' : '1:1',
      friendId,
      friendName,
      groupId,
      groupName
    });
    setCallStatus('calling');

    if (groupId) {
      // Group call - join the room
      socketRef.current.emit('join-room', {
        roomId: groupId,
        userId: user.uid,
        displayName: user.displayName || user.email
      });
    } else {
      // 1:1 call - create peer connection for outgoing call
      createPeerConnection(stream);
      socketRef.current.emit('call-request', {
        to: friendId,
        from: user.uid,
        fromName: user.displayName || user.email,
        groupId
      });
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    console.log('Accepting incoming call:', incomingCall);
    if (!incomingCall || !socketRef.current || !user) return;

    // Clear the notification immediately
    setShowIncomingModal(false);
    setIncomingCall(null);

    const stream = await setupMediaStream();
    if (!stream) return;

    setActiveCall({
      type: incomingCall.groupId ? 'group' : '1:1',
      friendId: incomingCall.from,
      friendName: incomingCall.fromName,
      groupId: incomingCall.groupId
    });
    setCallStatus('connected');

    socketRef.current.emit('call-accepted', {
      to: incomingCall.from,
      from: user.uid
    });

    createPeerConnection(stream);

    // Create and send offer
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
  };

  // Reject incoming call
  const rejectCall = () => {
    if (!incomingCall || !socketRef.current || !user) return;

    socketRef.current.emit('call-rejected', {
      to: incomingCall.from,
      from: user.uid
    });

    setShowIncomingModal(false);
    setIncomingCall(null);
  };

  // End call
  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Close all group peer connections
    Object.values(groupPeersRef.current).forEach(pc => pc.close());
    groupPeersRef.current = {};

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    setRemoteStream(null);
    setGroupParticipants([]);
    setActiveCall(null);
    setCallStatus('idle');

    if (socketRef.current && activeCall) {
      if (activeCall.type === 'group') {
        socketRef.current.emit('leave-room', { 
          roomId: activeCall.groupId, 
          userId: user.uid 
        });
      } else {
        socketRef.current.emit('call-ended', {
          to: activeCall.friendId,
          from: user.uid
        });
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [localStream]);

  return (
    <VideoCallContext.Provider value={{
      socket: socketRef.current,
      activeCall,
      localStream,
      remoteStream,
      groupParticipants,
      callStatus,
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      localVideoRef,
      remoteVideoRef,
      incomingCall,
      showIncomingModal
    }}>
      {children}
      <IncomingCallModal
        open={showIncomingModal}
        callerName={incomingCall?.fromName || 'Unknown'}
        onAccept={acceptCall}
        onReject={rejectCall}
      />
    </VideoCallContext.Provider>
  );
};

export const useVideoCallContext = () => useContext(VideoCallContext); 