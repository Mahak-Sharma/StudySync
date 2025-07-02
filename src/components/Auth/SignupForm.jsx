import './SignupForm.css';
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../api/firebaseConfig';
import { useNavigate, NavLink } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaUserPlus } from 'react-icons/fa';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '../../api/firebaseConfig';

const SignupForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      // Add user info to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        displayName: name,
        email: userCredential.user.email,
      }, { merge: true });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="signup-form-container">
      <div className="signup-form-logo">
        <FaUserPlus size={48} color="#1976d2" style={{ marginBottom: 8 }} />
      </div>
      <h2 className="signup-form-title">Create your StudySync account</h2>
      <form className="signup-form-fields" onSubmit={handleSubmit}>
        <div style={{ position: 'relative' }}>
          <span className="signup-form-input-icon"><FaUser /></span>
          <input className="signup-form-input" type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div style={{ position: 'relative' }}>
          <span className="signup-form-input-icon"><FaEnvelope /></span>
          <input className="signup-form-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div style={{ position: 'relative' }}>
          <span className="signup-form-input-icon"><FaLock /></span>
          <input className="signup-form-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button className="signup-form-button" type="submit">Sign Up</button>
      </form>
      {error && <div className="signup-form-error">{error}</div>}
      <div className="signup-form-login-link">
        Already have an account? <NavLink to="/login" className="signup-form-login-anchor">Login</NavLink>
      </div>
    </div>
  );
};

export default SignupForm; 
