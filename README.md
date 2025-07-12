# StudySync

A modern, collaborative group study platform built with React and Python.

## ✨ Features
- **Create & Join Groups:** Study together with friends in private or public groups.
- **Real-time Chat:** Discuss topics, share ideas, and stay connected.
- **Video Calling:** High-quality peer-to-peer video calls with friends using WebRTC.
- **Live Polls:** Engage your group with instant polls and voting.
- **Quizzes:** Test your knowledge with group quizzes and challenges.
- **AI File Processing:** Upload documents and images for instant AI-powered summarization.
- **In-Memory Processing:** Files are processed in memory without saving to disk for privacy.
- **Leaderboard:** Track your progress and compete with friends.
- **Todo Board:** Organize study tasks and assignments.
- **AI Chatbot:** Get instant study help and summaries with Google's Gemini AI or fallback responses.
- **Modern UI:** Beautiful, responsive design with vibrant gradients and the Poppins font.

## 🛠️ Tech Stack
- **Frontend:** React (with Vite)
- **Styling:** Traditional CSS (no frameworks), Google Fonts (Poppins), Responsive Design
- **Icons:** react-icons

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://python.org/)
- **pip** (Python package manager, usually comes with Python)
- **Google Generative AI API Key** (optional) - [Get here](https://makersuite.google.com/app/apikey) for enhanced chatbot functionality

### Quick Start (Complete Stack - Frontend + Both Backends)

**Option 1: Using npm script (Recommended)**
```sh
npm install
npm start
```

**Option 2: Using the startup script directly**
```sh
npm install
node start-dev.js
```

**Option 3: Using platform-specific scripts**
- **Windows:** Double-click `start.bat` or run `start.bat` in Command Prompt
- **Mac/Linux:** Run `./start.sh` in Terminal (make sure it's executable: `chmod +x start.sh`)

### What This Does
The startup script will:
1. ✅ Check if Node.js and Python are installed
2. 📦 Install npm dependencies (if not already installed)
3. 🐍 Install Python dependencies for the backend
4. 👥 Start the friends backend (Node.js/Express API on port 5000)
5. 🎥 Start the video call server (Node.js/Socket.IO on port 5002)
6. 📄 Start the summarization backend (Python/Flask API on port 5001)
7. 🎨 Start the React frontend (Vite dev server on port 5173)

### 🔒 Privacy & Security
- **No File Storage:** Uploaded files are processed in memory and never saved to disk
- **Instant Processing:** Files are summarized immediately and then discarded
- **Privacy First:** Your documents remain private and aren't stored on the server
- **Secure API Keys:** Chatbot API keys are stored in environment variables and never committed to version control

### Access Your Application
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Friends Backend API:** [http://localhost:5000](http://localhost:5000) (User management, friends, groups)
- **Video Call Server:** [http://localhost:5002](http://localhost:5002) (WebRTC signaling)
- **Summarization Backend API:** [http://localhost:5001](http://localhost:5001) (File processing, summaries)

### Manual Start (Individual Services)
If you prefer to start services individually:

1. **Frontend only:**
   ```sh
   npm run dev
   ```

2. **Friends Backend only (Node.js):**
   ```sh
   cd src/api
   node friendsBackend.js
   ```

3. **Summarization Backend only (Python):**
   ```sh
   cd backend
   pip install -r requirements.txt
   python summarize_api.py
   ```

### 🧹 Cleanup (Optional)
If you have an existing `backend/uploads` folder from the old version, you can clean it up:
```sh
python cleanup-uploads.py
```
This removes the old uploads folder since files are now processed in memory.

## 📁 Project Structure
- `src/components/` — All UI components (Auth, Chat, Groups, Files, Todo, Chatbot, etc.)
- `src/pages/` — Main pages (Dashboard, GroupPage, Profile)
- `src/assets/` — Static assets (images, icons)
- `src/contexts/` — React context providers (Auth, Socket)
- `src/api/` — API utilities

## 🤖 Chatbot Setup
For enhanced chatbot functionality with Google's Gemini AI:

1. **Get API Key:** Visit [Google AI Studio](https://makersuite.google.com/app/apikey) and create an API key
2. **Create `.env` file:** Add `VITE_GEMINI_API_KEY=your_actual_api_key_here` to the root directory
3. **Restart:** Restart the development server after adding the API key

**Note:** The chatbot works without an API key using intelligent fallback responses for basic queries.

## 🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## 📬 Contact
For questions or contributions, contact:
- **Aakansha Rawat** - [GitHub](https://github.com/aakansharawat) | [Email](mailto:aakansharawat1234@gmail.com)
- **Abhishek Mamgain** - [GitHub](https://github.com/AbhishekMamgain7) | [Email](mailto:abhishekmamgain799@gmail.com)
- **Aaradhya Chachra** - [GitHub](https://github.com/Aaradhya2005) | [Email](mailto:aaradhyachachra779@gmail.com)
- **Mahak Sharma** - [GitHub](https://github.com/Mahak-Sharma) | [Email](mailto:mahaksharma0227@gmail.com)
