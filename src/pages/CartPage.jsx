import { useEffect, useState, useCallback, useMemo } from "react";
import { ShoppingCart, Minus, Plus, Trash2, IndianRupee, Package, CheckCircle2, MapPin, X, Plus as PlusIcon } from "lucide-react";
import { cartApi, orderApi, paymentApi, addressApi } from "../api/client";

export default function CartPage() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "Home", line: "", city: "", pincode: "" });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState(null);

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cartApi.view();
      setCart(data);
    } catch {
      setError("Couldn't load cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const changeQuantity = useCallback(async (productId, newQty) => {
    if (newQty <= 0) return handleRemove(productId);
    setBusyId(productId);
    setError(null);
    try {
      const data = await cartApi.updateQuantity(productId, newQty);
      setCart(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't update quantity.");
    } finally {
      setBusyId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = useCallback(async (productId) => {
    setBusyId(productId);
    setError(null);
    try {
      const data = await cartApi.removeItem(productId);
      setCart(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't remove item.");
    } finally {
      setBusyId(null);
    }
  }, []);

  const handleClear = useCallback(async () => {
    setError(null);
    try {
      await cartApi.clear();
      setCart({ items: [], total: 0 });
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't clear cart.");
    }
  }, []);

  const openAddressModal = useCallback(async () => {
    setError(null);
    setAddressError(null);
    setShowAddressModal(true);
    setAddressesLoading(true);
    try {
      const data = await addressApi.list();
      setAddresses(data || []);
      if (data && data.length > 0) setSelectedAddressId(data[0].id);
      else setShowNewAddressForm(true);
    } catch {
      setAddressError("Couldn't load addresses.");
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  const handleAddAddress = useCallback(async (e) => {
    e.preventDefault();
    setNewAddress((current) => {
      if (!current.line.trim()) {
        setAddressError("Address line is required.");
        return current;
      }
      (async () => {
        setSavingAddress(true);
        setAddressError(null);
        try {
          const saved = await addressApi.add(current);
          setAddresses((prev) => [saved, ...prev]);
          setSelectedAddressId(saved.id);
          setShowNewAddressForm(false);
          setNewAddress({ label: "Home", line: "", city: "", pincode: "" });
        } catch (err) {
          setAddressError(err?.response?.data?.detail || "Couldn't save address.");
        } finally {
          setSavingAddress(false);
        }
      })();
      return current;
    });
  }, []);

  const startPayment = useCallback(async (order) => {
    if (typeof window.Razorpay === "undefined") {
      setError("Payment gateway still loading — please try again in a moment.");
      return;
    }

    try {
      const paymentOrder = await paymentApi.createOrder(order.id);

      let paymentSucceeded = false;

      const options = {
        key: paymentOrder.razorpay_key_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "ecommerce",
        description: `Order #${order.id}`,
        order_id: paymentOrder.razorpay_order_id,
        handler: async function (response) {
          paymentSucceeded = true;
          try {
            await paymentApi.verify(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            setOrderPlaced(order);
          } catch (err) {
            setError("Payment verification failed. Order was cancelled.");
          }
        },
        modal: {
          ondismiss: async function () {
            if (paymentSucceeded) return;
            try {
              await orderApi.cancel(order.id, "payment_failed");
            } catch (e) {}
            loadCart();
          },
        },
        theme: { color: "#e8a33d" },
      };

      const rzp = new window.Razorpay(options);
      setTimeout(() => rzp.open(), 0);
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't start payment.");
    }
  }, [loadCart]);

  const confirmAddressAndCheckout = useCallback(async () => {
    const selected = addresses.find((a) => a.id === selectedAddressId);
    if (!selected) {
      setAddressError("Select an address to continue.");
      return;
    }

    const fullAddress = [selected.line, selected.city, selected.pincode].filter(Boolean).join(", ");

    setShowAddressModal(false);
    setCheckingOut(true);
    setError(null);
    setOrderPlaced(null);
    try {
      const order = await orderApi.checkout(fullAddress);
      setCart({ items: [], total: 0 });
      await startPayment(order);
    } catch (err) {
      setError(err?.response?.data?.detail || "Checkout failed.");
    } finally {
      setCheckingOut(false);
    }
  }, [addresses, selectedAddressId, startPayment]);

  // Memoized so the cart list only recomputes when the cart data itself changes.
  const itemCount = useMemo(() => cart.items.length, [cart.items]);
  const cartTotal = useMemo(() => Number(cart.total).toFixed(2), [cart.total]);

  if (orderPlaced) {
    return (
      <main style={styles.main}>
        <div style={styles.successCard}>
          <CheckCircle2 size={32} style={{ color: "var(--ok)" }} />
          <h2 style={styles.successTitle}>Order confirmed</h2>
          <p style={styles.successSubtitle}>
            Order #{orderPlaced.id} · {orderPlaced.items.length} item(s) · ₹{Number(orderPlaced.totalAmount).toFixed(2)}
          </p>
          <div style={styles.successItems}>
            {orderPlaced.items.map((item) => (
              <div key={item.id} style={styles.successItemRow}>
                <span>{item.name} × {item.quantity}</span>
                <span className="mono">₹{Number(item.lineTotal).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <button style={styles.submit} onClick={() => setOrderPlaced(null)}>
            Back to cart
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Cart</h1>
          <p style={styles.pageSubtitle}>
            Served by cart-service · live prices pulled from product-service on every view
          </p>
        </div>
        {itemCount > 0 && (
          <button style={styles.clearBtn} onClick={handleClear}>
            <Trash2 size={14} /> Clear cart
          </button>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.skeletonList}>
          <div style={styles.skeletonRow} />
          <div style={styles.skeletonRow} />
        </div>
      ) : itemCount === 0 ? (
        <div style={styles.emptyState}>
          <ShoppingCart size={28} style={{ color: "var(--text-faint)" }} />
          <p style={styles.emptyText}>Your cart is empty — add something from Products.</p>
        </div>
      ) : (
        <div style={styles.layout}>
          <div style={styles.itemsList}>
            {cart.items.map((item) => (
              <div key={item.product_id} style={styles.itemRow}>
                <div style={styles.itemImage}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name || ""} style={styles.img} loading="lazy" />
                  ) : (
                    <Package size={20} style={{ color: "var(--text-faint)" }} />
                  )}
                </div>
                <div style={styles.itemInfo}>
                  <div style={styles.itemName}>{item.name || `Product #${item.product_id}`}</div>
                  {item.note ? (
                    <div style={styles.itemNote}>{item.note}</div>
                  ) : (
                    <div style={styles.itemPrice}><IndianRupee size={11} /> {Number(item.price).toFixed(2)} each</div>
                  )}
                </div>

                <div style={styles.qtyControls}>
                  <button
                    style={styles.qtyBtn}
                    onClick={() => changeQuantity(item.product_id, item.quantity - 1)}
                    disabled={busyId === item.product_id}
                  >
                    <Minus size={13} />
                  </button>
                  <span style={styles.qtyValue} className="mono">{item.quantity}</span>
                  <button
                    style={styles.qtyBtn}
                    onClick={() => changeQuantity(item.product_id, item.quantity + 1)}
                    disabled={busyId === item.product_id}
                  >
                    <Plus size={13} />
                  </button>
                </div>

                <div style={styles.lineTotal}>
                  {item.line_total != null ? `₹${Number(item.line_total).toFixed(2)}` : "—"}
                </div>

                <button
                  style={styles.removeBtn}
                  onClick={() => handleRemove(item.product_id)}
                  disabled={busyId === item.product_id}
                  title="Remove item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <aside style={styles.summary}>
            <div style={styles.summaryTitle}>Order summary</div>
            <div style={styles.summaryRow}>
              <span>Items</span>
              <span className="mono">{itemCount}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Total</span>
              <span className="mono" style={styles.summaryTotal}>₹{cartTotal}</span>
            </div>
            <button style={styles.checkoutBtn} onClick={openAddressModal} disabled={checkingOut}>
              {checkingOut ? "Placing order…" : "Checkout"}
            </button>
          </aside>
        </div>
      )}

      {showAddressModal && (
        <div style={styles.modalOverlay} onClick={() => !savingAddress && setShowAddressModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Deliver to</h3>
              <button style={styles.modalClose} onClick={() => setShowAddressModal(false)}>
                <X size={16} />
              </button>
            </div>

            {addressError && <div style={styles.addrError}>{addressError}</div>}

            {addressesLoading ? (
              <div style={styles.addrSkeleton} />
            ) : (
              <>
                {addresses.length > 0 && !showNewAddressForm && (
                  <div style={styles.addressList}>
                    {addresses.map((a) => (
                      <label
                        key={a.id}
                        style={{
                          ...styles.addressOption,
                          ...(selectedAddressId === a.id ? styles.addressOptionSelected : {}),
                        }}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === a.id}
                          onChange={() => setSelectedAddressId(a.id)}
                          style={styles.radio}
                        />
                        <MapPin size={15} style={{ color: "var(--text-dim)", flexShrink: 0, marginTop: "2px" }} />
                        <div>
                          <div style={styles.addrLabel}>{a.label}</div>
                          <div style={styles.addrLine}>
                            {[a.line, a.city, a.pincode].filter(Boolean).join(", ")}
                          </div>
                        </div>
                      </label>
                    ))}

                    <button style={styles.addNewBtn} onClick={() => setShowNewAddressForm(true)}>
                      <PlusIcon size={14} /> Add new address
                    </button>
                  </div>
                )}

                {showNewAddressForm && (
                  <form onSubmit={handleAddAddress} style={styles.addrForm}>
                    <input
                      style={styles.addrInput}
                      placeholder="Label (e.g. Home, Work)"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress((p) => ({ ...p, label: e.target.value }))}
                    />
                    <textarea
                      style={{ ...styles.addrInput, minHeight: "60px", resize: "vertical" }}
                      placeholder="Address line"
                      required
                      value={newAddress.line}
                      onChange={(e) => setNewAddress((p) => ({ ...p, line: e.target.value }))}
                    />
                    <div style={styles.addrRow2}>
                      <input
                        style={styles.addrInput}
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                      />
                      <input
                        style={styles.addrInput}
                        placeholder="Pincode"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress((p) => ({ ...p, pincode: e.target.value }))}
                      />
                    </div>
                    <div style={styles.addrFormActions}>
                      <button style={styles.saveAddrBtn} type="submit" disabled={savingAddress}>
                        {savingAddress ? "Saving…" : "Save address"}
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          style={styles.cancelBtn}
                          onClick={() => setShowNewAddressForm(false)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {!showNewAddressForm && addresses.length > 0 && (
                  <button style={styles.confirmAddrBtn} onClick={confirmAddressAndCheckout}>
                    Deliver here
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

const styles = {
  main: { padding: "24px 36px 40px" },
  headerRow: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    flexWrap: "wrap", gap: "14px", marginBottom: "22px",
  },
  pageTitle: { fontSize: "24px", margin: 0, fontWeight: 600, letterSpacing: "-0.01em" },
  pageSubtitle: { margin: "4px 0 0", color: "var(--text-dim)", fontSize: "13px" },
  clearBtn: {
    display: "flex", alignItems: "center", gap: "7px",
    background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--err)",
    borderRadius: "var(--radius-sm)", padding: "9px 14px", fontSize: "13px",
  },
  error: {
    padding: "10px 12px", background: "var(--err-soft)", border: "1px solid rgba(239,111,97,0.25)",
    borderRadius: "var(--radius-sm)", color: "var(--err)", fontSize: "13px", marginBottom: "16px",
  },
  skeletonList: { display: "flex", flexDirection: "column", gap: "10px" },
  skeletonRow: {
    height: "72px", borderRadius: "var(--radius-md)",
    background: "linear-gradient(90deg, var(--panel-2) 25%, var(--border-soft) 37%, var(--panel-2) 63%)",
    backgroundSize: "400% 100%", animation: "pulse 1.5s ease-in-out infinite",
  },
  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
    padding: "60px 20px", border: "1px dashed var(--border)", borderRadius: "var(--radius-lg)",
  },
  emptyText: { fontSize: "13px", color: "var(--text-faint)", margin: 0 },
  layout: { display: "grid", gridTemplateColumns: "1fr 280px", gap: "18px", alignItems: "start" },
  itemsList: { display: "flex", flexDirection: "column", gap: "10px" },
  itemRow: {
    display: "flex", alignItems: "center", gap: "14px",
    background: "var(--panel)", border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-md)", padding: "12px 14px",
  },
  itemImage: {
    width: "48px", height: "48px", borderRadius: "var(--radius-sm)",
    background: "var(--panel-2)", display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", flexShrink: 0,
  },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontSize: "13.5px", fontWeight: 600 },
  itemPrice: { display: "flex", alignItems: "center", gap: "3px", fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" },
  itemNote: { fontSize: "11.5px", color: "var(--text-faint)", marginTop: "2px" },
  qtyControls: { display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 },
  qtyBtn: {
    width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px",
  },
  qtyValue: { fontSize: "13px", minWidth: "18px", textAlign: "center" },
  lineTotal: { fontSize: "13.5px", fontWeight: 600, minWidth: "70px", textAlign: "right", flexShrink: 0 },
  removeBtn: {
    background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--err)",
    borderRadius: "var(--radius-sm)", padding: "7px", flexShrink: 0,
  },
  summary: {
    background: "var(--panel)", border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-lg)", padding: "20px",
  },
  summaryTitle: { fontSize: "13px", fontWeight: 600, color: "var(--text-dim)", marginBottom: "14px" },
  summaryRow: {
    display: "flex", justifyContent: "space-between", fontSize: "13px",
    color: "var(--text-dim)", padding: "8px 0", borderBottom: "1px solid var(--border-soft)",
  },
  summaryTotal: { color: "var(--accent)", fontWeight: 700, fontSize: "15px" },
  checkoutBtn: {
    width: "100%", marginTop: "16px",
    background: "linear-gradient(135deg, var(--accent), #c67a1e)",
    color: "#1a1206", border: "none", borderRadius: "var(--radius-sm)",
    padding: "12px", fontSize: "14px", fontWeight: 600, boxShadow: "var(--shadow-glow)",
  },
  successCard: {
    maxWidth: "440px", margin: "40px auto", textAlign: "center",
    background: "var(--panel)", border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-lg)", padding: "36px 28px",
  },
  successTitle: { fontSize: "20px", fontWeight: 600, margin: "16px 0 6px" },
  successSubtitle: { fontSize: "13px", color: "var(--text-dim)", margin: "0 0 20px" },
  successItems: {
    textAlign: "left", display: "flex", flexDirection: "column", gap: "8px",
    background: "var(--panel-2)", borderRadius: "var(--radius-sm)", padding: "14px", marginBottom: "20px",
  },
  successItemRow: { display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-dim)" },
  submit: {
    background: "linear-gradient(135deg, var(--accent), #c67a1e)", color: "#1a1206",
    border: "none", borderRadius: "var(--radius-sm)", padding: "11px 20px", fontWeight: 600, fontSize: "14px",
  },
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 50,
  },
  modal: {
    width: "100%", maxWidth: "420px", background: "var(--panel)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "24px", boxShadow: "var(--shadow-md)",
    maxHeight: "85vh", overflowY: "auto",
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  modalTitle: { margin: 0, fontSize: "16px", fontWeight: 600 },
  modalClose: { background: "none", border: "none", color: "var(--text-dim)", padding: "4px" },
  addrError: {
    padding: "10px 12px", background: "var(--err-soft)", border: "1px solid rgba(239,111,97,0.25)",
    borderRadius: "var(--radius-sm)", color: "var(--err)", fontSize: "13px", marginBottom: "14px",
  },
  addrSkeleton: {
    height: "80px", borderRadius: "var(--radius-sm)",
    background: "linear-gradient(90deg, var(--panel-2) 25%, var(--border-soft) 37%, var(--panel-2) 63%)",
    backgroundSize: "400% 100%", animation: "pulse 1.5s ease-in-out infinite",
  },
  addressList: { display: "flex", flexDirection: "column", gap: "10px" },
  addressOption: {
    display: "flex", alignItems: "flex-start", gap: "10px",
    background: "var(--panel-2)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)", padding: "12px", cursor: "pointer",
  },
  addressOptionSelected: {
    borderColor: "var(--accent)", background: "var(--accent-soft)",
  },
  radio: { marginTop: "3px", accentColor: "var(--accent)" },
  addrLabel: { fontSize: "13px", fontWeight: 600 },
  addrLine: { fontSize: "12px", color: "var(--text-dim)", marginTop: "2px", lineHeight: 1.5 },
  addNewBtn: {
    display: "flex", alignItems: "center", gap: "6px", justifyContent: "center",
    background: "var(--panel-2)", border: "1px dashed var(--border)", color: "var(--text-dim)",
    borderRadius: "var(--radius-sm)", padding: "10px", fontSize: "12.5px", marginTop: "4px",
  },
  confirmAddrBtn: {
    width: "100%", marginTop: "16px",
    background: "linear-gradient(135deg, var(--accent), #c67a1e)", color: "#1a1206",
    border: "none", borderRadius: "var(--radius-sm)", padding: "12px", fontWeight: 600, fontSize: "14px",
  },
  addrForm: { display: "flex", flexDirection: "column", gap: "10px" },
  addrInput: {
    width: "100%", background: "var(--panel-2)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)", padding: "10px 12px", color: "var(--text)",
    fontSize: "13.5px", fontFamily: "inherit",
  },
  addrRow2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  addrFormActions: { display: "flex", gap: "10px", marginTop: "4px" },
  saveAddrBtn: {
    flex: 1, background: "linear-gradient(135deg, var(--accent), #c67a1e)", color: "#1a1206",
    border: "none", borderRadius: "var(--radius-sm)", padding: "11px", fontWeight: 600, fontSize: "13.5px",
  },
  cancelBtn: {
    background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text-dim)",
    borderRadius: "var(--radius-sm)", padding: "11px 16px", fontSize: "13.5px", fontWeight: 500,
  },
};