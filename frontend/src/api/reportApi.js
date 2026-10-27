import api from "./axios";

export const reportApi = {
  getRevenue: (params) => api.get("/reports/revenue", { params }),
  getOccupancy: (params) => api.get("/reports/occupancy", { params }),
  getGuests: (params) => api.get("/reports/guests", { params }),
  getRoomTypes: (params) => api.get("/reports/room-types", { params }),
  getSources: (params) => api.get("/reports/sources", { params }),
};
