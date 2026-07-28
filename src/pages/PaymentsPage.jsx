import { useEffect, useState } from "react";
import { CreditCard, Clock, IndianRupee, CheckCircle2, XCircle } from "lucide-react";
import { paymentApi } from "../api/client";

const STATUS_CONFIG = {
  SUCCESS: { bg: "var(--ok-soft)", color: "var(--ok)", border: "rgba(79,195,138,0.25)", icon: CheckCircle2 },
  FAILED: { bg: "var(--err-soft)", color: "var(--err)", border: "rgba(239,111,97,0.25)", icon: XCircle },
  CREATED: { bg: "var(--accent-soft)", color: "var(--accent)", border: "rgba(232,163,61,0.25)", icon: Clock },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.CREATED;
  const Icon = cfg.icon;
  return (
    <span style={{ ...styles.badge, background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      <Icon size={11} /> {status}
    </span>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    paymentApi
      .list()
      .then((data) => active && setPayments(data || []))
      .catch(() => active && setError("Couldn't load payments."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const totalPaid = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <main style={styles.main}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Payments</h1>
          <p style={styles.pageSubtitle}>
            Served by payment-service · verified via Razorpay signature, never trusted from the client alone
          </p>
        </div>
      </div>

      {!loading && payments.length > 0 && (
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statLabel} className="mono">TOTAL PAID</div>
            <div style={styles.statValue}>₹{totalPaid.toFixed(2)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel} className="mono">TRANSACTIONS</div>
            <div style={styles.statValue}>{payments.length}</div>
          </div>
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.skeletonList}>
          <div style={styles.skeletonRow} />
          <div style={styles.skeletonRow} />
        </div>
      ) : payments.length === 0 ? (
        <div style={styles.emptyState}>
          <CreditCard size={28} style={{ color: "var(--text-faint)" }} />
          <p style={styles.emptyText}>No payments yet — complete a checkout to see them here.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {payments.map((p) => (
            <div key={p.id} style={styles.row}>
              <div style={styles.rowIcon}>
                <CreditCard size={16} />
              </div>
              <div style={styles.rowInfo}>
                <div style={styles.rowTitle}>Order #{p.order_id}</div>
                <div style={styles.rowDate}>
                  <Clock size={10} /> {new Date(p.created_at).toLocaleString()}
                </div>
              </div>
              <div style={styles.rowAmount} className="mono">
                <IndianRupee size={12} />{Number(p.amount).toFixed(2)}
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

const styles = {
  main: { padding: "24px 36px 40px" },
  headerRow: { marginBottom: "22px" },
  pageTitle: { fontSize: "24px", margin: 0, fontWeight: 600, letterSpacing: "-0.01em" },
  pageSubtitle: { margin: "4px 0 0", color: "var(--text-dim)", fontSize: "13px" },
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "14px", marginBottom: "22px", maxWidth: "500px",
  },
  statCard: {
    background: "var(--panel)", border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-md)", padding: "16px",
  },
  statLabel: { fontSize: "10.5px", color: "var(--text-faint)", letterSpacing: "0.06em" },
  statValue: { fontSize: "20px", fontWeight: 700, marginTop: "4px", color: "var(--accent)" },
  error: {
    padding: "10px 12px", background: "var(--err-soft)", border: "1px solid rgba(239,111,97,0.25)",
    borderRadius: "var(--radius-sm)", color: "var(--err)", fontSize: "13px", marginBottom: "16px",
  },
  skeletonList: { display: "flex", flexDirection: "column", gap: "10px" },
  skeletonRow: {
    height: "60px", borderRadius: "var(--radius-md)",
    background: "linear-gradient(90deg, var(--panel-2) 25%, var(--border-soft) 37%, var(--panel-2) 63%)",
    backgroundSize: "400% 100%", animation: "pulse 1.5s ease-in-out infinite",
  },
  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
    padding: "60px 20px", border: "1px dashed var(--border)", borderRadius: "var(--radius-lg)",
  },
  emptyText: { fontSize: "13px", color: "var(--text-faint)", margin: 0 },
  list: { display: "flex", flexDirection: "column", gap: "10px", maxWidth: "640px" },
  row: {
    display: "flex", alignItems: "center", gap: "14px",
    background: "var(--panel)", border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-md)", padding: "14px 16px", animation: "fadeUp 0.3s ease both",
  },
  rowIcon: {
    width: "36px", height: "36px", borderRadius: "var(--radius-sm)",
    background: "var(--panel-2)", display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--text-dim)", flexShrink: 0,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: "13.5px", fontWeight: 600 },
  rowDate: {
    display: "flex", alignItems: "center", gap: "4px",
    fontSize: "11px", color: "var(--text-faint)", marginTop: "3px",
  },
  rowAmount: {
    display: "flex", alignItems: "center", fontSize: "14px", fontWeight: 600, flexShrink: 0,
  },
  badge: {
    display: "flex", alignItems: "center", gap: "4px",
    fontSize: "10.5px", fontWeight: 600, padding: "4px 10px",
    borderRadius: "999px", border: "1px solid", letterSpacing: "0.03em", flexShrink: 0,
  },
};