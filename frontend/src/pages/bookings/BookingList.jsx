// frontend/src/pages/bookings/BookingList.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiPlus, FiSearch, FiCalendar } from "react-icons/fi";
import { bookingApi } from "../../api/bookingApi";
import AddBookingModal from "../../components/booking/AddBookingModal";
import useAuthStore from "../../store/authStore";

export default function BookingList() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["bookings", { status, page }],
    queryFn: () =>
      bookingApi.list({
        status: status || undefined,
        page,
        limit: 10,
      }),
  });

  const bookings = data?.data?.bookings || [];
  const pagination = data?.data?.pagination || {};

  const filtered = search
    ? bookings.filter((b) => {
        const q = search.toLowerCase();
        return (
          (b.bookingNumber || "").toLowerCase().includes(q) ||
          (b.guestId?.firstName || "").toLowerCase().includes(q) ||
          (b.guestId?.lastName || "").toLowerCase().includes(q)
        );
      })
    : bookings;

  const statusBadge = (s) => {
    switch (s) {
      case "confirmed":
      case "checked_out":
        return "badge-success";
      case "checked_in":
        return "badge-info";
      case "pending":
        return "badge-warning";
      case "cancelled":
      case "no_show":
        return "badge-danger";
      default:
        return "badge-gray";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Bookings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total || bookings.length} total reservations
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <FiPlus className="w-4 h-4" /> New Booking
        </button>
      </div>

      {/* Quick filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setStatus("");
            setPage(1);
          }}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
            !status
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => {
            setStatus("pending");
            setPage(1);
          }}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
            status === "pending"
              ? "bg-yellow-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => {
            setStatus("checked_in");
            setPage(1);
          }}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
            status === "checked_in"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Checked In
        </button>
        <button
          onClick={() => {
            setStatus("checked_out");
            setPage(1);
          }}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
            status === "checked_out"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Completed
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search booking # or guest name..."
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
          className="input py-2 text-sm min-w-[160px]"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
          <option value="checked_out">Checked Out</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">
                  Booking #
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">
                  Guest
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">
                  Check-in
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">
                  Check-out
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    Loading...
                  </td>
                </tr>
              )}

              {filtered.map((b) => (
                <tr
                  key={b._id}
                  onClick={() => navigate(`/bookings/${b._id}`)}
                  className="hover:bg-primary-50/30 transition-colors cursor-pointer"
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
                  <td className="py-3 px-6 text-gray-600">
                    {new Date(b.checkOut).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 font-medium">
                    ${b.pricing?.totalAmount?.toFixed(2)}
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`badge capitalize ${statusBadge(b.status)}`}
                    >
                      {b.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/bookings/${b._id}`);
                      }}
                      className="text-primary-600 hover:underline text-sm font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <FiCalendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No bookings found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
            <p className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary text-sm"
              >
                Previous
              </button>
              <button
                disabled={page === pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Booking Modal */}
      <AddBookingModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        hotelId={user?.hotelId}
      />
    </div>
  );
}
