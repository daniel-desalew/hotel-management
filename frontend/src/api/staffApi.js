import api from "./axios";

export const staffApi = {
  getAll: (params) => api.get("/staff", { params }),
  getOne: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post("/staff", data),
  update: (id, data) => api.patch(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
  getByDepartment: (department) => api.get(`/staff/department/${department}`),
};
