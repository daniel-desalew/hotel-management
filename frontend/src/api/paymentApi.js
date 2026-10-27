// frontend/src/api/paymentApi.js
import api from "./axios";

export const paymentApi = {
  // ─── Primary methods (match backend routes) ────────────
  list: (params = {}) => api.get("/payments", { params }),
  get: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post("/payments", data),
  refund: (id, data) => api.post(`/payments/${id}/refund`, data),
  bookingSummary: (bookingId) =>
    api.get(`/payments/booking/${bookingId}/summary`),

  // ─── Aliases (so any name works) ──────────────────────
  getAll: (params = {}) => api.get("/payments", { params }),
  fetchAll: (params = {}) => api.get("/payments", { params }),
  fetchPayments: (params = {}) => api.get("/payments", { params }),
};

export default paymentApi;
