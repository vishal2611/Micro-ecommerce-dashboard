import { useState } from "react";
import { Mail, Lock, ArrowRight, ShieldCheck, Boxes, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  { icon: ShieldCheck, text: "Identity verified through signed tokens across every service" },
  { icon: Boxes, text: "One account, independently deployed services underneath" },
  { icon: Zap, text: "Changes to your profile reflect instantly, no page reload" },
];

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await signup(email, password);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.brandSide}>
        <div style={styles.brandSideInner}>
          <div style={styles.brandRow}>
            <div style={styles.brandMark}>E</div>
            <span style={styles.brandName}>ecommerce</span>
          </div>

          <h1 style={styles.hero}>
            Every service,<br />one clean account.
          </h1>
          <p style={styles.heroSub}>
            A single sign-in backed by independently deployed microservices —
            auth, profile, and everything after, working together underneath.
          </p>

          <div style={styles.features}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} style={styles.featureRow}>
                <div style={styles.featureIcon}>
                  <Icon size={15} />
                </div>
                <span style={styles.featureText}>{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={styles.glow} />
      </div>

      <div style={styles.formSide}>
        <div style={styles.formCard}>
          <div style={styles.eyebrow} className="mono">{mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}</div>
          <h2 style={styles.title}>{mode === "login" ? "Welcome back" : "Get started"}</h2>
          <p style={styles.subtitle}>
            {mode === "login" ? "Sign in to manage your account." : "Takes less than a minute."}
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label} className="mono">EMAIL</label>
              <div style={styles.inputWrap}>
                <Mail size={15} style={styles.inputIcon} />
                <input
                  style={styles.input}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label} className="mono">PASSWORD</label>
              <div style={styles.inputWrap}>
                <Lock size={15} style={styles.inputIcon} />
                <input
                  style={styles.input}
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button style={styles.submit} type="submit" disabled={loading}>
              {loading ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          <button
            style={styles.switch}
            onClick={() => {
              setError(null);
              setMode(mode === "login" ? "signup" : "login");
            }}
          >
            {mode === "login" ? "Need an account? " : "Already have an account? "}
            <span style={{ color: "var(--accent)" }}>{mode === "login" ? "Sign up" : "Sign in"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
  },
  brandSide: {
    flex: "1 1 46%",
    position: "relative",
    display: "flex",
    alignItems: "center",
    padding: "48px",
    overflow: "hidden",
    background: "var(--bg-elevated)",
    borderRight: "1px solid var(--border-soft)",
  },
  glow: {
    position: "absolute",
    width: "480px",
    height: "480px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(232,163,61,0.12), transparent 65%)",
    top: "-140px",
    left: "-140px",
    pointerEvents: "none",
  },
  brandSideInner: {
    position: "relative",
    maxWidth: "440px",
    animation: "fadeUp 0.5s ease both",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "56px",
  },
  brandMark: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, var(--accent), #c67a1e)",
    color: "#1a1206",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "15px",
  },
  brandName: {
    fontWeight: 600,
    fontSize: "16px",
  },
  hero: {
    fontSize: "38px",
    lineHeight: 1.15,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    margin: "0 0 16px",
  },
  heroSub: {
    color: "var(--text-dim)",
    fontSize: "15px",
    lineHeight: 1.6,
    margin: "0 0 40px",
    maxWidth: "380px",
  },
  features: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  featureRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  featureIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "var(--panel-2)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--accent)",
    flexShrink: 0,
  },
  featureText: {
    fontSize: "13.5px",
    color: "var(--text-dim)",
    lineHeight: 1.5,
    paddingTop: "4px",
  },
  formSide: {
    flex: "1 1 54%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  formCard: {
    width: "100%",
    maxWidth: "380px",
    animation: "fadeUp 0.5s ease 0.1s both",
  },
  eyebrow: {
    color: "var(--accent)",
    fontSize: "11px",
    letterSpacing: "0.12em",
    marginBottom: "14px",
  },
  title: {
    fontSize: "26px",
    margin: "0 0 6px",
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  subtitle: {
    color: "var(--text-dim)",
    fontSize: "14px",
    margin: "0 0 28px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "10.5px",
    color: "var(--text-faint)",
    letterSpacing: "0.08em",
  },
  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "12px",
    color: "var(--text-faint)",
  },
  input: {
    width: "100%",
    background: "var(--panel-2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "11px 12px 11px 36px",
    color: "var(--text)",
    fontSize: "14px",
  },
  error: {
    padding: "10px 12px",
    background: "var(--err-soft)",
    border: "1px solid rgba(239,111,97,0.25)",
    borderRadius: "var(--radius-sm)",
    color: "var(--err)",
    fontSize: "13px",
  },
  submit: {
    marginTop: "6px",
    background: "linear-gradient(135deg, var(--accent), #c67a1e)",
    color: "#1a1206",
    border: "none",
    borderRadius: "var(--radius-sm)",
    padding: "12px",
    fontWeight: 600,
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "var(--shadow-glow)",
  },
  switch: {
    marginTop: "22px",
    background: "none",
    border: "none",
    color: "var(--text-dim)",
    fontSize: "13px",
    width: "100%",
    textAlign: "center",
  },
};
