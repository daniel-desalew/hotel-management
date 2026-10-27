import api from "./axios";

export const housekeepingApi = {
  getAll: (params) => api.get("/housekeeping", { params }),
  getOne: (id) => api.get(`/housekeeping/${id}`),
  create: (data) => api.post("/housekeeping", data),
  update: (id, data) => api.patch(`/housekeeping/${id}`, data),
  assign: (id, data) => api.post(`/housekeeping/${id}/assign`, data),
  complete: (id, data) => api.post(`/housekeeping/${id}/complete`, data),
  myTasks: () => api.get("/housekeeping/my-tasks"),
};
