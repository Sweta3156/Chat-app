import { useState, useEffect } from "react";
import axios from "axios";
import SideBar from "../../components/SideBar";
import ChatWindow from "../../components/ChatWindow";
import { useAuth } from "../context/AuthContext";

export default function ChatPage() {
  const { token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);

  const fetchRooms = async () => {
    try {
      const res = await axios.get("/api/rooms", { headers: { Authorization: `Bearer ${token}` } });
      setRooms(res.data);
      if (res.data.length > 0 && !activeRoom) setActiveRoom(res.data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  return (
    <div style={styles.layout}>
      <Sidebar rooms={rooms} activeRoom={activeRoom} setActiveRoom={setActiveRoom} onRoomCreated={fetchRooms} />
      <main style={styles.main}>
        {activeRoom ? (
          <ChatWindow room={activeRoom} />
        ) : (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>⬡</span>
            <p style={styles.emptyText}>Select a room to start chatting</p>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  layout: { display: "flex", height: "100vh", overflow: "hidden" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  empty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 },
  emptyIcon: { fontSize: "3rem", color: "#2e2e40" },
  emptyText: { color: "#5a5675", fontFamily: "Syne, sans-serif", fontSize: "1rem" },
};