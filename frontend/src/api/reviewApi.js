// frontend/src/api/reviewApi.js
import api from "./axios";

export const reviewApi = {
  list: (params = {}) => api.get("/reviews", { params }),
  get: (id) => api.get(`/reviews/${id}`),
  create: (data) => api.post("/reviews", data),
  respond: (id, data) => api.post(`/reviews/${id}/respond`, data),
  remove: (id) => api.delete(`/reviews/${id}`),

  // Aliases
  getAll: (params = {}) => api.get("/reviews", { params }),
  fetchAll: (params = {}) => api.get("/reviews", { params }),
};

export default reviewApi;
