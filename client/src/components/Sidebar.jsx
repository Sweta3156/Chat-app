import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const Avatar = ({ name, size = 36 }) => {
  const colors = ["#7c6aff", "#4ade80", "#f59e0b", "#f43f5e", "#06b6d4"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: size * 0.38, color: "#fff", flexShrink: 0 }}>
      {name[0].toUpperCase()}
    </div>
  );
};

export default function Sidebar({ rooms, activeRoom, setActiveRoom, onRoomCreated }) {
  const { user, token, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomDesc, setRoomDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  const createRoom = async (e) => {
    e.preventDefault();
    setErr("");
    setCreating(true);
    try {
      await axios.post("/api/rooms", { name: roomName, description: roomDesc }, { headers: { Authorization: `Bearer ${token}` } });
      setRoomName(""); setRoomDesc(""); setShowCreate(false);
      onRoomCreated();
    } catch (error) {
      setErr(error.response?.data?.message || "Failed to create room");
    } finally { setCreating(false); }
  };

  return (
    <aside style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>⬡ NexChat</span>
        <div style={styles.onlineDot} title={`${onlineUsers.length} online`} />
      </div>

      {/* Rooms */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>ROOMS</span>
          <button style={styles.addBtn} onClick={() => setShowCreate(!showCreate)}>+</button>
        </div>

        {showCreate && (
          <form onSubmit={createRoom} style={styles.createForm}>
            <input style={styles.miniInput} placeholder="Room name" value={roomName} onChange={e => setRoomName(e.target.value)} required />
            <input style={styles.miniInput} placeholder="Description (optional)" value={roomDesc} onChange={e => setRoomDesc(e.target.value)} />
            {err && <p style={{ color: "#ff5e7a", fontSize: "0.75rem" }}>{err}</p>}
            <button style={styles.createBtn} disabled={creating}>{creating ? "..." : "Create"}</button>
          </form>
        )}

        <div style={styles.roomList}>
          {rooms.map((room) => (
            <button key={room._id} style={{ ...styles.roomItem, ...(activeRoom?._id === room._id ? styles.roomActive : {}) }} onClick={() => setActiveRoom(room)}>
              <span style={styles.roomHash}>#</span>
              <div>
                <div style={styles.roomName}>{room.name}</div>
                {room.description && <div style={styles.roomDesc}>{room.description}</div>}
              </div>
            </button>
          ))}
          {rooms.length === 0 && <p style={styles.noRooms}>No rooms yet. Create one!</p>}
        </div>
      </div>

      {/* User footer */}
      <div style={styles.footer}>
        <Avatar name={user.username} size={34} />
        <div style={styles.userInfo}>
          <span style={styles.userName}>{user.username}</span>
          <span style={styles.userStatus}>● Online</span>
        </div>
        <button style={styles.logoutBtn} onClick={logout} title="Logout">⏻</button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: { width: 260, background: "#111118", borderRight: "1px solid #2e2e40", display: "flex", flexDirection: "column", height: "100vh" },
  header: { padding: "1.2rem 1rem", borderBottom: "1px solid #2e2e40", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo: { fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#f0eeff" },
  onlineDot: { width: 8, height: 8, borderRadius: "50%", background: "#4ade80" },
  section: { flex: 1, padding: "1rem 0.75rem", overflow: "hidden", display: "flex", flexDirection: "column" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem", padding: "0 0.25rem" },
  sectionLabel: { fontSize: "0.7rem", fontWeight: 600, color: "#5a5675", letterSpacing: "0.08em", fontFamily: "Syne, sans-serif" },
  addBtn: { width: 22, height: 22, borderRadius: 6, background: "#1a1a24", color: "#7c6aff", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #2e2e40", lineHeight: 1 },
  createForm: { background: "#1a1a24", borderRadius: 10, padding: "0.75rem", marginBottom: "0.75rem", display: "flex", flexDirection: "column", gap: 6, border: "1px solid #2e2e40" },
  miniInput: { background: "#22222f", border: "1px solid #2e2e40", borderRadius: 6, padding: "0.45rem 0.65rem", color: "#f0eeff", fontSize: "0.82rem" },
  createBtn: { background: "#7c6aff", color: "#fff", borderRadius: 6, padding: "0.4rem", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.8rem" },
  roomList: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 },
  roomItem: { display: "flex", alignItems: "center", gap: 8, padding: "0.6rem 0.75rem", borderRadius: 8, background: "none", color: "#9b97b8", textAlign: "left", transition: "all 0.15s", width: "100%" },
  roomActive: { background: "#7c6aff22", color: "#f0eeff" },
  roomHash: { color: "#5a5675", fontWeight: 700, fontSize: "1rem", flexShrink: 0 },
  roomName: { fontSize: "0.88rem", fontWeight: 500, fontFamily: "Syne, sans-serif" },
  roomDesc: { fontSize: "0.72rem", color: "#5a5675", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 },
  noRooms: { color: "#5a5675", fontSize: "0.8rem", padding: "0.5rem 0.25rem" },
  footer: { padding: "0.9rem 1rem", borderTop: "1px solid #2e2e40", display: "flex", alignItems: "center", gap: 10 },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { display: "block", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "#f0eeff" },
  userStatus: { fontSize: "0.72rem", color: "#4ade80" },
  logoutBtn: { background: "none", color: "#5a5675", fontSize: "1.1rem", padding: 4, borderRadius: 6, transition: "color 0.2s" },
};