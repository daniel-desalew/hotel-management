// frontend/src/api/maintenanceApi.js
import api from "./axios";

export const maintenanceApi = {
  // ─── Primary methods ─────────────────────────────────
  list: (params = {}) => api.get("/maintenance", { params }),
  get: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post("/maintenance", data),
  update: (id, data) => api.patch(`/maintenance/${id}`, data),
  assign: (id, data) => api.post(`/maintenance/${id}/assign`, data),
  resolve: (id, data) => api.post(`/maintenance/${id}/resolve`, data),
  remove: (id) => api.delete(`/maintenance/${id}`),

  // ─── Aliases ─────────────────────────────────────────
  getAll: (params = {}) => api.get("/maintenance", { params }),
  fetchAll: (params = {}) => api.get("/maintenance", { params }),
};

export default maintenanceApi;
