import { ShieldCheck, User, CheckCircle2, Layers, GitBranch, Lock, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { profileApi } from "../api/client";

function StatCard({ icon: Icon, label, value, tone = "default" }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, ...(tone === "accent" ? styles.statIconAccent : {}) }}>
        <Icon size={17} />
      </div>
      <div>
        <div style={styles.statLabel} className="mono">{label}</div>
        <div style={styles.statValue}>{value}</div>
      </div>
    </div>
  );
}

function ArchCard({ icon: Icon, title, text }) {
  return (
    <div style={styles.archCard}>
      <div style={styles.archIcon}><Icon size={16} /></div>
      <div>
        <div style={styles.archTitle}>{title}</div>
        <p style={styles.archText}>{text}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    profileApi
      .get()
      .then((data) => active && setProfile(data))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const completeness = profile
    ? ["full_name", "phone", "address"].filter((k) => profile[k]?.trim()).length
    : 0;

  return (
    <main style={styles.main}>
      <div style={styles.statsRow}>
        <StatCard icon={ShieldCheck} label="ACCOUNT STATUS" value="Verified" tone="accent" />
        <StatCard icon={User} label="PROFILE" value={loading ? "…" : profile ? "Complete" : "Not set up"} />
        <StatCard icon={CheckCircle2} label="FIELDS FILLED" value={loading ? "…" : `${completeness} / 3`} />
      </div>

      {/* Client-facing explainer */}
      <section style={styles.explainerPanel}>
        <div style={styles.explainerHeader}>
          <h2 style={styles.explainerTitle}>How this platform is built</h2>
          <p style={styles.explainerSubtitle}>
            A plain-language overview of the system behind your account — for anyone reviewing
            the architecture, not just engineers.
          </p>
        </div>

        <div style={styles.archGrid}>
          <ArchCard
            icon={Layers}
            title="Independent services, not one app"
            text="Sign-in and your profile are handled by two separate services, each with its own database. A change or issue in one doesn't take down the other — the same pattern used by large-scale platforms like Amazon and Netflix."
          />
          <ArchCard
            icon={Lock}
            title="Identity verified everywhere, centrally"
            text="When you sign in, you receive a signed token. Every other service checks that token independently — no service has to ask another 'is this really you?' over an unprotected channel."
          />
          <ArchCard
            icon={GitBranch}
            title="Built to grow without a rewrite"
            text="Products, orders, and payments are designed as separate services from day one. Each new capability plugs into this same account and login — nothing about today's system needs to be rebuilt to support them."
          />
          <ArchCard
            icon={Zap}
            title="Changes deploy independently"
            text="Because each service is deployed on its own, updates to your profile experience ship without touching sign-in, and vice versa — smaller, safer releases instead of one large risky deployment."
          />
        </div>

        <div style={styles.serviceLegend}>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: "var(--ok)" }} />
            <span>Live — actively serving requests</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: "var(--text-faint)" }} />
            <span>Planned — designed, not yet built</span>
          </div>
          <p style={styles.legendNote}>
            See the live status of every service in the bar above — that reflects the real,
            current state of the system, not a mockup.
          </p>
        </div>
      </section>

      <div style={styles.sideCard}>
        <div style={styles.sideCardTitle}>What's next</div>
        <ul style={styles.checklist}>
          <li style={styles.checklistItem}>
            <span style={{ ...styles.checkDot, background: "var(--ok)" }} />
            Account created
          </li>
          <li style={styles.checklistItem}>
            <span style={{ ...styles.checkDot, background: profile ? "var(--ok)" : "var(--text-faint)" }} />
            Profile set up — visit the Profile tab
          </li>
          <li style={styles.checklistItem}>
            <span style={{ ...styles.checkDot, background: "var(--text-faint)" }} />
            Add a payment method
          </li>
        </ul>
      </div>
    </main>
  );
}

const styles = {
  main: { padding: "4px 36px 40px" },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "24px",
  },
  statCard: {
    display: "flex", alignItems: "center", gap: "12px",
    background: "var(--panel)", border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-md)", padding: "16px", animation: "fadeUp 0.4s ease both",
  },
  statIcon: {
    width: "36px", height: "36px", borderRadius: "var(--radius-sm)",
    background: "var(--panel-2)", display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--text-dim)", flexShrink: 0,
  },
  statIconAccent: { background: "var(--accent-soft)", color: "var(--accent)" },
  statLabel: { fontSize: "10.5px", color: "var(--text-faint)", letterSpacing: "0.06em" },
  statValue: { fontSize: "15px", fontWeight: 600, marginTop: "2px" },

  explainerPanel: {
    background: "var(--panel)",
    border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-lg)",
    padding: "28px",
    marginBottom: "20px",
    boxShadow: "var(--shadow-md)",
    animation: "fadeUp 0.4s ease both",
  },
  explainerHeader: {
    marginBottom: "22px",
    paddingBottom: "18px",
    borderBottom: "1px solid var(--border-soft)",
  },
  explainerTitle: { margin: 0, fontSize: "17px", fontWeight: 600 },
  explainerSubtitle: { margin: "6px 0 0", color: "var(--text-dim)", fontSize: "13px", lineHeight: 1.6, maxWidth: "560px" },

  archGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  },
  archCard: { display: "flex", alignItems: "flex-start", gap: "12px" },
  archIcon: {
    width: "32px", height: "32px", borderRadius: "var(--radius-sm)",
    background: "var(--accent-soft)", color: "var(--accent)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  archTitle: { fontSize: "13.5px", fontWeight: 600, marginBottom: "4px" },
  archText: { margin: 0, fontSize: "12.5px", color: "var(--text-dim)", lineHeight: 1.6 },

  serviceLegend: {
    borderTop: "1px solid var(--border-soft)",
    paddingTop: "16px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "18px",
  },
  legendItem: { display: "flex", alignItems: "center", gap: "7px", fontSize: "12.5px", color: "var(--text-dim)" },
  legendDot: { width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0 },
  legendNote: { margin: 0, fontSize: "12px", color: "var(--text-faint)", lineHeight: 1.6 },

  sideCard: {
    background: "var(--panel)", border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-lg)", padding: "20px", maxWidth: "320px",
  },
  sideCardTitle: { fontSize: "12.5px", fontWeight: 600, color: "var(--text-dim)", marginBottom: "12px" },
  checklist: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "10px" },
  checklistItem: { display: "flex", alignItems: "center", gap: "9px", fontSize: "13px", color: "var(--text-dim)" },
  checkDot: { width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0 },
};