import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { Peer } from 'peerjs';
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
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const peerRef = useRef(null);
  const callRef = useRef(null);
  const groupPeersRef = useRef({}); // For group calls: userId -> PeerJS call
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Initialize PeerJS globally
  useEffect(() => {
    if (!user) return;
    if (peerRef.current) return;

    console.log('Initializing global PeerJS for user:', user.uid);
    
    // Create a unique peer ID for this user
    const peerId = `user-${user.uid}-${Date.now()}`;
    
    // Clean up host URL - remove protocol if present
    const host = (import.meta.env.VITE_PEER_SERVER_HOST || 'studysync-enqu.onrender.com').replace(/^https?:\/\//, '');
    
    peerRef.current = new Peer(peerId, {
      host: host,
      port: import.meta.env.VITE_PEER_SERVER_PORT || 443, // Use standard HTTPS port
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
      console.log('✅ Global PeerJS connected with ID:', id);
      setConnectionStatus('connected');
    });

    peerRef.current.on('error', (error) => {
      console.error('❌ Global PeerJS error:', error);
      setConnectionStatus('error');
      
      // Handle specific error types
      if (error.type === 'peer-unavailable') {
        console.log('⚠️ Peer is unavailable');
      } else if (error.type === 'network') {
        console.log('⚠️ Network error, attempting to reconnect...');
        // Try to reconnect after a delay
        setTimeout(() => {
          if (peerRef.current) {
            peerRef.current.reconnect();
          }
        }, 5000);
      } else if (error.type === 'server-error') {
        console.log('⚠️ Server error, check if PeerJS server is running');
      }
    });

    peerRef.current.on('disconnected', () => {
      console.log('🔌 Global PeerJS disconnected');
      setConnectionStatus('disconnected');
    });

    // Handle incoming calls
    peerRef.current.on('call', async (call) => {
      console.log('📞 Global incoming call from:', call.peer);
      
      // For 1:1 calls, check if it's from a friend
      if (activeCall && activeCall.type === '1:1' && call.peer.includes(activeCall.friendId)) {
        setIncomingCall({
          from: call.peer,
          fromName: activeCall.friendName,
          groupId: null
        });
        setShowIncomingModal(true);
      }
      // For group calls, check if it's from a group member
      else if (activeCall && activeCall.type === 'group' && call.peer.includes(activeCall.groupId)) {
        // Extract user info from peer ID
        const peerName = call.peer.split('-').slice(1, -1).join('-');
        handleGroupCall(call, peerName);
      }
    });

    return () => {
      if (peerRef.current) {
        console.log('Cleaning up global PeerJS connection');
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [user, activeCall]);

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

  // Handle group call
  const handleGroupCall = (call, peerName) => {
    console.log('🎥 Handling group call from:', peerName);
    
    if (localStream) {
      call.answer(localStream);
      
      call.on('stream', (remoteStream) => {
        console.log('🎥 Received group stream from:', peerName);
        setGroupParticipants(prev => {
          const existing = prev.find(p => p.userId === call.peer);
          if (existing) {
            return prev.map(p => p.userId === call.peer ? { ...p, stream: remoteStream } : p);
          } else {
            return [...prev, { userId: call.peer, displayName: peerName, stream: remoteStream }];
          }
        });
      });
      
      call.on('close', () => {
        console.log('📞 Group call closed with:', peerName);
        setGroupParticipants(prev => prev.filter(p => p.userId !== call.peer));
      });
      
      call.on('error', (error) => {
        console.error('❌ Group call error with:', peerName, error);
        setGroupParticipants(prev => prev.filter(p => p.userId !== call.peer));
      });
      
      groupPeersRef.current[call.peer] = call;
    }
  };

  // Start 1:1 call
  const startCall = async (friendId, friendName, groupId = null, groupName = null) => {
    if (!localStream) {
      const stream = await setupMediaStream();
      if (!stream) return;
    }

    const callType = groupId ? 'group' : '1:1';
    setActiveCall({
      type: callType,
      friendId,
      friendName,
      groupId,
      groupName
    });

    if (callType === '1:1') {
      setCallStatus('calling');
      
      try {
        // Create a peer ID for the friend
        const friendPeerId = `user-${friendId}`;
        
        console.log('📞 Starting 1:1 call to:', friendPeerId);
        const call = peerRef.current.call(friendPeerId, localStream);
        callRef.current = call;
        
        call.on('stream', (remoteStream) => {
          console.log('🎥 Received 1:1 stream from:', friendPeerId);
          setRemoteStream(remoteStream);
          setCallStatus('connected');
        });
        
        call.on('close', () => {
          console.log('📞 1:1 call closed with:', friendPeerId);
          endCall();
        });
        
        call.on('error', (error) => {
          console.error('❌ 1:1 call error with:', friendPeerId, error);
          endCall();
        });
        
      } catch (error) {
        console.error('❌ Error starting 1:1 call:', error);
        setCallStatus('ended');
      }
    } else {
      // Group call - join the group and wait for others
      setCallStatus('connected');
      console.log('🎬 Joined group call:', groupId);
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall || !localStream) return;

    try {
      if (activeCall && activeCall.type === '1:1') {
        // For 1:1 calls, we need to call back the incoming peer
        const call = peerRef.current.call(incomingCall.from, localStream);
        callRef.current = call;
        
        call.on('stream', (remoteStream) => {
          console.log('🎥 Received 1:1 stream from:', incomingCall.from);
          setRemoteStream(remoteStream);
          setCallStatus('connected');
        });
        
        call.on('close', () => {
          console.log('📞 1:1 call closed with:', incomingCall.from);
          endCall();
        });
        
        call.on('error', (error) => {
          console.error('❌ 1:1 call error with:', incomingCall.from, error);
          endCall();
        });
      }
      
      setShowIncomingModal(false);
      setIncomingCall(null);
      
    } catch (error) {
      console.error('❌ Error accepting call:', error);
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    setShowIncomingModal(false);
    setIncomingCall(null);
    setCallStatus('ended');
  };

  // End call
  const endCall = () => {
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    
    // Close all group peer connections
    Object.values(groupPeersRef.current).forEach(call => {
      call.close();
    });
    groupPeersRef.current = {};
    
    setRemoteStream(null);
    setGroupParticipants([]);
    setCallStatus('ended');
    setActiveCall(null);
    setShowIncomingModal(false);
    setIncomingCall(null);
  };

  // Show incoming call notification
  const showIncomingCall = (from, fromName) => {
    console.log('🔔 Showing incoming call notification:', fromName);
    // This could trigger a browser notification or sound
  };

  // Get pending call
  const getPendingCall = () => {
    return incomingCall;
  };

  // Clear pending call
  const clearPendingCall = () => {
    setIncomingCall(null);
  };

  const value = {
    // State
    activeCall,
    localStream,
    remoteStream,
    groupParticipants,
    callStatus,
    connectionStatus,
    incomingCall,
    showIncomingModal,
    localVideoRef,
    remoteVideoRef,
    
    // Actions
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    showIncomingCall,
    getPendingCall,
    clearPendingCall,
    setupMediaStream
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
      
      {/* Global Incoming Call Modal */}
      {showIncomingModal && incomingCall && (
        <IncomingCallModal
          fromName={incomingCall.fromName}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}
    </VideoCallContext.Provider>
  );
};

export const useVideoCallContext = () => useContext(VideoCallContext); 