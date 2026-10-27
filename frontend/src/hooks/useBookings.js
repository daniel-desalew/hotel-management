import { useCallback, useEffect, useState } from "react";
import { bookingApi } from "../api/bookingApi";

export function useBookings(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await bookingApi.getAll(filters);
      const payload = response?.data || {};

      setBookings(payload.bookings || []);
      setPagination(
        payload.pagination || {
          total: payload.bookings?.length || 0,
          page: 1,
          pages: 1,
        },
      );
    } catch (err) {
      setError(err?.message || "Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchBookings,
  };
}

export default useBookings;
