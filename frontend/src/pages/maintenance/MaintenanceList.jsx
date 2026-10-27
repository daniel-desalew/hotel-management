// frontend/src/pages/maintenance/MaintenanceList.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiSearch,
  FiPlus,
  FiTool,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiMapPin,
} from "react-icons/fi";
import { maintenanceApi } from "../../api/maintenanceApi";
import MaintenanceDetailModal from "../../components/maintenance/MaintenanceDetailModal";
import CreateMaintenanceModal from "../../components/maintenance/CreateMaintenanceModal";
import useAuthStore from "../../store/authStore";

export default function MaintenanceList() {
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [viewTicket, setViewTicket] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const limit = 12;

  const { data, isLoading, error } = useQuery({
    queryKey: ["maintenance", { page, status, priority }],
    queryFn: () =>
      maintenanceApi.list({
        page,
        limit,
        status: status || undefined,
        priority: priority || undefined,
      }),
  });

  const tickets = data?.data?.tickets || [];
  const pagination = data?.data?.pagination || {};

  const filtered = search
    ? tickets.filter((t) => {
        const q = search.toLowerCase();
        return (
          (t.title || "").toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          (t.ticketNumber || "").toLowerCase().includes(q) ||
          (t.roomId?.roomNumber || "").toLowerCase().includes(q)
        );
      })
    : tickets;

  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "in_progress",
  ).length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;
  const totalCost = tickets.reduce((s, t) => s + (t.estimatedCost || 0), 0);

  const statusBadge = (s) => {
    switch (s) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const priorityBadge = (p) => {
    switch (p) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Maintenance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading
              ? "Loading..."
              : `${pagination.total || tickets.length} tickets`}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <FiPlus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card bg-gradient-to-br from-red-500/10 to-rose-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Open
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                {openCount}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">need attention</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-lg">
              <FiAlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                In Progress
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                {inProgressCount}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">being worked on</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
              <FiClock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-green-500/10 to-emerald-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Resolved
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                {resolvedCount}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">completed</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-lg">
              <FiCheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-purple-500/10 to-violet-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Total Cost
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                ${totalCost.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">estimated</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center shadow-lg">
              <FiTool className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search ticket, room, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="input py-2 text-sm min-w-[140px]"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            setPage(1);
          }}
          className="input py-2 text-sm min-w-[140px]"
        >
          <option value="">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load tickets: {error.message}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton rounded-xl h-44" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-5xl mb-3">🔧</div>
          <p className="text-gray-500 font-medium">No maintenance tickets</p>
          <p className="text-xs text-gray-400 mt-1">
            Everything is running smoothly
          </p>
        </div>
      )}

      {/* Ticket Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div
              key={t._id}
              onClick={() => setViewTicket(t)}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                    <FiTool className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono text-gray-500">
                    {t.ticketNumber || "TICKET"}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${priorityBadge(t.priority)}`}
                >
                  {t.priority}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 line-clamp-1">
                {t.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {t.description}
              </p>

              {t.roomId && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                  <FiMapPin className="w-3.5 h-3.5 text-gray-400" />
                  Room {t.roomId.roomNumber || "—"}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${statusBadge(t.status)}`}
                >
                  {t.status?.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(t.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600 px-4">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="btn-secondary"
          >
            Next →
          </button>
        </div>
      )}

      {/* Modals */}
      <MaintenanceDetailModal
        ticket={viewTicket}
        open={!!viewTicket}
        onClose={() => setViewTicket(null)}
      />
      <CreateMaintenanceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        hotelId={user?.hotelId}
      />
    </div>
  );
}
