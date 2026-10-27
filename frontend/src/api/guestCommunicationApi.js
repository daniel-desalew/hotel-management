import api from "./axios";

export const guestCommunicationApi = {
  getAll: (params) => api.get("/guest-communications", { params }),
  create: (data) => api.post("/guest-communications", data),
};
