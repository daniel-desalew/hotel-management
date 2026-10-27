import api from "./axios";

export const procurementApi = {
  getAll: (params) => api.get("/procurement", { params }),
  create: (data) => api.post("/procurement", data),
  update: (id, data) => api.patch(`/procurement/${id}`, data),
  delete: (id) => api.delete(`/procurement/${id}`),
};
