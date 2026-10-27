// frontend/src/api/invoiceApi.js
import api from "./axios";

export const invoiceApi = {
  // ─── Primary methods ──────────────────────────────────
  list: (params = {}) => api.get("/invoices", { params }),
  get: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post("/invoices", data),
  update: (id, data) => api.patch(`/invoices/${id}`, data),
  remove: (id) => api.delete(`/invoices/${id}`),
  sendEmail: (id) => api.post(`/invoices/${id}/send`),
  generateFromBooking: (bookingId) =>
    api.post(`/invoices/generate/${bookingId}`),

  // ─── Aliases ──────────────────────────────────────────
  getAll: (params = {}) => api.get("/invoices", { params }),
  fetchAll: (params = {}) => api.get("/invoices", { params }),
};

export default invoiceApi;
