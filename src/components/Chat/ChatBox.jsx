import React, { useState } from "react";
import './ChatBox.css';

const initialMessages = [
  { id: 1, user: "Alice", text: "Hi everyone!" },
  { id: 2, user: "Bob", text: "Hello Alice!" },
];

const ChatBox = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([...messages, { id: messages.length + 1, user: "You", text: input }]);
      setInput("");
    }
  };

  return (
    <div className="chat-box-container">
      <h3 className="chat-box-title">Group Chat</h3>
      <ul className="chat-box-messages">
        {messages.map(msg => (
          <li className="chat-box-message" key={msg.id}>
            <span className="chat-box-user"><b>{msg.user}:</b></span> <span>{msg.text}</span>
          </li>
        ))}
      </ul>
      <hr className="chat-box-divider" />
      <form className="chat-box-form" onSubmit={handleSend}>
        <input
          className="chat-box-input"
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button className="chat-box-send" type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatBox; 