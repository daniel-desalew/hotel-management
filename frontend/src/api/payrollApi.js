import api from "./axios";

export const payrollApi = {
  getAll: (params) => api.get("/payroll", { params }),
  create: (data) => api.post("/payroll", data),
  update: (id, data) => api.patch(`/payroll/${id}`, data),
  delete: (id) => api.delete(`/payroll/${id}`),
};
