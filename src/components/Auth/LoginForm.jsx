import './LoginForm.css';
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../api/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setShowSignup(true);
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="login-form-container">
      <div className="login-form-logo">
        <img src="/vite.svg" alt="logo" />
      </div>
      <h2 className="login-form-title">Sign in to StudySync</h2>
      <form className="login-form-fields" onSubmit={handleSubmit}>
        <div style={{ position: 'relative' }}>
          <span className="login-form-input-icon"><FaUser /></span>
          <input className="login-form-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div style={{ position: 'relative' }}>
          <span className="login-form-input-icon"><FaLock /></span>
          <input className="login-form-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button className="login-form-button" type="submit">Login</button>
      </form>
      {error && <div className="login-form-error">{error}</div>}
      {showSignup && (
        <button className="login-form-button" onClick={() => navigate('/signup')}>Not registered? Sign Up</button>
      )}
      <div className="login-form-signup-link">
        New user? <span onClick={() => navigate('/signup')} className="login-form-signup-anchor">Sign Up</span>
      </div>
    </div>
  );
};

export default LoginForm; 
