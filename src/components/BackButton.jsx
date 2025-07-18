import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';

const shake = {
  x: [0, -8, 8, -6, 6, -4, 4, 0],
  transition: { duration: 0.5, type: 'tween' }
};

const BackButton = ({ style = {}, className = '' }) => {
  const navigate = useNavigate();
  return (
    <motion.button
      className={className}
      style={{
        position: 'fixed',
        top: 24,
        left: 24,
        zIndex: 1000,
        background: '#1976d2',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px #1976d244',
        fontSize: 22,
        cursor: 'pointer',
        ...style
      }}
      whileHover={shake}
      whileTap={{ scale: 0.92 }}
      title="Go Back"
      onClick={() => navigate(-1)}
      aria-label="Go Back"
    >
      <FaArrowLeft />
    </motion.button>
  );
};

export default BackButton; 