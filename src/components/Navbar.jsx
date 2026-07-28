import { useEffect, useState } from "react";
import axios from "axios";
import { Layers } from "lucide-react";

/**
 * Full service registry for the platform. Services with a `url` are pinged once
 * on load; services without one are shown as "planned" (grey) until they're built.
 */
const SERVICES = [
  { name: "user-service", url: import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:8001" },
  { name: "profile-service", url: import.meta.env.VITE_PROFILE_SERVICE_URL || "http://localhost:8002" },
  { name: "product-service", url: import.meta.env.VITE_PRODUCT_SERVICE_URL || null },
  { name: "cart-service", url: import.meta.env.VITE_CART_SERVICE_URL || null },
  { name: "order-service", url: import.meta.env.VITE_ORDER_SERVICE_URL || null },
  { name: "payment-service", url: import.meta.env.VITE_PAYMENT_SERVICE_URL || null },
];

function useHealth(url) {
  const [state, setState] = useState({ status: url ? "checking" : "planned", ms: null });

  useEffect(() => {
    if (!url) return;
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

    ping(); // one-time check on mount — no interval, no repeated polling

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}

function ServiceChip({ name, url }) {
  const { status, ms } = useHealth(url);

  const tone =
    status === "up" ? styles.chipUp : status === "down" ? styles.chipDown : styles.chipPlanned;

  const dotColor =
    status === "up" ? "var(--ok)" : status === "down" ? "var(--err)" : "var(--text-faint)";

  const metaText =
    status === "checking" ? "…" : status === "up" ? `${ms}ms` : status === "down" ? "down" : "planned";

  return (
    <div style={{ ...styles.chip, ...tone }}>
      <span
        style={{
          ...styles.dot,
          background: dotColor,
          boxShadow: status === "up" ? `0 0 6px ${dotColor}` : "none",
          animation: status === "checking" ? "pulse 1.4s ease-in-out infinite" : "none",
        }}
      />
      <span className="mono" style={styles.chipName}>{name}</span>
      <span className="mono" style={styles.chipMeta}>{metaText}</span>
    </div>
  );
}

export default function Navbar() {
  const upCount = SERVICES.filter((s) => s.url).length;

  return (
    <nav style={styles.bar}>
      <div style={styles.left}>
        <Layers size={14} style={{ color: "var(--text-faint)" }} />
        <span className="mono" style={styles.label}>SERVICES</span>
        <span className="mono" style={styles.count}>{upCount}/{SERVICES.length} live</span>
      </div>
      <div style={styles.chips}>
        {SERVICES.map((s) => (
          <ServiceChip key={s.name} name={s.name} url={s.url} />
        ))}
      </div>
    </nav>
  );
}

const styles = {
  bar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    padding: "12px 36px",
    background: "var(--bg-elevated)",
    borderBottom: "1px solid var(--border-soft)",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  label: {
    fontSize: "11px",
    color: "var(--text-faint)",
    letterSpacing: "0.1em",
  },
  count: {
    fontSize: "11px",
    color: "var(--text-dim)",
    background: "var(--panel-2)",
    padding: "2px 8px",
    borderRadius: "999px",
    border: "1px solid var(--border)",
  },
  chips: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 10px",
    borderRadius: "999px",
    border: "1px solid var(--border)",
    fontSize: "12px",
  },
  chipUp: {
    background: "var(--ok-soft)",
    borderColor: "rgba(79,195,138,0.25)",
  },
  chipDown: {
    background: "var(--err-soft)",
    borderColor: "rgba(239,111,97,0.25)",
  },
  chipPlanned: {
    background: "var(--panel-2)",
    opacity: 0.7,
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  chipName: {
    color: "var(--text)",
  },
  chipMeta: {
    color: "var(--text-faint)",
  },
};