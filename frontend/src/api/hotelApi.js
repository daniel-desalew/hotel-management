import api from "./axios";

export const hotelApi = {
  getAll: (params) => api.get("/hotels", { params }),
  getOne: (id) => api.get(`/hotels/${id}`),
  create: (data) => api.post("/hotels", data),
  update: (id, data) => api.patch(`/hotels/${id}`, data),
  delete: (id) => api.delete(`/hotels/${id}`),
  getStats: (id) => api.get(`/hotels/${id}/stats`),
};
