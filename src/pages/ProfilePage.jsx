import { useEffect, useState } from "react";
import {
  User, Phone, MapPin, Mail, Pencil, Trash2, X, Download,
  TrendingUp, ShoppingBag, CreditCard, Lock,
} from "lucide-react";
import { profileApi, orderApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}><Icon size={17} /></div>
      <div>
        <div style={styles.statLabel} className="mono">{label}</div>
        <div style={styles.statValue}>{value}</div>
      </div>
    </div>
  );
}

function LockedStat({ icon: Icon, label }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIconLocked}><Icon size={17} /></div>
      <div>
        <div style={styles.statLabel} className="mono">{label}</div>
        <div style={styles.statValueLocked}>
          <Lock size={11} /> Not tracked yet
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { email, userId } = useAuth();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mode, setMode] = useState("view");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", address: "" });

  useEffect(() => {
    let active = true;
    profileApi
      .get()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      })
      .catch((err) => {
        if (!active) return;
        if (err?.response?.status === 404) setMode("edit");
        else setError("Couldn't load profile.");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    orderApi
      .list()
      .then((data) => active && setOrders(data || []))
      .catch(() => {})
      .finally(() => active && setOrdersLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const data = profile ? await profileApi.update(form) : await profileApi.create(form);
      setProfile(data);
      setMode("view");
      setNotice(profile ? "Profile updated." : "Profile created.");
    } catch (err) {
      setError(err?.response?.data?.detail || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await profileApi.remove();
      setProfile(null);
      setForm({ full_name: "", phone: "", address: "" });
      setMode("edit");
      setNotice("Profile deleted.");
      setConfirmDelete(false);
    } catch (err) {
      setError(err?.response?.data?.detail || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  function downloadReport() {
    const rows = [
      ["Field", "Value"],
      ["User ID", userId ?? ""],
      ["Email", email ?? ""],
      ["Full name", profile?.full_name ?? ""],
      ["Phone", profile?.phone ?? ""],
      ["Address", profile?.address ?? ""],
      ["Exported at", new Date().toISOString()],
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profile-export-${userId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function cancelEdit() {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
    }
    setError(null);
    setMode("view");
  }

  // Real stats, derived from actual orders — no fabricated numbers.
  const now = new Date();
  const confirmedOrders = orders.filter((o) => o.status === "CONFIRMED");
  const monthlySpend = confirmedOrders
    .filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const totalOrdersCount = orders.length;

  return (
    <main style={styles.main}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Profile</h1>
          <p style={styles.pageSubtitle}>Your account, spending, and payment methods in one place.</p>
        </div>
        <button style={styles.downloadBtn} onClick={downloadReport}>
          <Download size={14} /> Export profile (CSV)
        </button>
      </div>

      <div style={styles.identityCard}>
        <div style={styles.identityAvatar}>{(email || "U")[0].toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.identityName}>{profile?.full_name || "No name set"}</div>
          <div style={styles.identityMetaRow}>
            <span style={styles.identityMeta}><Mail size={12} /> {email || "—"}</span>
            <span style={styles.identityMeta} className="mono">user_id: {userId}</span>
          </div>
        </div>
      </div>

      <div style={styles.statsRow}>
        {ordersLoading ? (
          <>
            <div style={styles.skeletonStat} />
            <div style={styles.skeletonStat} />
          </>
        ) : (
          <>
            <StatCard icon={TrendingUp} label="SPENT THIS MONTH" value={`₹${monthlySpend.toFixed(2)}`} />
            <StatCard icon={ShoppingBag} label="TOTAL ORDERS" value={totalOrdersCount} />
          </>
        )}
        <LockedStat icon={CreditCard} label="SAVED PAYMENT METHODS" />
      </div>

      <div style={styles.grid}>
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Bio details</h2>
              <p style={styles.panelSubtitle}>Managed by profile-service</p>
            </div>
            {mode === "view" && profile && (
              <div style={styles.headerActions}>
                <button style={styles.iconBtn} onClick={() => setMode("edit")}>
                  <Pencil size={14} /> Update
                </button>
                <button
                  style={{ ...styles.iconBtn, ...styles.iconBtnDanger }}
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {notice && <div style={styles.notice}>{notice}</div>}

          {loading ? (
            <div style={styles.loadingBlock}>
              <div style={styles.skeleton} />
              <div style={styles.skeleton} />
              <div style={{ ...styles.skeleton, width: "60%" }} />
            </div>
          ) : mode === "view" && profile ? (
            <div style={styles.viewCard}>
              <Row icon={User} label="FULL NAME" value={profile.full_name} />
              <Row icon={Phone} label="PHONE" value={profile.phone} />
              <Row icon={MapPin} label="ADDRESS" value={profile.address} />
            </div>
          ) : (
            <form onSubmit={handleSave} style={styles.form}>
              <Field icon={User} label="FULL NAME" value={form.full_name}
                onChange={(v) => setForm({ ...form, full_name: v })} placeholder="Jane Cooper" />
              <Field icon={Phone} label="PHONE" value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })} placeholder="+91 98765 43210" />
              <div style={styles.field}>
                <label style={styles.label} className="mono">ADDRESS</label>
                <div style={styles.inputWrap}>
                  <MapPin size={15} style={{ ...styles.inputIcon, marginTop: "11px" }} />
                  <textarea
                    style={{ ...styles.input, resize: "vertical", minHeight: "76px", paddingLeft: "34px" }}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Shipping address"
                  />
                </div>
              </div>
              <div style={styles.formActions}>
                <button style={styles.submit} type="submit" disabled={saving}>
                  {saving ? "Saving…" : profile ? "Save changes" : "Create profile"}
                </button>
                {profile && <button type="button" style={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>}
              </div>
            </form>
          )}
        </section>

        <aside style={styles.sidePanel}>
          <div style={styles.sideCard}>
            <div style={styles.sideCardTitle}>Payment methods</div>
            <div style={styles.emptyState}>
              <CreditCard size={20} style={{ color: "var(--text-faint)" }} />
              <p style={styles.emptyText}>
                Cards aren't saved — every checkout goes through Razorpay directly, nothing is stored here.
              </p>
            </div>
          </div>

          <div style={styles.sideCard}>
            <div style={styles.sideCardTitle}>Recent orders</div>
            {ordersLoading ? (
              <div style={styles.emptyState}>
                <TrendingUp size={20} style={{ color: "var(--text-faint)" }} />
                <p style={styles.emptyText}>Loading…</p>
              </div>
            ) : orders.length === 0 ? (
              <div style={styles.emptyState}>
                <TrendingUp size={20} style={{ color: "var(--text-faint)" }} />
                <p style={styles.emptyText}>No orders yet — visit Products to get started.</p>
              </div>
            ) : (
              <div style={styles.recentList}>
                {orders.slice(0, 4).map((o) => (
                  <div key={o.id} style={styles.recentRow}>
                    <span>Order #{o.id}</span>
                    <span className="mono">₹{Number(o.totalAmount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {confirmDelete && (
        <div style={styles.modalOverlay} onClick={() => setConfirmDelete(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Delete profile?</h3>
              <button style={styles.modalClose} onClick={() => setConfirmDelete(false)}><X size={16} /></button>
            </div>
            <p style={styles.modalText}>This removes your name, phone, and address. This can't be undone.</p>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button
                style={{ ...styles.submit, background: "var(--err)", boxShadow: "none" }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div style={styles.viewRow}>
      <div style={styles.viewIcon}><Icon size={16} /></div>
      <div>
        <div style={styles.viewLabel} className="mono">{label}</div>
        <div style={styles.viewValue}>{value || "—"}</div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, placeholder }) {
  return (
    <div style={styles.field}>
      <label style={styles.label} className="mono">{label}</label>
      <div style={styles.inputWrap}>
        <Icon size={15} style={styles.inputIcon} />
        <input
          style={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

const styles = {
  main: { padding: "24px 36px 40px" },
  headerRow: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    flexWrap: "wrap", gap: "14px", marginBottom: "22px",
  },
  pageTitle: { fontSize: "24px", margin: 0, fontWeight: 600, letterSpacing: "-0.01em" },
  pageSubtitle: { margin: "4px 0 0", color: "var(--text-dim)", fontSize: "13.5px" },
  downloadBtn: {
    display: "flex", alignItems: "center", gap: "7px",
    background: "var(--panel-2)", border: "1px solid var(--border)",
    color: "var(--text)", borderRadius: "var(--radius-sm)", padding: "9px 14px", fontSize: "13px",
  },
  identityCard: {
    display: "flex", alignItems: "center", gap: "14px",
    background: "var(--panel)", border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-lg)", padding: "18px 22px", marginBottom: "20px",
  },
  identityAvatar: {
    width: "46px", height: "46px", borderRadius: "50%",
    background: "linear-gradient(135deg, var(--accent), #c67a1e)",
    color: "#1a1206", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: "18px", flexShrink: 0,
  },
  identityName: { fontSize: "16px", fontWeight: 600 },
  identityMetaRow: { display: "flex", gap: "16px", marginTop: "4px", flexWrap: "wrap" },
  identityMeta: {
    display: "flex", alignItems: "center", gap: "5px",
    fontSize: "12.5px", color: "var(--text-dim)",
  },
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px", marginBottom: "20px",
  },
  statCard: {
    display: "flex", alignItems: "center", gap: "12px",
    background: "var(--panel)", border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-md)", padding: "16px",
  },
  skeletonStat: {
    height: "62px", borderRadius: "var(--radius-md)",
    background: "linear-gradient(90deg, var(--panel-2) 25%, var(--border-soft) 37%, var(--panel-2) 63%)",
    backgroundSize: "400% 100%", animation: "pulse 1.5s ease-in-out infinite",
  },
  statIcon: {
    width: "36px", height: "36px", borderRadius: "var(--radius-sm)",
    background: "var(--accent-soft)", color: "var(--accent)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  statIconLocked: {
    width: "36px", height: "36px", borderRadius: "var(--radius-sm)",
    background: "var(--panel-2)", display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--text-dim)", flexShrink: 0,
  },
  statLabel: { fontSize: "10.5px", color: "var(--text-faint)", letterSpacing: "0.06em" },
  statValue: { fontSize: "15px", fontWeight: 600, marginTop: "2px" },
  statValueLocked: {
    display: "flex", alignItems: "center", gap: "5px",
    fontSize: "12.5px", color: "var(--text-faint)", marginTop: "3px",
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 280px", gap: "18px", alignItems: "start" },
  panel: {
    background: "var(--panel)", border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-lg)", padding: "28px", boxShadow: "var(--shadow-md)",
  },
  panelHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px",
    marginBottom: "22px", paddingBottom: "18px", borderBottom: "1px solid var(--border-soft)",
  },
  panelTitle: { margin: 0, fontSize: "16px", fontWeight: 600 },
  panelSubtitle: { margin: "5px 0 0", color: "var(--text-faint)", fontSize: "12.5px" },
  headerActions: { display: "flex", gap: "8px", flexShrink: 0 },
  iconBtn: {
    display: "flex", alignItems: "center", gap: "6px",
    background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text-dim)",
    borderRadius: "var(--radius-sm)", padding: "7px 12px", fontSize: "12.5px", fontWeight: 500,
  },
  iconBtnDanger: { color: "var(--err)" },
  viewCard: { display: "flex", flexDirection: "column", gap: "18px" },
  viewRow: { display: "flex", alignItems: "flex-start", gap: "12px" },
  viewIcon: {
    width: "32px", height: "32px", borderRadius: "var(--radius-sm)",
    background: "var(--panel-2)", border: "1px solid var(--border)",
    display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", flexShrink: 0,
  },
  viewLabel: { fontSize: "10.5px", color: "var(--text-faint)", letterSpacing: "0.08em" },
  viewValue: { fontSize: "14.5px", marginTop: "3px", color: "var(--text)" },
  loadingBlock: { display: "flex", flexDirection: "column", gap: "14px" },
  skeleton: {
    height: "42px", borderRadius: "var(--radius-sm)",
    background: "linear-gradient(90deg, var(--panel-2) 25%, var(--border-soft) 37%, var(--panel-2) 63%)",
    backgroundSize: "400% 100%", animation: "pulse 1.5s ease-in-out infinite",
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "10.5px", color: "var(--text-faint)", letterSpacing: "0.08em" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "11px", color: "var(--text-faint)", pointerEvents: "none" },
  input: {
    width: "100%", background: "var(--panel-2)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)", padding: "10px 12px 10px 34px",
    color: "var(--text)", fontSize: "14px", fontFamily: "inherit",
  },
  error: {
    padding: "10px 12px", background: "var(--err-soft)", border: "1px solid rgba(239,111,97,0.25)",
    borderRadius: "var(--radius-sm)", color: "var(--err)", fontSize: "13px", marginBottom: "16px",
  },
  notice: {
    padding: "10px 12px", background: "var(--ok-soft)", border: "1px solid rgba(79,195,138,0.25)",
    borderRadius: "var(--radius-sm)", color: "var(--ok)", fontSize: "13px", marginBottom: "16px",
  },
  formActions: { display: "flex", gap: "10px", marginTop: "4px" },
  submit: {
    flex: 1, background: "linear-gradient(135deg, var(--accent), #c67a1e)", color: "#1a1206",
    border: "none", borderRadius: "var(--radius-sm)", padding: "12px", fontWeight: 600,
    fontSize: "14px", boxShadow: "var(--shadow-glow)",
  },
  cancelBtn: {
    background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text-dim)",
    borderRadius: "var(--radius-sm)", padding: "12px 18px", fontSize: "14px", fontWeight: 500,
  },
  sidePanel: { display: "flex", flexDirection: "column", gap: "16px" },
  sideCard: {
    background: "var(--panel)", border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-lg)", padding: "20px",
  },
  sideCardTitle: { fontSize: "12.5px", fontWeight: 600, color: "var(--text-dim)", marginBottom: "14px" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "12px 4px", textAlign: "center" },
  emptyText: { fontSize: "12px", color: "var(--text-faint)", lineHeight: 1.6, margin: 0 },
  recentList: { display: "flex", flexDirection: "column", gap: "10px" },
  recentRow: {
    display: "flex", justifyContent: "space-between", fontSize: "12.5px",
    color: "var(--text-dim)", paddingBottom: "8px", borderBottom: "1px solid var(--border-soft)",
  },
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 50,
  },
  modal: {
    width: "100%", maxWidth: "360px", background: "var(--panel)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "24px", boxShadow: "var(--shadow-md)",
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { margin: 0, fontSize: "16px", fontWeight: 600 },
  modalClose: { background: "none", border: "none", color: "var(--text-dim)", padding: "4px" },
  modalText: { color: "var(--text-dim)", fontSize: "13.5px", lineHeight: 1.6, margin: "12px 0 20px" },
  modalActions: { display: "flex", gap: "10px" },
};