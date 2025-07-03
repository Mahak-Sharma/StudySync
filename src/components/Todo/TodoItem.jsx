import './TodoItem.css';
import React, { useState } from 'react';

const TodoItem = ({ text, onRemove }) => {
  const [removing, setRemoving] = useState(false);

  const handleComplete = () => {
    setRemoving(true);
    setTimeout(() => {
      onRemove();
    }, 400); // Match with CSS animation duration
  };

  return (
    <li className={`todo-item-box${removing ? ' removing' : ''}`}>
      <span className="todo-item-text">{text}</span>
      <button className="todo-item-complete-btn" onClick={handleComplete}>
        Completed
      </button>
    </li>
  );
};

export default TodoItem; 