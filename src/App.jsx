import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaComments,
  FaPoll,
  FaQuestionCircle,
  FaFileAlt,
  FaTrophy,
} from "react-icons/fa";
import "./App.css";
import Chatbot from "./components/Chatbot/Chatbot";
import { useAuth } from "./contexts/AuthContext";

const features = [
  {
    icon: <FaUsers size={40} color="#1976d2" />,
    title: "Create & Join Groups",
    desc: "Study together with friends in private or public groups.",
  },
  {
    icon: <FaComments size={40} color="#1976d2" />,
    title: "Real-time Chat",
    desc: "Discuss topics, share ideas, and stay connected.",
  },
  {
    icon: <FaPoll size={40} color="#1976d2" />,
    title: "Live Polls",
    desc: "Engage your group with instant polls and voting.",
  },
  {
    icon: <FaQuestionCircle size={40} color="#1976d2" />,
    title: "Quizzes",
    desc: "Test your knowledge with group quizzes and challenges.",
  },
  {
    icon: <FaFileAlt size={40} color="#1976d2" />,
    title: "File Sharing",
    desc: "Upload and share study materials and notes.",
  },
  {
    icon: <FaTrophy size={40} color="#1976d2" />,
    title: "Leaderboard",
    desc: "Track your progress and compete with friends.",
  },
];

function App() {
  // Duplicate features for seamless carousel
  const carouselFeatures = [...features, ...features];
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="app-root">
      {/* Navigation Bar */}
      <nav className="app-navbar">
        <div className="app-navbar-content">
          <div className="app-navbar-title">
            <div className="app-navbar-logo"></div>
            StudySync
          </div>
          <NavLink
            className={({ isActive }) =>
              "app-navbar-link" + (isActive ? " active" : "")
            }
            to="/dashboard"
          >
            Dashboard
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              "app-navbar-link" + (isActive ? " active" : "")
            }
            to="/group"
          >
            Group
          </NavLink>
          {loading ? null : user ? (
            <>
              <NavLink
                className={({ isActive }) =>
                  "app-navbar-link" + (isActive ? " active" : "")
                }
                to="/profile"
              >
                Profile
              </NavLink>
              <NavLink
                className={({ isActive }) =>
                  "app-navbar-link" + (isActive ? " active" : "")
                }
                to="/your-summaries"
              >
                Your Summaries
              </NavLink>
              <NavLink
                className={({ isActive }) =>
                  "app-navbar-link" + (isActive ? " active" : "")
                }
                to="/friends"
              >
                Friends
              </NavLink>
              <button
                className="app-navbar-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976d2', fontWeight: 600, fontSize: '1em', marginLeft: 12 }}
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink
              className={({ isActive }) =>
                "app-navbar-link" + (isActive ? " active" : "")
              }
              to="/login"
            >
              Login
            </NavLink>
          )}
        </div>
      </nav>
      {/* Hero Section */}
      <header className="app-hero">
        <div className="app-hero-content">
          <h1 className="app-hero-title">StudySync</h1>
          <h2 className="app-hero-subtitle">
            The ultimate platform for collaborative group study. Connect, learn,
            and grow together with friends!
          </h2>
          <button
            className="app-hero-button"
            onClick={() => {
              if (loading) return;
              if (user) {
                navigate("/dashboard");
              } else {
                navigate("/login");
              }
            }}
          >
            Get Started
          </button>
        </div>
      </header>
      {/* Features Carousel Section */}
      <section className="app-features-section">
        <h2 className="app-features-title">Features</h2>
        <div className="app-features-carousel">
          <div className="app-features-carousel-track">
            {carouselFeatures.map((feature, idx) => (
              <div className="app-feature-card" key={idx}>
                <div className="app-feature-icon">{feature.icon}</div>
                <h3 className="app-feature-title">{feature.title}</h3>
                <p className="app-feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1000 }}>
        <Chatbot />
      </div>
    </div>
  );
}

export default App;
