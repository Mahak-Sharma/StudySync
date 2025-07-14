import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import IncomingCallModal from '../components/VideoCall/IncomingCallModal';
import MeetingRoom from '../components/MeetingRoom';

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
  const [showJoinMeeting, setShowJoinMeeting] = useState(false); // default to false for persistent button
  const [meetingGroupId, setMeetingGroupId] = useState('');
  const [meetingUserName, setMeetingUserName] = useState('');
  const [joinedMeeting, setJoinedMeeting] = useState(false);

  const peerConnectionRef = useRef(null);
  const groupPeersRef = useRef({}); // For group calls: userId -> RTCPeerConnection
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ]
  };

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
      if (event.candidate) {
        // This part of the logic needs to be re-evaluated as socket.io is removed.
        // For now, we'll just log the candidate.
        console.log('ICE candidate received:', event.candidate);
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

      // This part of the logic needs to be re-evaluated as socket.io is removed.
      // For now, we'll just log the answer.
      console.log('Answer created and set for 1:1 call:', answer);
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
      if (event.candidate) {
        // This part of the logic needs to be re-evaluated as socket.io is removed.
        // For now, we'll just log the candidate.
        console.log('Group ICE candidate received from:', peerId, event.candidate);
      }
    };

    // Initiator creates offer
    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          // This part of the logic needs to be re-evaluated as socket.io is removed.
          // For now, we'll just log the offer.
          console.log('Group offer created and set for:', peerId, offer);
        } catch (e) {
          console.error('Error creating group offer:', e);
        }
      };
    }
  };

  // Start outgoing call
  const startCall = async (friendId, friendName, groupId = null, groupName = null) => {
    console.log('Starting call:', { friendId, friendName, groupId, groupName });
    if (!user) return;

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
      // This part of the logic needs to be re-evaluated as socket.io is removed.
      // For now, we'll just log the join.
      console.log('Joining group call room:', groupId);
    } else {
      // 1:1 call - create peer connection for outgoing call
      createPeerConnection(stream);
      // This part of the logic needs to be re-evaluated as socket.io is removed.
      // For now, we'll just log the call request.
      console.log('Sending 1:1 call request to:', friendId);
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    console.log('Accepting incoming call:', incomingCall);
    if (!incomingCall || !user) return;

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

    // This part of the logic needs to be re-evaluated as socket.io is removed.
    // For now, we'll just log the accept.
    console.log('Accepting call from:', incomingCall.from);

    createPeerConnection(stream);

    // Create and send offer
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      // This part of the logic needs to be re-evaluated as socket.io is removed.
      // For now, we'll just log the offer.
      console.log('Sending 1:1 offer to:', incomingCall.from, offer);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (!incomingCall || !user) return;

    // This part of the logic needs to be re-evaluated as socket.io is removed.
    // For now, we'll just log the reject.
    console.log('Rejecting call from:', incomingCall.from);

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

    // This part of the logic needs to be re-evaluated as socket.io is removed.
    // For now, we'll just log the end.
    console.log('Ending call.');
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

  // Persistent Join Meeting button
  const joinMeetingButton = !joinedMeeting && !showJoinMeeting ? (
    <button
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 1000,
        padding: '10px 24px',
        fontSize: 16,
        background: '#1976d2',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
      }}
      onClick={() => setShowJoinMeeting(true)}
    >
      Join Meeting
    </button>
  ) : null;

  // UI for joining a meeting
  if (showJoinMeeting && !joinedMeeting) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
        {joinMeetingButton}
        <h2>Join a Meeting</h2>
        <input
          type="text"
          placeholder="Group ID"
          value={meetingGroupId}
          onChange={e => setMeetingGroupId(e.target.value)}
          style={{ marginBottom: 10, padding: 8, fontSize: 16 }}
        />
        <input
          type="text"
          placeholder="Your Name"
          value={meetingUserName}
          onChange={e => setMeetingUserName(e.target.value)}
          style={{ marginBottom: 10, padding: 8, fontSize: 16 }}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => {
              if (meetingGroupId && meetingUserName) {
                setJoinedMeeting(true);
                setShowJoinMeeting(false);
              }
            }}
            style={{ padding: '8px 24px', fontSize: 16 }}
          >
            Join Meeting
          </button>
          <button
            onClick={() => setShowJoinMeeting(false)}
            style={{ padding: '8px 24px', fontSize: 16, background: '#eee', color: '#333', border: '1px solid #ccc' }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Render MeetingRoom after joining
  if (joinedMeeting) {
    return <MeetingRoom groupId={meetingGroupId} userName={meetingUserName} />;
  }

  return (
    <>
      {joinMeetingButton}
      <VideoCallContext.Provider value={{
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
    </>
  );
};

export const useVideoCallContext = () => useContext(VideoCallContext); 