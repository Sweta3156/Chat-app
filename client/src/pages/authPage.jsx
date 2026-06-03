import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.glow} />
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>⬡</span>
          <span style={styles.logoText}>NexChat</span>
        </div>
        <p style={styles.sub}>Real-time conversations, seamlessly.</p>

        <div style={styles.tabs}>
          {["login", "register"].map((m) => (
            <button key={m} style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }} onClick={() => setMode(m)}>
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handle} style={styles.form}>
          {mode === "register" && (
            <input style={styles.input} placeholder="Username" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          )}
          <input style={styles.input} placeholder="Email" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} placeholder="Password" type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />

          {error && <p style={styles.error}>{error}</p>}

          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", position: "relative", overflow: "hidden" },
  glow: { position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #7c6aff18 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" },
  card: { background: "#111118", border: "1px solid #2e2e40", borderRadius: 20, padding: "2.5rem 2rem", width: "100%", maxWidth: 420, position: "relative", zIndex: 1 },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  logoIcon: { fontSize: "1.8rem", color: "#7c6aff" },
  logoText: { fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "#f0eeff" },
  sub: { color: "#9b97b8", fontSize: "0.9rem", marginBottom: "1.8rem" },
  tabs: { display: "flex", background: "#1a1a24", borderRadius: 10, padding: 4, marginBottom: "1.5rem" },
  tab: { flex: 1, padding: "0.55rem", background: "none", color: "#5a5675", fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: "0.85rem", borderRadius: 8, transition: "all 0.2s", textTransform: "capitalize" },
  tabActive: { background: "#7c6aff", color: "#fff" },
  form: { display: "flex", flexDirection: "column", gap: "0.9rem" },
  input: { background: "#1a1a24", border: "1px solid #2e2e40", borderRadius: 10, padding: "0.75rem 1rem", color: "#f0eeff", fontSize: "0.95rem", transition: "border-color 0.2s" },
  error: { color: "#ff5e7a", fontSize: "0.85rem", textAlign: "center" },
  btn: { background: "linear-gradient(135deg, #7c6aff, #9b8dff)", color: "#fff", borderRadius: 10, padding: "0.85rem", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.95rem", transition: "opacity 0.2s, transform 0.1s", cursor: "pointer" },
};