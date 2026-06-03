import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../src/context/authContext";
import { useSocket } from "../src/context/SocketContext";

const Avatar = ({ name, size = 32 }) => {
  const colors = ["#7c6aff", "#4ade80", "#f59e0b", "#f43f5e", "#06b6d4"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne", fontWeight: 700, fontSize: size * 0.38, color: "#fff", flexShrink: 0, marginTop: 2 }}>
      {name[0].toUpperCase()}
    </div>
  );
};

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function ChatWindow({ room }) {
  const { user, token } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Load history + join room
  useEffect(() => {
    if (!room || !token) return;

    axios.get(`/api/messages/${room._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setMessages(res.data))
      .catch(console.error);

    if (socket) {
      socket.emit("joinRoom", room._id);
    }

    return () => {
      if (socket) socket.emit("leaveRoom", room._id);
      setMessages([]);
      setTypingUsers([]);
    };
  }, [room._id, socket]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
      setTypingUsers(prev => prev.filter(u => u.userId !== msg.sender._id));
    };

    const handleTyping = ({ userId, username, isTyping }) => {
      if (userId === user.id) return;
      setTypingUsers(prev =>
        isTyping
          ? prev.find(u => u.userId === userId) ? prev : [...prev, { userId, username }]
          : prev.filter(u => u.userId !== userId)
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("userTyping", handleTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userTyping", handleTyping);
    };
  }, [socket]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleInput = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    socket.emit("typing", { roomId: room._id, isTyping: true });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("typing", { roomId: room._id, isTyping: false });
    }, 1500);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !socket || sending) return;
    setSending(true);
    socket.emit("typing", { roomId: room._id, isTyping: false });
    socket.emit("sendMessage", { roomId: room._id, content: input.trim() });
    setInput("");
    setSending(false);
  };

  const grouped = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    const sameUser = prev?.sender?._id === msg.sender?._id;
    const within2min = prev && (new Date(msg.createdAt) - new Date(prev.createdAt)) < 120000;
    acc.push({ ...msg, compact: sameUser && within2min });
    return acc;
  }, []);

  return (
    <div style={styles.wrapper}>
      {/* Top bar */}
      <div style={styles.topbar}>
        <div>
          <span style={styles.roomTitle}># {room.name}</span>
          {room.description && <span style={styles.roomDesc}>{room.description}</span>}
        </div>
        <span style={styles.onlineCount}>
          <span style={styles.greenDot} />
          {onlineUsers.length} online
        </span>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {grouped.map((msg) => (
          <div key={msg._id} style={{ ...styles.msgRow, ...(msg.compact ? styles.compact : {}) }}>
            {!msg.compact && <Avatar name={msg.sender?.username || "?"} />}
            {msg.compact && <div style={{ width: 32, flexShrink: 0 }} />}
            <div style={styles.msgContent}>
              {!msg.compact && (
                <div style={styles.msgMeta}>
                  <span style={{ ...styles.msgAuthor, color: msg.sender?._id === user.id ? "#7c6aff" : "#9b97b8" }}>
                    {msg.sender?.username}
                    {msg.sender?._id === user.id && " (you)"}
                  </span>
                  <span style={styles.msgTime}>{formatTime(msg.createdAt)}</span>
                </div>
              )}
              <div style={{ ...styles.msgBubble, ...(msg.sender?._id === user.id ? styles.myBubble : {}) }}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {typingUsers.length > 0 && (
          <div style={styles.typing}>
            <div style={styles.typingDots}>
              <span /><span /><span />
            </div>
            <span>{typingUsers.map(u => u.username).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={styles.inputArea}>
        <input
          style={styles.input}
          placeholder={`Message #${room.name}`}
          value={input}
          onChange={handleInput}
          autoFocus
        />
        <button style={{ ...styles.sendBtn, opacity: !input.trim() ? 0.5 : 1 }} disabled={!input.trim()}>
          ↑
        </button>
      </form>

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", flexDirection: "column", height: "100vh", background: "#0a0a0f" },
  topbar: { padding: "1rem 1.5rem", borderBottom: "1px solid #2e2e40", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111118" },
  roomTitle: { fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "#f0eeff" },
  roomDesc: { marginLeft: 12, fontSize: "0.82rem", color: "#5a5675" },
  onlineCount: { display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "#9b97b8", fontFamily: "Syne, sans-serif" },
  greenDot: { width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" },
  messages: { flex: 1, overflowY: "auto", padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: 2 },
  msgRow: { display: "flex", gap: 10, alignItems: "flex-start", padding: "0.4rem 0" },
  compact: { paddingTop: 2 },
  msgContent: { flex: 1, minWidth: 0 },
  msgMeta: { display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 },
  msgAuthor: { fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.88rem" },
  msgTime: { fontSize: "0.72rem", color: "#5a5675" },
  msgBubble: { display: "inline-block", background: "#1a1a24", border: "1px solid #2e2e40", borderRadius: "4px 12px 12px 12px", padding: "0.5rem 0.85rem", fontSize: "0.92rem", color: "#e8e4ff", lineHeight: 1.5, maxWidth: "70%", wordBreak: "break-word" },
  myBubble: { background: "#7c6aff22", borderColor: "#7c6aff44", borderRadius: "12px 4px 12px 12px" },
  typing: { display: "flex", alignItems: "center", gap: 8, padding: "0.4rem 0", color: "#5a5675", fontSize: "0.82rem" },
  typingDots: { display: "flex", gap: 3, "& span": {} },
  inputArea: { padding: "1rem 1.5rem", borderTop: "1px solid #2e2e40", display: "flex", gap: 10, alignItems: "center", background: "#111118" },
  input: { flex: 1, background: "#1a1a24", border: "1px solid #2e2e40", borderRadius: 10, padding: "0.75rem 1rem", color: "#f0eeff", fontSize: "0.95rem" },
  sendBtn: { width: 42, height: 42, borderRadius: 10, background: "#7c6aff", color: "#fff", fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "opacity 0.2s" },
};