import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import App from './App.jsx';
import Dashboard from './pages/Dashboard';
import GroupPage from './pages/GroupPage';
import Profile from './pages/Profile';
import SignupForm from './components/Auth/SignupForm';
import LoginForm from './components/Auth/LoginForm';
import { AuthProvider } from './contexts/AuthContext';
import FileList from './components/Files/FileList';
import ChatBox from './components/Chat/ChatBox';
import TodoBoard from './components/Todo/TodoBoard';
import Chatbot from './components/Chatbot/Chatbot';
import GroupDetailPage from './pages/GroupDetailPage';
import YourSummaries from './pages/YourSummaries';
import FriendsPage from './components/FriendsPage';
import { AnimatePresence, motion } from 'framer-motion';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <App />
          </motion.div>
        } />
        <Route path="/dashboard" element={
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard />
          </motion.div>
        } />
        <Route path="/group/:groupId" element={
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GroupDetailPage />
          </motion.div>
        } />
        <Route path="/group" element={
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GroupPage />
          </motion.div>
        } />
        <Route path="/files" element={
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FileList />
          </motion.div>
        } />
        <Route path="/chat" element={
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ChatBox />
          </motion.div>
        } />
        <Route path="/todo" element={
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TodoBoard />
          </motion.div>
        } />
        <Route path="/profile" element={
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Profile />
          </motion.div>
        } />
        <Route path="/your-summaries" element={
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <YourSummaries />
          </motion.div>
        } />
        <Route path="/friends" element={
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FriendsPage />
          </motion.div>
        } />
        <Route path="/signup" element={
          <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -80, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.4, 0.01, 0.165, 0.99] }}
            style={{ minHeight: '100vh' }}
          >
            <SignupForm />
          </motion.div>
        } />
        <Route path="/login" element={
          <motion.div
            initial={{ opacity: 0, x: -80, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.4, 0.01, 0.165, 0.99] }}
            style={{ minHeight: '100vh' }}
          >
            <LoginForm />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
        <BrowserRouter>
          <AnimatedRoutes />
          <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1000 }}>
            <Chatbot />
          </div>
        </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
