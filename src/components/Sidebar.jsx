import { LayoutGrid, User, Package, ShoppingCart, Boxes, CreditCard, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { icon: LayoutGrid, label: "Overview", key: "overview" },
  { icon: User, label: "Profile", key: "profile" },
  { icon: Package, label: "Products", key: "products" },
  { icon: ShoppingCart, label: "Cart", key: "cart" },
  { icon: Boxes, label: "Orders", key: "orders" },
  { icon: CreditCard, label: "Payments", key: "payments" },
];

export default function Sidebar({ active, onNavigate }) {
  const { userId, email, logout } = useAuth();
  const initial = email ? email[0].toUpperCase() : "U";

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.brandMark}>E</div>
        <span style={styles.brandName}>ecommerce</span>
      </div>

      <nav style={styles.nav}>
        {NAV.map(({ icon: Icon, label, key, soon }) => (
          <button
            key={label}
            style={{
              ...styles.navItem,
              ...(active === key ? styles.navItemActive : {}),
              ...(soon ? styles.navItemDisabled : {}),
            }}
            onClick={() => !soon && onNavigate(key)}
            disabled={soon}
          >
            <Icon size={17} strokeWidth={2} />
            <span>{label}</span>
            {soon && <span style={styles.soonBadge}>soon</span>}
          </button>
        ))}
      </nav>

      <div style={styles.footer}>
        <div style={styles.userCard}>
          <div style={styles.avatar}>{initial}</div>
          <div style={{ minWidth: 0 }}>
            <div style={styles.userEmail} className="mono">{email || `user_id: ${userId}`}</div>
            <div style={styles.userSub}>Signed in</div>
          </div>
        </div>
        <button style={styles.logoutBtn} onClick={logout}>
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "240px",
    flexShrink: 0,
    background: "var(--bg-elevated)",
    borderRight: "1px solid var(--border-soft)",
    display: "flex",
    flexDirection: "column",
    padding: "22px 16px",
    height: "100vh",
    position: "sticky",
    top: 0,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 8px",
    marginBottom: "32px",
  },
  brandMark: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, var(--accent), #c67a1e)",
    color: "#1a1206",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "14px",
    boxShadow: "var(--shadow-sm)",
  },
  brandName: {
    fontWeight: 600,
    fontSize: "15px",
    letterSpacing: "-0.01em",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "9px 12px",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-dim)",
    fontSize: "13.5px",
    fontWeight: 500,
    background: "transparent",
    border: "none",
    width: "100%",
    textAlign: "left",
  },
  navItemActive: {
    background: "var(--accent-soft)",
    color: "var(--accent)",
  },
  navItemDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  soonBadge: {
    marginLeft: "auto",
    fontSize: "10px",
    color: "var(--text-faint)",
    background: "var(--panel-2)",
    padding: "2px 6px",
    borderRadius: "4px",
    fontFamily: "var(--font-mono)",
  },
  footer: {
    borderTop: "1px solid var(--border-soft)",
    paddingTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "var(--panel-2)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-dim)",
    flexShrink: 0,
  },
  userEmail: {
    fontSize: "11.5px",
    color: "var(--text)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userSub: {
    fontSize: "11px",
    color: "var(--ok)",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text-dim)",
    borderRadius: "var(--radius-sm)",
    padding: "8px 12px",
    fontSize: "13px",
  },
};