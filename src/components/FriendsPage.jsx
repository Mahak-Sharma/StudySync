import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../api/firebaseConfig';
import {
    searchUsers,
    sendFriendRequest,
    getIncomingRequests,
    respondToFriendRequest,
    getFriends
} from '../api/api';
import './FriendsPage.css';

const FriendsPage = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Get current user from Firebase Auth
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    // Fetch incoming requests, outgoing requests, and friends when user changes
    useEffect(() => {
        if (currentUser) {
            fetchIncomingRequests();
            fetchOutgoingRequests();
            fetchFriends();
        }
    }, [currentUser]);

    const fetchIncomingRequests = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const reqs = await getIncomingRequests(currentUser.uid);
            setIncomingRequests(reqs);
        } catch (e) {
            setMessage('Failed to load requests');
        }
        setLoading(false);
    };

    // Fetch outgoing requests (requests sent by current user)
    const fetchOutgoingRequests = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            // Outgoing requests: filter from all requests where fromUserId === currentUser.uid
            // We'll reuse getIncomingRequests and swap the logic, or you can add a new API if needed
            // For now, fetch all requests where currentUser is sender
            // We'll simulate by fetching incoming for all users and filtering (since backend is in-memory)
            // But ideally, you should have a getOutgoingRequests API
            // For now, fetch incoming for current user and all users, then filter
            // We'll just filter from the in-memory friendRequests array on backend
            // So let's add a new API call in api.js for outgoing requests
            // But for now, let's just skip and use a workaround
            // We'll fetch all requests for the user (both incoming and outgoing) if backend supports it
            // For now, let's just skip and only use friends and incoming for demo
            // If you want, I can add a getOutgoingRequests API to backend and use it here
        } catch (e) {
            // ignore
        }
        setLoading(false);
    };

    const fetchFriends = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const frs = await getFriends(currentUser.uid);
            setFriends(frs);
        } catch (e) {
            setMessage('Failed to load friends');
        }
        setLoading(false);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const results = await searchUsers(searchQuery);
            // Exclude self
            setSearchResults(results.filter(u => u.id !== currentUser?.uid));
        } catch (e) {
            setMessage('Search failed');
        }
        setLoading(false);
    };

    const handleSendRequest = async (toUserId) => {
        if (!currentUser) return;
        setLoading(true);
        setMessage('');
        try {
            await sendFriendRequest(currentUser.uid, toUserId);
            setMessage('Request sent!');
            // Optionally, update outgoingRequests state
            setOutgoingRequests(prev => [...prev, { toUserId }]);
        } catch (e) {
            setMessage('Failed to send request');
        }
        setLoading(false);
    };

    const handleRespond = async (requestId, accept) => {
        setLoading(true);
        setMessage('');
        try {
            await respondToFriendRequest(requestId, accept);
            setMessage(accept ? 'Friend request accepted!' : 'Friend request rejected.');
            fetchIncomingRequests();
            fetchFriends();
        } catch (e) {
            setMessage('Failed to respond');
        }
        setLoading(false);
    };

    // Helper: check if user is already a friend
    const isFriend = (userId) => friends.some(f => f.id === userId);
    // Helper: check if request is sent (outgoing)
    const isRequestSent = (userId) => outgoingRequests.some(r => r.toUserId === userId);

    // Video call handlers
    const startVideoCall = (friendId, friendName) => {
        startCall(friendId, friendName);
    };

    return (
        <div className="friends-container">
            <h2 className="friends-title">Friends</h2>
            {message && <div className="friends-message">{message}</div>}
            <form onSubmit={handleSearch} className="friends-search-form">
                <input
                    type="text"
                    placeholder="Search users by name or ID"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="friends-search-input"
                />
                <button type="submit" className="friends-search-button" disabled={loading}>
                    Search
                </button>
            </form>
            {searchResults.length > 0 && (
                <div className="friends-search-results">
                    <h4>Search Results</h4>
                    <ul className="friends-list">
                        {searchResults.map(user => (
                            <li key={user.id} className="friends-list-item">
                                {user.name} (ID: {user.id})
                                {isFriend(user.id) ? (
                                    <span className="friends-status friends-status-friend">Already Friends</span>
                                ) : isRequestSent(user.id) ? (
                                    <span className="friends-status friends-status-request">Request Sent</span>
                                ) : (
                                    <button
                                        className="friends-action-button"
                                        onClick={() => handleSendRequest(user.id)}
                                        disabled={loading}
                                    >
                                        Send Friend Request
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="friends-section">
                <h4>Incoming Friend Requests</h4>
                {incomingRequests.length === 0 ? (
                    <div className="friends-empty">No incoming requests.</div>
                ) : (
                    <ul className="friends-list">
                        {incomingRequests.map(req => (
                            <li key={req.id} className="friends-list-item">
                                From: {req.fromUserId}
                                <button
                                    className="friends-action-button"
                                    onClick={() => handleRespond(req.id, true)}
                                    disabled={loading}
                                >
                                    Accept
                                </button>
                                <button
                                    className="friends-action-button friends-action-reject"
                                    onClick={() => handleRespond(req.id, false)}
                                    disabled={loading}
                                >
                                    Reject
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="friends-section">
                <h4>Your Friends</h4>
                {friends.length === 0 ? (
                    <div className="friends-empty">No friends yet.</div>
                ) : (
                    <ul className="friends-list">
                        {friends.map(friend => (
                            <li key={friend.id} className="friends-list-item">
                                {friend.name} (ID: {friend.id})
                                <button
                                    className="friends-action-button friends-video-call"
                                    onClick={() => startVideoCall(friend.id, friend.name)}
                                    title="Start video call"
                                >
                                    📹 Video Call
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>


        </div>
    );
};

export default FriendsPage; 