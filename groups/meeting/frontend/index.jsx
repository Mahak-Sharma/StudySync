import React from "react";
import { createRoot } from "react-dom/client";
import MeetingRoom from "./MeetingRoom.jsx";

const root = createRoot(document.getElementById("root"));
root.render(<MeetingRoom groupId="test-group" userName="TestUser" />); 