import api from "./axios";

export const restaurantOrderApi = {
  getAll: (params) => api.get("/restaurant-orders", { params }),
  create: (data) => api.post("/restaurant-orders", data),
  update: (id, data) => api.patch(`/restaurant-orders/${id}`, data),
  delete: (id) => api.delete(`/restaurant-orders/${id}`),
};
