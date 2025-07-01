import React, { useState } from "react";
import './Chatbot.css';

const initialMessages = [
  { id: 1, user: "Bot", text: "Hello! How can I help you study today?" },
];

const Chatbot = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([
        ...messages,
        { id: messages.length + 1, user: "You", text: input },
        { id: messages.length + 2, user: "Bot", text: "This is a sample response." }
      ]);
      setInput("");
    }
  };

  return (
    <div className="chatbot-container">
      <h3 className="chatbot-title">Study Assistant</h3>
      <ul className="chatbot-messages">
        {messages.map(msg => (
          <li className="chatbot-message" key={msg.id}>
            <span className="chatbot-user"><b>{msg.user}:</b></span> <span>{msg.text}</span>
          </li>
        ))}
      </ul>
      <hr className="chatbot-divider" />
      <form className="chatbot-form" onSubmit={handleSend}>
        <input
          className="chatbot-input"
          type="text"
          placeholder="Ask the bot..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button className="chatbot-send" type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chatbot; 