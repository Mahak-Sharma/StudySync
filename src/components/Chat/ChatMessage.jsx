import React from "react";
import './ChatMessage.css';

const ChatMessage = ({ user, text }) => (
  <li className="chat-message-container">
    <span className="chat-message-user"><b>{user}</b></span>: <span>{text}</span>
  </li>
);

export default ChatMessage; 