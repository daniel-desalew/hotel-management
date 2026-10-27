// frontend/src/pages/reports/Reports.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FiTrendingUp, FiHome, FiUsers, FiDollarSign } from "react-icons/fi";
import useAuthStore from "../../store/authStore";
import api from "../../api/axios";

const HOTEL_ID = "6acd7b7dd93e86b013cb6769"; // fallback dev hotel

export default function Reports() {
  const user = useAuthStore((s) => s.user);
  const hotelId = user?.hotelId || HOTEL_ID;
  const [days, setDays] = useState(30);

  // ─── Revenue report ─────────────────────────────────
  const { data: revenue, isLoading: loadingRevenue } = useQuery({
    queryKey: ["report-revenue", hotelId, days],
    queryFn: () =>
      api.get("/reports/revenue", {
        params: { hotelId, groupBy: "day" },
      }),
  });

  // ─── Occupancy report ───────────────────────────────
  const { data: occupancy, isLoading: loadingOccupancy } = useQuery({
    queryKey: ["report-occupancy", hotelId],
    queryFn: () => api.get("/reports/occupancy", { params: { hotelId } }),
  });

  // ─── Room type performance ──────────────────────────
  const { data: roomTypes } = useQuery({
    queryKey: ["report-roomtypes", hotelId],
    queryFn: () => api.get("/reports/room-types", { params: { hotelId } }),
  });

  // ─── Source performance ─────────────────────────────
  const { data: sources } = useQuery({
    queryKey: ["report-sources", hotelId],
    queryFn: () => api.get("/reports/sources", { params: { hotelId } }),
  });

  // ─── Extract arrays safely ──────────────────────────
  const revenueByPeriod = revenue?.data?.byPeriod || [];
  const revenueTotals = revenue?.data?.totals || {};
  const occupancyReport = occupancy?.data?.report || [];
  const roomTypeRows = roomTypes?.data || [];
  const sourceRows = sources?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Business analytics & insights
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="input py-2 text-sm min-w-[140px]"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Total Revenue
              </p>
              <p className="text-2xl font-bold mt-1">
                ${(revenueTotals.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center">
              <FiDollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Bookings
              </p>
              <p className="text-2xl font-bold mt-1">
                {revenueTotals.totalBookings || 0}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Total Rooms
              </p>
              <p className="text-2xl font-bold mt-1">
                {occupancy?.data?.totalRooms || 0}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center">
              <FiHome className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Avg Occupancy
              </p>
              <p className="text-2xl font-bold mt-1">
                {occupancy?.data?.avgOccupancy || 0}%
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center">
              <FiUsers className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="chart-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Revenue Trend</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {revenueByPeriod.length} data points
            </p>
          </div>
        </div>

        <div className="h-72 -ml-3">
          {loadingRevenue ? (
            <div className="skeleton w-full h-full rounded-lg" />
          ) : revenueByPeriod.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No revenue data in the selected period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByPeriod}>
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
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                  formatter={(v) => [`$${v}`, "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ fill: "#2563eb", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Occupancy Chart */}
      <div className="chart-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Occupancy by Date</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {occupancyReport.length} days tracked
            </p>
          </div>
        </div>

        <div className="h-72 -ml-3">
          {loadingOccupancy ? (
            <div className="skeleton w-full h-full rounded-lg" />
          ) : occupancyReport.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No occupancy data in the selected period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyReport}>
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
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                  formatter={(v) => [`${v}%`, "Occupancy"]}
                />
                <Bar
                  dataKey="occupancyRate"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Room Type Performance */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">
            Room Type Performance
          </h2>
          {roomTypeRows.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No room type data
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">
                    Type
                  </th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">
                    Bookings
                  </th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {roomTypeRows.map((r, i) => (
                  <tr
                    key={r.roomTypeId || i}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="py-2 font-medium text-gray-900">
                      {r.name || "Unknown"}
                    </td>
                    <td className="py-2 text-right text-gray-600">
                      {r.bookings}
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900">
                      ${(r.revenue || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Booking Sources */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Booking Sources</h2>
          {sourceRows.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No source data
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">
                    Source
                  </th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">
                    Bookings
                  </th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {sourceRows.map((s, i) => (
                  <tr
                    key={s.source || i}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="py-2 font-medium text-gray-900 capitalize">
                      {(s.source || "unknown").replace(/_/g, " ")}
                    </td>
                    <td className="py-2 text-right text-gray-600">
                      {s.bookings}
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900">
                      ${(s.revenue || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
