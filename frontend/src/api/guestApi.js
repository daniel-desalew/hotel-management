// frontend/src/api/guestApi.js
import api from "./axios";

export const guestApi = {
  // Primary methods
  list: (params = {}) => api.get("/guests", { params }),
  get: (id) => api.get(`/guests/${id}`),
  profile: (id) => api.get(`/guests/${id}/profile`),
  create: (data) => api.post("/guests", data),
  update: (id, data) => api.patch(`/guests/${id}`, data),
  remove: (id) => api.delete(`/guests/${id}`),
  addLoyaltyPoints: (id, points) =>
    api.post(`/guests/${id}/loyalty`, { points }),

  // Aliases
  getAll: (params = {}) => api.get("/guests", { params }),
  fetchAll: (params = {}) => api.get("/guests", { params }),
};

export default guestApi;
