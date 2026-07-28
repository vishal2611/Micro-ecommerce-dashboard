import { useEffect, useState, useCallback, useMemo } from "react";
import { Package, Clock, IndianRupee, X, Truck, CheckCircle2, Circle, XCircle } from "lucide-react";
import { orderApi } from "../api/client";

const STATUS_STYLES = {
  CONFIRMED: { bg: "var(--ok-soft)", color: "var(--ok)", border: "rgba(79,195,138,0.25)" },
  PENDING: { bg: "var(--accent-soft)", color: "var(--accent)", border: "rgba(232,163,61,0.25)" },
  FAILED: { bg: "var(--err-soft)", color: "var(--err)", border: "rgba(239,111,97,0.25)" },
  PAYMENT_FAILED: { bg: "var(--err-soft)", color: "var(--err)", border: "rgba(239,111,97,0.25)" },
  CANCELLED: { bg: "var(--panel-2)", color: "var(--text-dim)", border: "var(--border)" },
};

const STATUS_LABELS = {
  PAYMENT_FAILED: "PAYMENT FAILED",
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
  const label = STATUS_LABELS[status] || status;
  return (
    <span style={{ ...styles.badge, background: style.bg, color: style.color, borderColor: style.border }}>
      {label}
    </span>
  );
}

// Simple visual progress based only on the order's real status — no fabricated
// courier or address data, since order-service doesn't track shipping yet.
function DeliveryTracker({ status }) {
  const steps = ["CONFIRMED", "PREPARING", "SHIPPED"];
  const activeIndex = status === "CONFIRMED" ? 1 : 0;

  return (
    <div style={styles.tracker}>
      {steps.map((step, i) => (
        <div key={step} style={styles.trackerStep}>
          {i <= activeIndex ? (
            <CheckCircle2 size={14} style={{ color: "var(--ok)" }} />
          ) : (
            <Circle size={14} style={{ color: "var(--text-faint)" }} />
          )}
          <span style={{ color: i <= activeIndex ? "var(--text)" : "var(--text-faint)" }}>
            {step === "CONFIRMED" ? "Confirmed" : step === "PREPARING" ? "Preparing" : "Shipped"}
          </span>
          {i < steps.length - 1 && <div style={styles.trackerLine} />}
        </div>
      ))}
    </div>
  );
}

function PaymentFailedNotice() {
  return (
    <div style={styles.failedNotice}>
      <XCircle size={14} style={{ color: "var(--err)", flexShrink: 0 }} />
      <span>Payment wasn't completed for this order — stock has been restored.</span>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.list();
      setOrders(data || []);
    } catch {
      setError("Couldn't load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCancel = useCallback(async (orderId) => {
    setCancellingId(orderId);
    setError(null);
    try {
      const updated = await orderApi.cancel(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      setConfirmCancelId(null);
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't cancel order.");
    } finally {
      setCancellingId(null);
    }
  }, []);

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [orders]
  );

  return (
    <main style={styles.main}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Orders</h1>
          <p style={styles.pageSubtitle}>
            Served by order-service · each order is a frozen snapshot, immune to later price changes
          </p>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.skeletonList}>
          <div style={styles.skeletonRow} />
          <div style={styles.skeletonRow} />
        </div>
      ) : sortedOrders.length === 0 ? (
        <div style={styles.emptyState}>
          <Package size={28} style={{ color: "var(--text-faint)" }} />
          <p style={styles.emptyText}>No orders yet — place one from Cart.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {sortedOrders.map((order) => (
            <div key={order.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.orderId} className="mono">Order #{order.id}</div>
                  <div style={styles.orderDate}>
                    <Clock size={11} /> {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={styles.headerRight}>
                  <StatusBadge status={order.status} />
                  {order.status === "CONFIRMED" && (
                    <button
                      style={styles.cancelBtn}
                      onClick={() => setConfirmCancelId(order.id)}
                      disabled={cancellingId === order.id}
                    >
                      <X size={12} /> Cancel
                    </button>
                  )}
                </div>
              </div>

              {order.status === "CONFIRMED" && (
                <div style={styles.trackerWrap}>
                  <div style={styles.trackerLabel}>
                    <Truck size={12} /> Delivery status
                  </div>
                  <DeliveryTracker status={order.status} />
                </div>
              )}

              {order.status === "PAYMENT_FAILED" && <PaymentFailedNotice />}

              <div style={styles.itemsList}>
                {order.items.map((item) => (
                  <div key={item.id} style={styles.itemRow}>
                    <span style={styles.itemName}>{item.name} × {item.quantity}</span>
                    <span className="mono" style={styles.itemPrice}>
                      ₹{Number(item.lineTotal).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={styles.cardFooter}>
                <span style={styles.totalLabel}>Total</span>
                <span className="mono" style={styles.totalValue}>
                  <IndianRupee size={13} />{Number(order.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmCancelId && (
        <div style={styles.modalOverlay} onClick={() => setConfirmCancelId(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Cancel order #{confirmCancelId}?</h3>
              <button style={styles.modalClose} onClick={() => setConfirmCancelId(null)}>
                <X size={16} />
              </button>
            </div>
            <p style={styles.modalText}>
              This restores stock for every item in the order. This can't be undone.
            </p>
            <div style={styles.modalActions}>
              <button style={styles.keepBtn} onClick={() => setConfirmCancelId(null)}>
                Keep order
              </button>
              <button
                style={styles.confirmCancelBtn}
                onClick={() => handleCancel(confirmCancelId)}
                disabled={cancellingId === confirmCancelId}
              >
                {cancellingId === confirmCancelId ? "Cancelling…" : "Cancel order"}
              </button>
            </div>
          </div>
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
  error: {
    padding: "10px 12px", background: "var(--err-soft)", border: "1px solid rgba(239,111,97,0.25)",
    borderRadius: "var(--radius-sm)", color: "var(--err)", fontSize: "13px", marginBottom: "16px",
  },
  skeletonList: { display: "flex", flexDirection: "column", gap: "10px" },
  skeletonRow: {
    height: "110px", borderRadius: "var(--radius-lg)",
    background: "linear-gradient(90deg, var(--panel-2) 25%, var(--border-soft) 37%, var(--panel-2) 63%)",
    backgroundSize: "400% 100%", animation: "pulse 1.5s ease-in-out infinite",
  },
  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
    padding: "60px 20px", border: "1px dashed var(--border)", borderRadius: "var(--radius-lg)",
  },
  emptyText: { fontSize: "13px", color: "var(--text-faint)", margin: 0 },
  list: { display: "flex", flexDirection: "column", gap: "14px", maxWidth: "640px" },
  card: {
    background: "var(--panel)", border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-lg)", padding: "20px", animation: "fadeUp 0.3s ease both",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    paddingBottom: "14px", marginBottom: "14px", borderBottom: "1px solid var(--border-soft)",
  },
  headerRight: { display: "flex", alignItems: "center", gap: "10px" },
  orderId: { fontSize: "14px", fontWeight: 600 },
  orderDate: {
    display: "flex", alignItems: "center", gap: "5px",
    fontSize: "11.5px", color: "var(--text-faint)", marginTop: "4px",
  },
  badge: {
    fontSize: "10.5px", fontWeight: 600, padding: "4px 10px",
    borderRadius: "999px", border: "1px solid", letterSpacing: "0.04em", whiteSpace: "nowrap",
  },
  cancelBtn: {
    display: "flex", alignItems: "center", gap: "4px",
    background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--err)",
    borderRadius: "var(--radius-sm)", padding: "5px 10px", fontSize: "11.5px", fontWeight: 500,
  },
  trackerWrap: {
    background: "var(--panel-2)", borderRadius: "var(--radius-sm)",
    padding: "14px", marginBottom: "16px",
  },
  trackerLabel: {
    display: "flex", alignItems: "center", gap: "6px",
    fontSize: "11px", color: "var(--text-faint)", letterSpacing: "0.04em", marginBottom: "12px",
  },
  tracker: { display: "flex", alignItems: "center", gap: "6px" },
  trackerStep: { display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", position: "relative" },
  trackerLine: { width: "24px", height: "1px", background: "var(--border)", margin: "0 4px" },
  failedNotice: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "var(--err-soft)", border: "1px solid rgba(239,111,97,0.25)",
    borderRadius: "var(--radius-sm)", padding: "10px 12px", marginBottom: "16px",
    fontSize: "12.5px", color: "var(--err)",
  },
  itemsList: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" },
  itemRow: { display: "flex", justifyContent: "space-between", fontSize: "13px" },
  itemName: { color: "var(--text-dim)" },
  itemPrice: { color: "var(--text)" },
  cardFooter: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    paddingTop: "14px", borderTop: "1px solid var(--border-soft)",
  },
  totalLabel: { fontSize: "12.5px", color: "var(--text-dim)" },
  totalValue: {
    display: "flex", alignItems: "center", fontSize: "16px",
    fontWeight: 700, color: "var(--accent)",
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
  keepBtn: {
    flex: 1, background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text-dim)",
    borderRadius: "var(--radius-sm)", padding: "11px", fontSize: "13.5px", fontWeight: 500,
  },
  confirmCancelBtn: {
    flex: 1, background: "var(--err)", color: "#fff", border: "none",
    borderRadius: "var(--radius-sm)", padding: "11px", fontWeight: 600, fontSize: "13.5px",
  },
};