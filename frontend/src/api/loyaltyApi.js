import api from "./axios";

export const loyaltyApi = {
  getAll: (params) => api.get("/loyalty", { params }),
  create: (data) => api.post("/loyalty", data),
  update: (id, data) => api.patch(`/loyalty/${id}`, data),
  delete: (id) => api.delete(`/loyalty/${id}`),
  getRedemptions: (params) => api.get("/loyalty/redemptions", { params }),
  createRedemption: (data) => api.post("/loyalty/redemptions", data),
};
