import React, { useState } from "react";
import './CreateGroupModal.css';
import { db } from '../../api/firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, setDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { create100msRoom } from '../../api/api';

const CreateGroupModal = ({ open, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [createdGroupId, setCreatedGroupId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const handleCreate = async () => {
    setError("");
    if (groupName.trim() && user) {
      setLoading(true);
      try {
        // 1. Create 100ms room
        const roomCode = await create100msRoom(groupName);
        if (!roomCode) throw new Error('Failed to get 100ms room code');
        // 2. Create group in Firestore with roomCode
        const docRef = await addDoc(collection(db, "groups"), {
          name: groupName,
          members: [user.uid],
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          roomCode // Save 100ms room code
        });
        setCreatedGroupId(docRef.id);
        setGroupName("");
        // Add group to user's document as { id, name }
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { groups: arrayUnion({ id: docRef.id, name: groupName }) }, { merge: true });
      } catch (err) {
        setError("Error creating group: " + err.message);
      }
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="create-group-modal-overlay">
      <div className="create-group-modal-container">
        <h3 className="create-group-modal-title">Create New Group</h3>
        {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
        {createdGroupId ? (
          <>
            <div style={{ margin: '16px 0', color: '#1976d2', fontWeight: 600 }}>
              Group created!<br />
              <span style={{ fontSize: '1.1em' }}>Group ID: {createdGroupId}</span>
            </div>
            <button className="create-group-modal-create" onClick={() => { setCreatedGroupId(""); onClose(); }}>Close</button>
          </>
        ) : (
          <>
            <input
              className="create-group-modal-input"
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              autoFocus
            />
            <div className="create-group-modal-actions">
              <button className="create-group-modal-cancel" onClick={onClose}>Cancel</button>
              <button className="create-group-modal-create" onClick={handleCreate} disabled={loading}>
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateGroupModal; 