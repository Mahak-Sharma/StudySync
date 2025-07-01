import React, { useState } from "react";
import './CreateGroupModal.css';

const CreateGroupModal = ({ open, onClose, onCreate }) => {
  const [groupName, setGroupName] = useState("");

  const handleCreate = () => {
    if (groupName.trim()) {
      onCreate(groupName);
      setGroupName("");
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="create-group-modal-overlay">
      <div className="create-group-modal-container">
        <h3 className="create-group-modal-title">Create New Group</h3>
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
          <button className="create-group-modal-create" onClick={handleCreate}>Create</button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal; 