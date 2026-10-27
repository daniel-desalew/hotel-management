// frontend/src/pages/dashboard/Dashboard.jsx
import { useQuery } from "@tanstack/react-query";
import {
  FiGrid,
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiLogIn,
  FiLogOut,
  FiClock,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import useAuthStore from "../../store/authStore";
import { dashboardApi } from "../../api/dashboardApi";

// ─── KPI Card ─────────────────────────────────────────
const StatCard = ({
  icon: Icon,
  label,
  value,
  accent = "blue",
  suffix = "",
}) => {
  const palettes = {
    blue: {
      bg: "bg-gradient-to-br from-blue-500/10 to-blue-600/5",
      icon: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
      ring: "ring-blue-100",
    },
    green: {
      bg: "bg-gradient-to-br from-green-500/10 to-emerald-600/5",
      icon: "bg-gradient-to-br from-green-500 to-emerald-600 text-white",
      ring: "ring-green-100",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-500/10 to-violet-600/5",
      icon: "bg-gradient-to-br from-purple-500 to-violet-600 text-white",
      ring: "ring-purple-100",
    },
    yellow: {
      bg: "bg-gradient-to-br from-amber-500/10 to-yellow-600/5",
      icon: "bg-gradient-to-br from-amber-500 to-yellow-600 text-white",
      ring: "ring-amber-100",
    },
    red: {
      bg: "bg-gradient-to-br from-red-500/10 to-rose-600/5",
      icon: "bg-gradient-to-br from-red-500 to-rose-600 text-white",
      ring: "ring-red-100",
    },
  };

  const p = palettes[accent] || palettes.blue;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-md p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-fade-in ${p.bg}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-2 text-2xl md:text-3xl font-bold text-gray-900 tracking-tight truncate">
            {value}
            {suffix && (
              <span className="text-lg text-gray-400 ml-1">{suffix}</span>
            )}
          </p>
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ${p.icon} ${p.ring}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

// ─── Custom Tooltip for Charts ────────────────────────
const CustomTooltip = ({
  active,
  payload,
  label,
  prefix = "",
  suffix = "",
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/95 backdrop-blur-md text-white rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-medium opacity-80">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-bold mt-0.5">
          {prefix}
          {entry.value}
          {suffix}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  // const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.metrics(),
  });

  const { data: revenueData } = useQuery({
    queryKey: ["revenueChart"],
    queryFn: () => dashboardApi.revenueChart(14),
  });

  const { data: occupancyData } = useQuery({
    queryKey: ["occupancyChart"],
    queryFn: () => dashboardApi.occupancyChart(14),
  });

  const kpis = data?.data?.kpis || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Header Banner ────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 text-white p-6 md:p-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse-dot" />
              LIVE OVERVIEW
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-white/80 mt-1">
              Overview of your hotel's performance
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 backdrop-blur-md px-5 py-3 ring-1 ring-white/20">
            <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
              Hotel Status
            </p>
            <p className="text-lg font-bold">
              {kpis.occupancyRate ?? 0}% occupied
            </p>
          </div>
        </div>
      </div>

      {/* ─── Primary KPIs ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FiGrid}
          label="Total Rooms"
          value={kpis.totalRooms ?? 0}
          accent="blue"
        />
        <StatCard
          icon={FiUsers}
          label="Occupied"
          value={kpis.occupiedRooms ?? 0}
          accent="purple"
        />
        <StatCard
          icon={FiTrendingUp}
          label="Occupancy Rate"
          value={kpis.occupancyRate ?? 0}
          suffix="%"
          accent="green"
        />
        <StatCard
          icon={FiDollarSign}
          label="Today's Revenue"
          value={`$${(kpis.todayRevenue ?? 0).toLocaleString()}`}
          accent="yellow"
        />
      </div>

      {/* ─── Secondary KPIs ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FiLogIn}
          label="Check-ins Today"
          value={kpis.todayCheckIns ?? 0}
          accent="blue"
        />
        <StatCard
          icon={FiLogOut}
          label="Check-outs Today"
          value={kpis.todayCheckOuts ?? 0}
          accent="red"
        />
        <StatCard
          icon={FiClock}
          label="Pending Tasks"
          value={kpis.pendingHousekeeping ?? 0}
          accent="yellow"
        />
        <StatCard
          icon={FiDollarSign}
          label="Monthly Revenue"
          value={`$${(kpis.monthlyRevenue ?? 0).toLocaleString()}`}
          accent="green"
        />
      </div>

      {/* ─── Charts ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue Chart */}
        <div className="chart-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900">Revenue</h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 14 days</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <FiTrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="h-64 -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData?.data || []}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v?.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<CustomTooltip prefix="$" />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={{
                    fill: "#2563eb",
                    r: 3,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Chart */}
        <div className="chart-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900">Occupancy Rate</h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 14 days</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <FiGrid className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="h-64 -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyData?.data || []}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop
                      offset="100%"
                      stopColor="#2563eb"
                      stopOpacity={0.85}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v?.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip suffix="%" />} />
                <Bar
                  dataKey="rate"
                  fill="url(#barGrad)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── Recent Bookings ──────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Latest activity from your hotel
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/70">
              <tr>
                <th className="text-left py-3 px-6 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Booking #
                </th>
                <th className="text-left py-3 px-6 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="text-left py-3 px-6 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="text-left py-3 px-6 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left py-3 px-6 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.data?.recentBookings || []).map((b) => (
                <tr
                  key={b._id}
                  className="hover:bg-primary-50/30 transition-colors"
                >
                  <td className="py-3 px-6 font-mono text-xs text-gray-600">
                    {b.bookingNumber}
                  </td>
                  <td className="py-3 px-6 font-medium text-gray-900">
                    {b.guestId?.firstName} {b.guestId?.lastName}
                  </td>
                  <td className="py-3 px-6 text-gray-600">
                    {new Date(b.checkIn).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 font-medium text-gray-900">
                    ${b.pricing?.totalAmount?.toFixed(2)}
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`badge capitalize ${
                        b.status === "confirmed" || b.status === "checked_out"
                          ? "badge-success"
                          : b.status === "checked_in"
                            ? "badge-info"
                            : b.status === "pending"
                              ? "badge-warning"
                              : "badge-danger"
                      }`}
                    >
                      {b.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
              {!data?.data?.recentBookings?.length && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <div className="text-3xl mb-2">📅</div>
                    <p className="text-sm">No recent bookings</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
