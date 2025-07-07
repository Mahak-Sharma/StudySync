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
import { VideoCallProvider } from './contexts/VideoCallContext';
import GlobalVideoCall from './components/VideoCall/GlobalVideoCall';
import { AnimatePresence, motion } from 'framer-motion';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
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
      <VideoCallProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/group/:groupId" element={<GroupDetailPage />} />
            <Route path="/group" element={<GroupPage />} />
            <Route path="/files" element={<FileList />} />
            <Route path="/chat" element={<ChatBox />} />
            <Route path="/todo" element={<TodoBoard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/your-summaries" element={<YourSummaries />} />
            <Route path="/friends" element={<FriendsPage />} />
          </Routes>
          <AnimatedRoutes />
          <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1000 }}>
            <Chatbot />
          </div>
          <GlobalVideoCall />
        </BrowserRouter>
      </VideoCallProvider>
    </AuthProvider>
  </React.StrictMode>
);
