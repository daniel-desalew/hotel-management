import { useCallback, useEffect, useState } from "react";
import { guestApi } from "../api/guestApi";

export function useGuests(initialFilters = {}) {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    ...initialFilters,
  });
  const [guests, setGuests] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchGuests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await guestApi.getAll(filters);
      const payload = response?.data || {};

      setGuests(payload.guests || []);
      setPagination(
        payload.pagination || {
          total: payload.guests?.length || 0,
          page: Number(filters.page || 1),
          pages: 1,
        },
      );
    } catch (err) {
      setError(err?.message || "Failed to load guests");
      setGuests([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  return {
    guests,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchGuests,
  };
}

export default useGuests;
