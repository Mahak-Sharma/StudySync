import React, { useEffect } from 'react';
import { useVideoCallContext } from '../../contexts/VideoCallContext';
import './VideoCall.css';

const GlobalVideoCall = () => {
  const {
    activeCall,
    localStream,
    remoteStream,
    groupParticipants,
    callStatus,
    endCall,
    localVideoRef,
    remoteVideoRef
  } = useVideoCallContext();

  // Ensure local video always gets the stream (mirror effect)
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play?.();
    }
  }, [localStream, localVideoRef]);

  // Ensure remote video always gets the stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log('Setting remote video stream in GlobalVideoCall:', remoteStream);
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(e => console.error('Error playing remote video:', e));
    }
  }, [remoteStream, remoteVideoRef]);

  if (!activeCall) return null;

  const getCallTitle = () => {
    if (activeCall.type === 'group') {
      return `Group Call: ${activeCall.groupName || activeCall.groupId}`;
    }
    return `Video Call with ${activeCall.friendName}`;
  };

  // Handle both 1:1 and group calls

  return (
    <div className="video-call-overlay">
      <div className="video-call-container">
        <div className="video-call-header">
          <h3>{getCallTitle()}</h3>
          <button className="close-btn" onClick={endCall}>×</button>
        </div>

        <div className="video-call-content">
          <div className="video-grid">
            {activeCall.type === '1:1' ? (
              // 1:1 call layout
              <>
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
                      <p>Waiting for {activeCall.friendName} to join...</p>
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
              </>
            ) : (
              // Group call layout
              <>
                <div className="group-video-grid">
                  {groupParticipants.length > 0 ? (
                    groupParticipants.map((participant, index) => (
                      <div key={participant.userId} className="participant-video-container">
                        {participant.stream ? (
                          <video
                            autoPlay
                            playsInline
                            className="participant-video"
                            ref={(el) => {
                              if (el) {
                                el.srcObject = participant.stream;
                                el.play().catch(e => console.error('Error playing participant video:', e));
                              }
                            }}
                          />
                        ) : (
                          <div className="no-video">
                            <p>{participant.displayName}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="no-video">
                      <p>Waiting for others to join...</p>
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
              </>
            )}
          </div>

          <div className="call-controls">
            {callStatus === 'calling' && (
              <div className="calling-status">
                <p>Calling {activeCall.friendName}...</p>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalVideoCall; 