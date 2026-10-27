// frontend/src/api/dashboardApi.js
import api from "./axios";

export const dashboardApi = {
  metrics: (hotelId) =>
    api.get("/dashboard", { params: hotelId ? { hotelId } : {} }),
  revenueChart: (hotelId, days = 14) =>
    api.get("/dashboard/revenue-chart", {
      params: { ...(hotelId ? { hotelId } : {}), days },
    }),
  occupancyChart: (hotelId, days = 14) =>
    api.get("/dashboard/occupancy-chart", {
      params: { ...(hotelId ? { hotelId } : {}), days },
    }),
  today: (hotelId) =>
    api.get("/dashboard/today", { params: hotelId ? { hotelId } : {} }),

  // Aliases
  getMetrics: (...args) => dashboardApi.metrics(...args),
  getStats: (...args) => dashboardApi.metrics(...args),
};

export default dashboardApi;
