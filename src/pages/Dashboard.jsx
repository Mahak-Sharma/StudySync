import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaFileAlt, FaComments, FaListAlt } from 'react-icons/fa';
import React, { useState } from 'react';
import CreateGroupModal from '../components/Groups/CreateGroupModal';

const features = [
  { icon: FaUsers, label: "Groups", path: "/group" },
  { icon: FaFileAlt, label: "Files", path: "/files" },
  { icon: FaComments, label: "Chat", path: "/chat" },
  { icon: FaListAlt, label: "Todo", path: "/todo" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Welcome to StudySync!</h1>
      <h2 className="dashboard-subtitle">Your all-in-one platform for collaborative group study.</h2>
      <button
        className="dashboard-create-group-btn"
        style={{ margin: '18px 0', padding: '12px 28px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1.08rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)' }}
        onClick={() => setShowCreateGroup(true)}
      >
        + Create Group
      </button>
      <div className="dashboard-features">
        {features.map((feature, idx) => (
          <div
            className="dashboard-feature"
            key={idx}
            onClick={() => navigate(feature.path)}
            style={{ cursor: 'pointer' }}
          >
            <div className="dashboard-feature-icon">
              <feature.icon />
            </div>
            <div className="dashboard-feature-label">{feature.label}</div>
          </div>
        ))}
      </div>
      <CreateGroupModal open={showCreateGroup} onClose={() => setShowCreateGroup(false)} />
    </div>
  );
};

export default Dashboard; 