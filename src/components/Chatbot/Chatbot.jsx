import React, { useEffect, useRef, useState } from "react";
import "./Chatbot.css";
import { GoogleGenerativeAI } from "@google/generative-ai";
import chatbotData from "./chatbotData.json";
import roboIcon from "./robot.png";
import sendIcon from "./send-icon.png";

const Chatbot = () => {
  const API_KEY = "your_api_key";
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    systemInstruction: chatbotData,
  });

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatRef = useRef();

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const chatSession = model.startChat({
        history: newMessages.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.text }],
        })),
      });

      const result = await chatSession.sendMessageStream(input);
      let botResponse = "";

      for await (const chunk of result.stream) {
        botResponse += chunk.text();
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[updated.length - 1].role === "model") {
            updated[updated.length - 1].text = botResponse;
          } else {
            updated.push({ role: "model", text: botResponse });
          }
          return [...updated];
        });
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Sorry, something went wrong. Try again." },
      ]);
    }

    setLoading(false);
  };
  const toggleChatbot = () => setChatOpen((prev) => !prev);
  return (
    <>
      {!chatOpen && (
        <div className="chatbot-tooltip">
          <p className="chatbot-tooltip-title">Hello! any questions?</p>
          <p className="chatbot-tooltip-subtitle">HelpBot</p>
        </div>
      )}
      <button onClick={toggleChatbot} className="chatbot-toggle-button">
        <img src={roboIcon} alt="Open Chatbot" />
      </button>

      {chatOpen && (
        <div className="chatbot-wrapper">
          <div className="chatbot-header">
            <span>HelpBot</span>
            <button onClick={toggleChatbot} className="chatbot-close">
              close
            </button>
          </div>

          <div className="chatbot-messages" ref={chatRef}>
            {/* Welcome message always at top */}
            <div className="chatbot-message model">
              Hey there! How can I help you today?
            </div>
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-message ${msg.role}`}>
                {msg.text}
              </div>
            ))}

            {loading && (
              <div className="typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            )}
          </div>

          <div className="chatbot-input-area">
            <input
              type="text"
              className="chatbot-input"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} className="chatbot-send-btn">
              <img src={sendIcon} alt="send" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
