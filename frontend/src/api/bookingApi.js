// frontend/src/api/bookingApi.js
import api from "./axios";

export const bookingApi = {
  list: (params = {}) => api.get("/bookings", { params }),
  get: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post("/bookings", data),
  update: (id, data) => api.patch(`/bookings/${id}`, data),
  checkIn: (id, data) => api.post(`/bookings/${id}/check-in`, data || {}),
  checkOut: (id) => api.post(`/bookings/${id}/check-out`),
  cancel: (id, data) => api.post(`/bookings/${id}/cancel`, data || {}),
  checkAvailability: (data) => api.post("/bookings/check-availability", data),
  guestBookings: (guestId) => api.get(`/bookings/guest/${guestId}`),

  // Aliases
  getAll: (params = {}) => api.get("/bookings", { params }),
  fetchAll: (params = {}) => api.get("/bookings", { params }),
  getAllBookings: (params = {}) => api.get("/bookings", { params }),
};

export default bookingApi;
