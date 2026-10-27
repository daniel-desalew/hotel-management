import api from "./axios";

export const serviceRequestApi = {
  getAll: (params) => api.get("/service-requests", { params }),
  getOne: (id) => api.get(`/service-requests/${id}`),
  create: (data) => api.post("/service-requests", data),
  update: (id, data) => api.patch(`/service-requests/${id}`, data),
  assign: (id, data) => api.post(`/service-requests/${id}/assign`, data),
  complete: (id, data) => api.post(`/service-requests/${id}/complete`, data),
};
