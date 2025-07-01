import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaFileAlt, FaComments, FaListAlt, FaRobot } from 'react-icons/fa';

const features = [
  { icon: FaUsers, label: "Groups", path: "/group" },
  { icon: FaFileAlt, label: "Files", path: "/group" },
  { icon: FaComments, label: "Chat", path: "/group" },
  { icon: FaListAlt, label: "Todo", path: "/group" },
  { icon: FaRobot, label: "Chatbot", path: "/group" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Welcome to StudySync!</h1>
      <h2 className="dashboard-subtitle">Your all-in-one platform for collaborative group study.</h2>
      <div className="dashboard-features">
        {features.map((feature, idx) => (
          <div className="dashboard-feature" key={idx}>
            <div className="dashboard-feature-icon">
              <feature.icon />
            </div>
            <button className="dashboard-feature-button" onClick={() => navigate(feature.path)}>{feature.label}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard; 