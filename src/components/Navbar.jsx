import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FaUser } from "react-icons/fa";
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css'; // Add CSS as provided below

const shake = {
  x: [0, -8, 8, -6, 6, -4, 4, 0],
  transition: { duration: 0.4, type: 'tween' }
};

const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileBtnRef = useRef();
  const profilePopoverRef = useRef();

  useEffect(() => {
    if (!profileOpen) return;
    function handleClick(e) {
      if (
        profileBtnRef.current && profileBtnRef.current.contains(e.target)
      ) return;
      if (
        profilePopoverRef.current && profilePopoverRef.current.contains(e.target)
      ) return;
      setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  return (
    <nav className="app-navbar">
      <div className="navbar-left">
        <div className="app-navbar-title">
          {/* <div className="app-navbar-logo" /> */}
          StudySync
        </div>
      </div>
      <div className="navbar-right">
        <NavLink
          className={({ isActive }) => "app-navbar-link" + (isActive ? " active" : "")}
          to={user ? "/dashboard" : "#"}
          onClick={e => {
            if (!user && !loading) {
              e.preventDefault();
              navigate('/login');
            }
          }}
        >
          Dashboard
        </NavLink>

        <NavLink
          className={({ isActive }) => "app-navbar-link" + (isActive ? " active" : "")}
          to={user ? "/group" : "#"}
          onClick={e => {
            if (!user && !loading) {
              e.preventDefault();
              navigate('/login');
            }
          }}
        >
          Group
        </NavLink>

        {loading ? null : user ? (
          <>
            <NavLink className={({ isActive }) => "app-navbar-link" + (isActive ? " active" : "")} to="/your-summaries">
              Your Summaries
            </NavLink>

            <NavLink className={({ isActive }) => "app-navbar-link" + (isActive ? " active" : "")} to="/friends">
              Friends
            </NavLink>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: 8 }}>
              <button
                ref={profileBtnRef}
                onClick={() => setProfileOpen(v => !v)}
                className="profile-button"
                aria-label="Profile"
              >
                <FaUser />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    ref={profilePopoverRef}
                    initial={{ opacity: 0, y: -16, scale: 0.7, rotate: -8 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, y: -16, scale: 0.7, rotate: 8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="profile-popover"
                    whileHover={{ scale: 1.04, rotate: 2 }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.08, background: '#e3eafc' }}
                      className="popover-button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/profile');
                      }}
                    >
                      View Profile
                    </motion.button>

                    <motion.button
                      whileHover={{ ...shake, background: '#ffeaea' }}
                      className="popover-button logout-button"
                      onClick={async () => {
                        setProfileOpen(false);
                        await logout();
                        navigate('/');
                      }}
                    >
                      Logout
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <NavLink className={({ isActive }) => "app-navbar-link" + (isActive ? " active" : "")} to="/login">
            Login
          </NavLink>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
