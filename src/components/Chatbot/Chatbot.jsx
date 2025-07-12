import React, { useEffect, useRef, useState } from "react";
import "./Chatbot.css";
import { GoogleGenerativeAI } from "@google/generative-ai";
import chatbotData from "./chatbotData.json";
import roboIcon from "./robot.png";
import sendIcon from "./send-icon.png";

const Chatbot = () => {
  // Get API key from environment variable or use a placeholder
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "your_api_key";
  
  // Debug: Log API key status (without exposing the actual key)
  console.log("API Key Status:", {
    hasKey: !!import.meta.env.VITE_GEMINI_API_KEY,
    keyLength: import.meta.env.VITE_GEMINI_API_KEY ? import.meta.env.VITE_GEMINI_API_KEY.length : 0,
    isPlaceholder: API_KEY === "your_api_key",
    keyPrefix: import.meta.env.VITE_GEMINI_API_KEY ? import.meta.env.VITE_GEMINI_API_KEY.substring(0, 10) + '...' : 'none'
  });
  
  // Create a proper system instruction from the chatbot data
  const systemInstruction = `You are HelpBot, a helpful AI assistant for StudySync. You help students with their studies, answer questions about the platform, and provide guidance.

Key capabilities:
- Help with study-related questions
- Explain StudySync features
- Provide study tips and advice
- Answer general questions about the platform

Be friendly, helpful, and concise in your responses. If you don't know something, be honest about it.`;

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiDisabled, setApiDisabled] = useState(false);

  const chatRef = useRef();

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  // Function to get fallback responses when API is not available
  const getFallbackResponse = (userInput) => {
    const inputLower = userInput.toLowerCase();
    
    // Check for greetings
    if (inputLower.includes('hello') || inputLower.includes('hi') || inputLower.includes('hey')) {
      return chatbotData.greetings[Math.floor(Math.random() * chatbotData.greetings.length)];
    }
    
    // Check for farewells
    if (inputLower.includes('bye') || inputLower.includes('goodbye') || inputLower.includes('see you')) {
      return chatbotData.farewells[Math.floor(Math.random() * chatbotData.farewells.length)];
    }
    
    // Check for study-related keywords
    if (inputLower.includes('study') || inputLower.includes('learn') || inputLower.includes('help')) {
      return "I'm here to help you with your studies! You can ask me about study techniques, specific subjects, or how to use StudySync features.";
    }
    
    if (inputLower.includes('groups') || inputLower.includes('group')) {
      return "StudySync allows you to create and join study groups. You can collaborate with friends, share notes, and study together in real-time!";
    }
    
    if (inputLower.includes('video call') || inputLower.includes('meeting')) {
      return "StudySync has built-in video calling features for group study sessions. You can start video calls directly from your study groups!";
    }
    
    if (inputLower.includes('files') || inputLower.includes('upload')) {
      return "You can upload and share files in your study groups. Supported formats include PDFs, images, and documents.";
    }
    
    // Default response
    return chatbotData.default[Math.floor(Math.random() * chatbotData.default.length)];
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Check if API key is valid or if API is disabled due to rate limiting
      if (API_KEY === "your_api_key" || !API_KEY || apiDisabled) {
        // Use fallback responses when API is not available
        setTimeout(() => {
          const fallbackResponse = getFallbackResponse(input);
          setMessages((prev) => [
            ...prev,
            { role: "model", text: fallbackResponse },
          ]);
          setLoading(false);
        }, 1000);
        return;
      }

      console.log("Making API call with key:", API_KEY.substring(0, 10) + "...");
      
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
      });

      console.log("Sending message to Gemini API...");
      
      // Use generateContent instead of sendMessageStream to match curl behavior
      const fullPrompt = `${systemInstruction}\n\nUser: ${input}\n\nHelpBot:`;
      const result = await model.generateContent(fullPrompt);
      console.log("Received response from Gemini API");
      
      const botResponse = result.response.text();
      setMessages((prev) => [
        ...prev,
        { role: "model", text: botResponse },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        apiKeyStatus: {
          hasKey: !!import.meta.env.VITE_GEMINI_API_KEY,
          keyLength: import.meta.env.VITE_GEMINI_API_KEY ? import.meta.env.VITE_GEMINI_API_KEY.length : 0
        }
      });
      
      // Check if it's a rate limit error and disable API temporarily
      if (error.message && error.message.includes('429')) {
        console.log("Rate limit exceeded - switching to fallback mode for 1 hour");
        setApiDisabled(true);
        // Re-enable API after 1 hour
        setTimeout(() => {
          setApiDisabled(false);
          console.log("API re-enabled after rate limit cooldown");
        }, 60 * 60 * 1000); // 1 hour
      }
      
      // Use fallback response on error
      const fallbackResponse = getFallbackResponse(input);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: fallbackResponse },
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
            <span>HelpBot {apiDisabled && <span style={{fontSize: '12px', color: '#ffa500'}}>(Offline Mode)</span>}</span>
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
