import React, { useState } from "react";
import { HMSPrebuilt } from "@100mslive/roomkit-react";
import BackButton from '../components/BackButton';

export default function MeetingPage() {
    const [roomCode, setRoomCode] = useState("");
    const [userName, setUserName] = useState("");
    const [join, setJoin] = useState(false);

    if (join) {
        return (
            <div style={{ height: "100vh" }}>
                <HMSPrebuilt roomCode={roomCode} userName={userName} />
            </div>
        );
    }

    return (
        <>
          <BackButton />
          <div style={{ padding: 40 }}>
            <h2>Group Meeting Join Karo</h2>
            <input
                type="text"
                placeholder="Room Code (100ms dashboard se lo)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                style={{ margin: 8 }}
            />
            <br />
            <input
                type="text"
                placeholder="Apna Naam"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                style={{ margin: 8 }}
            />
            <br />
            <button onClick={() => setJoin(true)} style={{ margin: 8 }}>
                Join Meeting
            </button>
          </div>
        </>
    );
} 