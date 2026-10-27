import api from "./axios";

export const inventoryApi = {
  getAll: (params) => api.get("/inventory", { params }),
  getOne: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post("/inventory", data),
  update: (id, data) => api.patch(`/inventory/${id}`, data),
  adjust: (id, data) => api.post(`/inventory/${id}/adjust`, data),
};
