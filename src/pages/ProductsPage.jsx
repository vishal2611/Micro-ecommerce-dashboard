import { useEffect, useState } from "react";
import { Package, Plus, Trash2, X, Tag, Boxes, IndianRupee, ShoppingCart } from "lucide-react";
import { productApi, cartApi } from "../api/client";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [cartMsg, setCartMsg] = useState(null);
  const [form, setForm] = useState({
    name: "", description: "", price: "", category: "", stock_quantity: "", image_url: "",
  });

  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const data = await productApi.list();
      setProducts(data || []);
    } catch {
      setError("Couldn't load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await productApi.create({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        category: form.category,
        stock_quantity: parseInt(form.stock_quantity, 10) || 0,
        image_url: form.image_url,
      });
      setForm({ name: "", description: "", price: "", category: "", stock_quantity: "", image_url: "" });
      setShowForm(false);
      loadProducts();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to add product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await productApi.remove(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to delete product.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAddToCart(productId) {
    setAddingId(productId);
    setCartMsg(null);
    try {
      await cartApi.addItem(productId, 1);
      setCartMsg({ type: "ok", text: "Added to cart." });
    } catch (err) {
      setCartMsg({ type: "err", text: err?.response?.data?.detail || "Failed to add to cart." });
    } finally {
      setAddingId(null);
      setTimeout(() => setCartMsg(null), 2500);
    }
  }

  return (
    <main style={styles.main}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Products</h1>
          <p style={styles.pageSubtitle}>Served by product-service · anyone signed in can add or remove items</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add product
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {cartMsg && (
        <div style={cartMsg.type === "ok" ? styles.notice : styles.error}>{cartMsg.text}</div>
      )}

      {loading ? (
        <div style={styles.grid}>
          {[1, 2, 3].map((i) => <div key={i} style={styles.skeletonCard} />)}
        </div>
      ) : products.length === 0 ? (
        <div style={styles.emptyState}>
          <Package size={28} style={{ color: "var(--text-faint)" }} />
          <p style={styles.emptyText}>No products yet — add the first one.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {products.map((p) => (
            <div key={p.id} style={styles.card}>
              <div style={styles.cardImage}>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} style={styles.img} onError={(e) => { e.target.style.display = "none"; }} />
                ) : (
                  <Package size={26} style={{ color: "var(--text-faint)" }} />
                )}
              </div>
              <div style={styles.cardBody}>
                <div style={styles.cardTitleRow}>
                  <h3 style={styles.cardTitle}>{p.name}</h3>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    title="Delete product"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {p.description && <p style={styles.cardDesc}>{p.description}</p>}
                <div style={styles.cardMetaRow}>
                  <span style={styles.metaChip}><IndianRupee size={11} /> {Number(p.price).toFixed(2)}</span>
                  <span style={styles.metaChip}><Boxes size={11} /> {p.stock_quantity} in stock</span>
                  {p.category && <span style={styles.metaChip}><Tag size={11} /> {p.category}</span>}
                </div>
                <button
                  style={styles.cartBtn}
                  onClick={() => handleAddToCart(p.id)}
                  disabled={addingId === p.id || p.stock_quantity === 0}
                >
                  <ShoppingCart size={13} />
                  {p.stock_quantity === 0 ? "Out of stock" : addingId === p.id ? "Adding…" : "Add to cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add product</h3>
              <button style={styles.modalClose} onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate} style={styles.form}>
              <input
                style={styles.input}
                placeholder="Product name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <textarea
                style={{ ...styles.input, minHeight: "60px", resize: "vertical" }}
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div style={styles.row2}>
                <input
                  style={styles.input}
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                <input
                  style={styles.input}
                  placeholder="Stock quantity"
                  type="number"
                  value={form.stock_quantity}
                  onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                />
              </div>
              <input
                style={styles.input}
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Image URL"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
              <button style={styles.submit} type="submit" disabled={saving}>
                {saving ? "Adding…" : "Add product"}
              </button>
            </form>
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
  addBtn: {
    display: "flex", alignItems: "center", gap: "7px",
    background: "linear-gradient(135deg, var(--accent), #c67a1e)",
    color: "#1a1206", border: "none", borderRadius: "var(--radius-sm)",
    padding: "10px 16px", fontSize: "13.5px", fontWeight: 600, boxShadow: "var(--shadow-glow)",
  },
  error: {
    padding: "10px 12px", background: "var(--err-soft)", border: "1px solid rgba(239,111,97,0.25)",
    borderRadius: "var(--radius-sm)", color: "var(--err)", fontSize: "13px", marginBottom: "16px",
  },
  notice: {
    padding: "10px 12px", background: "var(--ok-soft)", border: "1px solid rgba(79,195,138,0.25)",
    borderRadius: "var(--radius-sm)", color: "var(--ok)", fontSize: "13px", marginBottom: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "16px",
  },
  skeletonCard: {
    height: "230px", borderRadius: "var(--radius-lg)",
    background: "linear-gradient(90deg, var(--panel-2) 25%, var(--border-soft) 37%, var(--panel-2) 63%)",
    backgroundSize: "400% 100%", animation: "pulse 1.5s ease-in-out infinite",
  },
  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
    padding: "60px 20px", border: "1px dashed var(--border)", borderRadius: "var(--radius-lg)",
  },
  emptyText: { fontSize: "13px", color: "var(--text-faint)", margin: 0 },
  card: {
    background: "var(--panel)", border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-lg)", overflow: "hidden",
    boxShadow: "var(--shadow-sm)", animation: "fadeUp 0.3s ease both",
  },
  cardImage: {
    height: "130px", background: "var(--panel-2)",
    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  cardBody: { padding: "14px" },
  cardTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" },
  cardTitle: { fontSize: "14.5px", fontWeight: 600, margin: 0 },
  cardDesc: { fontSize: "12px", color: "var(--text-dim)", margin: "6px 0 0", lineHeight: 1.5 },
  cardMetaRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" },
  metaChip: {
    display: "flex", alignItems: "center", gap: "4px",
    fontSize: "11px", color: "var(--text-dim)", background: "var(--panel-2)",
    padding: "4px 8px", borderRadius: "999px", border: "1px solid var(--border)",
  },
  deleteBtn: {
    background: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--err)",
    borderRadius: "var(--radius-sm)", padding: "6px", flexShrink: 0,
  },
  cartBtn: {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    marginTop: "12px", background: "var(--accent-soft)", border: "1px solid rgba(232,163,61,0.3)",
    color: "var(--accent)", borderRadius: "var(--radius-sm)", padding: "8px", fontSize: "12.5px", fontWeight: 600,
  },
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 50,
  },
  modal: {
    width: "100%", maxWidth: "420px", background: "var(--panel)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "24px", boxShadow: "var(--shadow-md)", maxHeight: "90vh", overflowY: "auto",
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  modalTitle: { margin: 0, fontSize: "16px", fontWeight: 600 },
  modalClose: { background: "none", border: "none", color: "var(--text-dim)", padding: "4px" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  input: {
    width: "100%", background: "var(--panel-2)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)", padding: "10px 12px", color: "var(--text)",
    fontSize: "13.5px", fontFamily: "inherit",
  },
  submit: {
    marginTop: "4px", background: "linear-gradient(135deg, var(--accent), #c67a1e)", color: "#1a1206",
    border: "none", borderRadius: "var(--radius-sm)", padding: "12px", fontWeight: 600,
    fontSize: "14px", boxShadow: "var(--shadow-glow)",
  },
};