import { useCallback, useEffect, useState } from "react";
import { staffApi } from "../api/staffApi";

export function useStaffs(initialFilters = {}) {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    ...initialFilters,
  });
  const [staff, setStaff] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await staffApi.getAll(filters);
      const payload = response?.data || {};

      setStaff(payload.staff || []);
      setPagination(
        payload.pagination || {
          total: payload.staff?.length || 0,
          page: Number(filters.page || 1),
          pages: 1,
        },
      );
    } catch (err) {
      setError(err?.message || "Failed to load staff");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  return {
    staff,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchStaff,
  };
}

export default useStaffs;
