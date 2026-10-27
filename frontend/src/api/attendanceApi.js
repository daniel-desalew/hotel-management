import api from "./axios";

export const attendanceApi = {
  getAll: (params) => api.get("/attendance", { params }),
  create: (data) => api.post("/attendance", data),
  update: (id, data) => api.patch(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
};
