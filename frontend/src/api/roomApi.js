// frontend/src/api/roomApi.js
import api from "./axios";

export const roomApi = {
  // ─── Rooms ──────────────────────────────────────────
  list: (params = {}) => api.get("/rooms", { params }),
  get: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post("/rooms", data),
  update: (id, data) => api.patch(`/rooms/${id}`, data),
  updateStatus: (id, data) => api.patch(`/rooms/${id}/status`, data),
  remove: (id) => api.delete(`/rooms/${id}`),

  // Room aliases
  getAll: (params = {}) => api.get("/rooms", { params }),
  fetchAll: (params = {}) => api.get("/rooms", { params }),
  getAllRooms: (params = {}) => api.get("/rooms", { params }),

  // ─── Room Types ─────────────────────────────────────
  getRoomTypes: (params = {}) => api.get("/rooms/types", { params }),
  typesList: (params = {}) => api.get("/rooms/types", { params }),
  getAllTypes: (params = {}) => api.get("/rooms/types", { params }),
  createType: (data) => api.post("/rooms/types", data),
  updateType: (id, data) => api.patch(`/rooms/types/${id}`, data),
};

export default roomApi;
