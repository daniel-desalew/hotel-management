import { useCallback, useEffect, useState } from "react";
import { roomApi } from "../api/roomApi";

export function useRooms(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await roomApi.getAll(filters);
      const payload = response?.data || {};

      setRooms(payload.rooms || []);
      setPagination(
        payload.pagination || {
          total: payload.rooms?.length || 0,
          page: 1,
          pages: 1,
        },
      );
    } catch (err) {
      setError(err?.message || "Failed to load rooms");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    rooms,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchRooms,
  };
}

export default useRooms;
