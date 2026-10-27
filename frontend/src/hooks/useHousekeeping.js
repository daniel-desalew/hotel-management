import { useCallback, useEffect, useState } from "react";
import { housekeepingApi } from "../api/housekeepingApi";

export function useHousekeeping(initialFilters = {}) {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    ...initialFilters,
  });
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await housekeepingApi.getAll(filters);
      const payload = response?.data || {};

      setTasks(payload.tasks || []);
      setPagination(
        payload.pagination || {
          total: payload.tasks?.length || 0,
          page: Number(filters.page || 1),
          pages: 1,
        },
      );
    } catch (err) {
      setError(err?.message || "Failed to load housekeeping tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchTasks,
  };
}

export default useHousekeeping;
