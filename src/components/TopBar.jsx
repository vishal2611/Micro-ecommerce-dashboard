import { useEffect, useState } from "react";
import axios from "axios";
import { Activity } from "lucide-react";

const SERVICES = [
  { name: "user-service", url: import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:8001" },
  { name: "profile-service", url: import.meta.env.VITE_PROFILE_SERVICE_URL || "http://localhost:8002" },
];

function useHealth(url) {
  const [state, setState] = useState({ status: "checking", ms: null });

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      const start = performance.now();
      try {
        await axios.get(`${url}/health`, { timeout: 4000 });
        if (!cancelled) setState({ status: "up", ms: Math.round(performance.now() - start) });
      } catch {
        if (!cancelled) setState({ status: "down", ms: null });
      }
    }

    ping();
    const id = setInterval(ping, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [url]);

  return state;
}

function ServicePill({ name, url }) {
  const { status, ms } = useHealth(url);
  const color = status === "up" ? "var(--ok)" : status === "down" ? "var(--err)" : "var(--text-faint)";

  return (
    <div style={styles.pill}>
      <span
        style={{
          ...styles.dot,
          background: color,
          boxShadow: status === "up" ? `0 0 6px ${color}` : "none",
          animation: status === "checking" ? "pulse 1.4s ease-in-out infinite" : "none",
        }}
      />
      <span className="mono" style={styles.pillName}>{name}</span>
      <span className="mono" style={styles.pillMeta}>
        {status === "checking" ? "…" : status === "up" ? `${ms}ms` : "down"}
      </span>
    </div>
  );
}

export default function TopBar({ title, subtitle }) {
  return (
    <header style={styles.bar}>
      <div>
        <h1 style={styles.title}>{title}</h1>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </div>
      <div style={styles.right}>
        <Activity size={13} style={{ color: "var(--text-faint)" }} />
        <div style={styles.pills}>
          {SERVICES.map((s) => (
            <ServicePill key={s.name} name={s.name} url={s.url} />
          ))}
        </div>
      </div>
    </header>
  );
}

const styles = {
  bar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "28px 36px 20px",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "24px",
    margin: 0,
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  subtitle: {
    margin: "4px 0 0",
    color: "var(--text-dim)",
    fontSize: "13.5px",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "var(--panel)",
    border: "1px solid var(--border-soft)",
    borderRadius: "999px",
    padding: "7px 14px",
  },
  pills: {
    display: "flex",
    gap: "16px",
  },
  pill: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  pillName: {
    color: "var(--text)",
  },
  pillMeta: {
    color: "var(--text-faint)",
  },
};
