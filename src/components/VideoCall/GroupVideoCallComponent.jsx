import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVideoCallContext } from '../../contexts/VideoCallContext';
import './VideoCall.css';

const GroupVideoCallComponent = ({ isOpen, onClose, groupId, groupName }) => {
    const { user } = useAuth();
    const { startCall, activeCall, localStream, groupParticipants, callStatus, endCall } = useVideoCallContext();
    const [error, setError] = useState('');

    const localVideoRef = useRef(null);

    useEffect(() => {
        if (isOpen && user && groupId && !activeCall) {
            // Start group call using global context
            startCall(null, null, groupId, groupName);
        }
        return () => {
            // Cleanup handled by global context
        };
        // eslint-disable-next-line
    }, [isOpen, user, groupId, groupName, startCall, activeCall]);

    // Ensure local video always gets the stream (mirror effect)
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play?.();
        }
    }, [localStream, localVideoRef]);

    if (!isOpen || !activeCall || activeCall.type !== 'group') return null;

    return (
        <div className="video-call-overlay">
            <div className="video-call-container">
                <div className="video-call-header">
                    <h3>Group Video Call: {groupName || groupId}</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="video-call-content">
                    {error && <div className="friends-message" style={{ color: 'red' }}>{error}</div>}
                    
                    {/* Call Status */}
                    <div style={{ textAlign: 'center', marginBottom: 8, color: '#1976d2', fontWeight: 500, fontSize: '1rem' }}>
                        {callStatus === 'calling' && 'Starting group call...'}
                        {callStatus === 'connected' && 'Group call active'}
                        {callStatus === 'ended' && 'Call ended'}
                    </div>

                    {/* Video Grid */}
                    <div className="video-grid" style={{ gridTemplateColumns: `repeat(${Math.max(2, groupParticipants.length + 1)}, 1fr)` }}>
                        {/* Local video */}
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
                            <div style={{ textAlign: 'center', color: '#1976d2', fontWeight: 600, fontSize: '0.95rem', marginTop: 4 }}>
                                {user?.displayName || user?.email || 'You'}
                            </div>
                        </div>

                        {/* Remote participants */}
                        {groupParticipants.map(participant => (
                            <div key={participant.userId} className="remote-video-container">
                                {participant.stream ? (
                                    <video
                                        autoPlay
                                        playsInline
                                        className="remote-video"
                                        srcObject={participant.stream}
                                    />
                                ) : (
                                    <div className="no-video">
                                        <p>Connecting...</p>
                                    </div>
                                )}
                                <div style={{ textAlign: 'center', color: '#1976d2', fontWeight: 600, fontSize: '0.95rem', marginTop: 4 }}>
                                    {participant.displayName || participant.userId}
                                </div>
                            </div>
                        ))}

                        {/* Empty slots for waiting */}
                        {groupParticipants.length === 0 && (
                            <div className="remote-video-container">
                                <div className="no-video">
                                    <p>Waiting for others to join...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="call-controls">
                        {callStatus === 'connected' && (
                            <button className="call-btn end-call" onClick={endCall}>❌ Leave Call</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupVideoCallComponent; 