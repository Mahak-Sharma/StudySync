import React, { useState, useEffect, useRef } from "react";
import './ChatBox.css';
import { db } from '../../api/firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import BackButton from '../BackButton';

const ChatBox = ({ groupId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Fetch messages for this group
  useEffect(() => {
    if (!groupId) {
      setError("No group selected.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const q = query(
        collection(db, 'groups', groupId, 'messages'),
        orderBy('createdAt', 'asc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (err) => {
        setError("Failed to load messages: " + err.message);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      setError("Error: " + err.message);
      setLoading(false);
    }
  }, [groupId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    try {
      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        text: input,
        userId: user.uid,
        userName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      });
      setInput("");
    } catch (err) {
      setError("Failed to send message: " + err.message);
    }
  };

  if (error) {
    return <div className="chat-box-container"><div style={{color:'red',padding:16}}>{error}</div></div>;
  }
  if (loading) {
    return <div className="chat-box-container"><div>Loading chat...</div></div>;
  }

  return (
    <>
      <BackButton />
      <div className="chat-box-container">
        <h3 className="chat-box-title">Group Chat</h3>
        <ul className="chat-box-messages">
          {messages.map(msg => (
            <li
              className={`chat-box-message${msg.userId === user?.uid ? ' chat-box-message-right' : ' chat-box-message-left'}`}
              key={msg.id}
            >
              <span className="chat-box-user"><b>{msg.userName}:</b></span>
              <span>{msg.text}</span>
            </li>
          ))}
          <div ref={messagesEndRef} />
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
    </>
  );
};

export default ChatBox; 