import axios from "axios";

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:8000";
const PROFILE_SERVICE_URL = import.meta.env.VITE_PROFILE_SERVICE_URL || "http://localhost:8002";
const PRODUCT_SERVICE_URL = import.meta.env.VITE_PRODUCT_SERVICE_URL || "http://localhost:8003";
const CART_SERVICE_URL = import.meta.env.VITE_CART_SERVICE_URL || "http://localhost:8004";
const ORDER_SERVICE_URL = import.meta.env.VITE_ORDER_SERVICE_URL || "http://localhost:8005";
const PAYMENT_SERVICE_URL = import.meta.env.VITE_PAYMENT_SERVICE_URL || "http://localhost:8006";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const userApi = {
  signup: (email, password) =>
    axios.post(`${USER_SERVICE_URL}/api/signup`, { email, password }).then((r) => r.data),
  login: (email, password) =>
    axios.post(`${USER_SERVICE_URL}/api/login`, { email, password }).then((r) => r.data),
};

export const profileApi = {
  get: () =>
    axios
      .get(`${PROFILE_SERVICE_URL}/api/profiles/me`, { headers: authHeaders() })
      .then((r) => r.data),
  create: (data) =>
    axios
      .post(`${PROFILE_SERVICE_URL}/api/profiles`, data, { headers: authHeaders() })
      .then((r) => r.data),
  update: (data) =>
    axios
      .put(`${PROFILE_SERVICE_URL}/api/profiles/me`, data, { headers: authHeaders() })
      .then((r) => r.data),
  remove: () =>
    axios
      .delete(`${PROFILE_SERVICE_URL}/api/profiles/me`, { headers: authHeaders() })
      .then((r) => r.data),
};

export const productApi = {
  list: () =>
    axios.get(`${PRODUCT_SERVICE_URL}/api/products`).then((r) => r.data),
  create: (data) =>
    axios
      .post(`${PRODUCT_SERVICE_URL}/api/products`, data, { headers: authHeaders() })
      .then((r) => r.data),
  remove: (id) =>
    axios
      .delete(`${PRODUCT_SERVICE_URL}/api/products/${id}`, { headers: authHeaders() })
      .then((r) => r.data),
};

export const cartApi = {
  view: () =>
    axios.get(`${CART_SERVICE_URL}/api/cart`, { headers: authHeaders() }).then((r) => r.data),
  addItem: (product_id, quantity = 1) =>
    axios
      .post(`${CART_SERVICE_URL}/api/cart/items`, { product_id, quantity }, { headers: authHeaders() })
      .then((r) => r.data),
  updateQuantity: (product_id, quantity) =>
    axios
      .patch(`${CART_SERVICE_URL}/api/cart/items/${product_id}`, { quantity }, { headers: authHeaders() })
      .then((r) => r.data),
  removeItem: (product_id) =>
    axios
      .delete(`${CART_SERVICE_URL}/api/cart/items/${product_id}`, { headers: authHeaders() })
      .then((r) => r.data),
  clear: () =>
    axios.delete(`${CART_SERVICE_URL}/api/cart`, { headers: authHeaders() }).then((r) => r.data),
};

export const orderApi = {
  checkout: (shippingAddress) =>
    axios.post(`${ORDER_SERVICE_URL}/api/orders`, { shippingAddress }, { headers: authHeaders() }).then((r) => r.data),
  list: () =>
    axios.get(`${ORDER_SERVICE_URL}/api/orders`, { headers: authHeaders() }).then((r) => r.data),
  cancel: (orderId, reason) =>
    axios
      .post(
        `${ORDER_SERVICE_URL}/api/orders/${orderId}/cancel${reason ? `?reason=${reason}` : ""}`,
        {},
        { headers: authHeaders() }
      )
      .then((r) => r.data),
};

export const paymentApi = {
  createOrder: (order_id) =>
    axios
      .post(`${PAYMENT_SERVICE_URL}/api/payments/create-order`, { order_id }, { headers: authHeaders() })
      .then((r) => r.data),
  verify: (razorpay_order_id, razorpay_payment_id, razorpay_signature) =>
    axios
      .post(
        `${PAYMENT_SERVICE_URL}/api/payments/verify`,
        { razorpay_order_id, razorpay_payment_id, razorpay_signature },
        { headers: authHeaders() }
      )
      .then((r) => r.data),
  list: () =>
    axios.get(`${PAYMENT_SERVICE_URL}/api/payments`, { headers: authHeaders() }).then((r) => r.data),
};

/** BFF-style aggregate: pulls identity + profile in one call for the dashboard shell. */
export async function fetchAccountSnapshot() {
  const profile = await profileApi.get().catch((err) => {
    if (err?.response?.status === 404) return null; // no profile yet — not an error
    throw err;
  });
  return { profile };
}

export const addressApi = {
  list: () =>
    axios.get(`${PROFILE_SERVICE_URL}/api/addresses`, { headers: authHeaders() }).then((r) => r.data),
  add: (data) =>
    axios.post(`${PROFILE_SERVICE_URL}/api/addresses`, data, { headers: authHeaders() }).then((r) => r.data),
  remove: (id) =>
    axios.delete(`${PROFILE_SERVICE_URL}/api/addresses/${id}`, { headers: authHeaders() }).then((r) => r.data),
};