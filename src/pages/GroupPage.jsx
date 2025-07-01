import './GroupPage.css';
import GroupDashboard from "../components/Groups/GroupDashboard";
import ChatBox from "../components/Chat/ChatBox";
import FileList from "../components/Files/FileList";
import TodoBoard from "../components/Todo/TodoBoard";
import Chatbot from "../components/Chatbot/Chatbot";

const GroupPage = () => (
  <div className="group-page-container">
    <div className="group-page-section">
      <GroupDashboard groupName="Math Study Group" />
    </div>
    <hr className="group-page-divider" />
    <div className="group-page-section">
      <h2 className="group-page-header">Group Chat</h2>
      <ChatBox />
    </div>
    <hr className="group-page-divider" />
    <div className="group-page-section">
      <h2 className="group-page-header">Files</h2>
      <FileList />
    </div>
    <hr className="group-page-divider" />
    <div className="group-page-section">
      <h2 className="group-page-header">Todo</h2>
      <TodoBoard />
    </div>
    <hr className="group-page-divider" />
    <div className="group-page-section">
      <h2 className="group-page-header">Study Assistant</h2>
      <Chatbot />
    </div>
  </div>
);

export default GroupPage; 