// frontend/src/pages/payments/Payments.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiSearch,
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiRotateCcw,
} from "react-icons/fi";
import { paymentApi } from "../../api/paymentApi";
import PaymentDetailModal from "../../components/payments/PaymentDetailModal";
import RefundModal from "../../components/payments/RefundModal";

export default function Payments() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);
  const [viewPayment, setViewPayment] = useState(null);
  const [refundPayment, setRefundPayment] = useState(null);

  const limit = 15;

  // ─── Data fetch ─────────────────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey: ["payments", { page, status, method }],
    queryFn: () =>
      paymentApi.list({
        page,
        limit,
        status: status || undefined,
        method: method || undefined,
      }),
  });

  const payments = data?.data?.payments || [];
  const pagination = data?.data?.pagination || {};

  // ─── Client-side search ────────────────────────────────
  const filtered = search
    ? payments.filter((p) => {
        const q = search.toLowerCase();
        return (
          (p.paymentNumber || "").toLowerCase().includes(q) ||
          (p.bookingId?.bookingNumber || "").toLowerCase().includes(q) ||
          `${p.guestId?.firstName || ""} ${p.guestId?.lastName || ""}`
            .toLowerCase()
            .includes(q)
        );
      })
    : payments;

  // ─── Summary stats ─────────────────────────────────────
  const completed = payments.filter((p) => p.status === "completed");
  const pending = payments.filter((p) => p.status === "pending");
  const refunded = payments.filter(
    (p) => p.status === "refunded" || p.status === "partially_refunded",
  );
  const totalProcessed = completed.reduce((s, p) => s + (p.amount || 0), 0);
  const avgAmount = completed.length ? totalProcessed / completed.length : 0;

  // ─── Badge helper ──────────────────────────────────────
  const statusBadge = (s) => {
    switch (s) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
      case "partially_refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Header ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Payments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total || payments.length} transactions · $
            {totalProcessed.toLocaleString()} processed
          </p>
        </div>
      </div>

      {/* ─── KPI Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card bg-gradient-to-br from-green-500/10 to-emerald-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Total Processed
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                $
                {totalProcessed.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {completed.length} completed payments
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-lg">
              <FiDollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Avg Amount
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                $
                {avgAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">per transaction</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
              <FiTrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-yellow-500/10 to-amber-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Pending
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                {pending.length}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                awaiting confirmation
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center shadow-lg">
              <FiClock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-purple-500/10 to-violet-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Refunded
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                {refunded.length}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">returned to guests</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center shadow-lg">
              <FiRotateCcw className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Filters ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search payment, booking, or guest..."
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
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={method}
          onChange={(e) => {
            setMethod(e.target.value);
            setPage(1);
          }}
          className="input py-2 text-sm min-w-[140px]"
        >
          <option value="">All methods</option>
          <option value="cash">Cash</option>
          <option value="credit_card">Credit Card</option>
          <option value="debit_card">Debit Card</option>
          <option value="upi">UPI</option>
          <option value="net_banking">Net Banking</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
      </div>

      {/* ─── Error ──────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load payments: {error.message}
        </div>
      )}

      {/* ─── Table ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Payment #
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Booking
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Guest
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Method
                </th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Amount
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Loading payments...
                  </td>
                </tr>
              )}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    <FiDollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No payments found</p>
                  </td>
                </tr>
              )}

              {filtered.map((p) => (
                <tr
                  key={p._id}
                  onClick={() => setViewPayment(p)}
                  className="hover:bg-primary-50/30 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-6 font-mono text-xs text-gray-600">
                    {p.paymentNumber}
                  </td>
                  <td className="py-3 px-6 font-mono text-xs text-gray-700">
                    {p.bookingId?.bookingNumber || "—"}
                  </td>
                  <td className="py-3 px-6 font-medium text-gray-900">
                    {p.guestId?.firstName} {p.guestId?.lastName}
                  </td>
                  <td className="py-3 px-6 text-gray-600 capitalize">
                    {(p.method || "—").replace(/_/g, " ")}
                  </td>
                  <td className="py-3 px-6 text-right font-semibold text-gray-900">
                    ${(p.amount || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusBadge(
                        p.status,
                      )}`}
                    >
                      {p.status === "completed" && (
                        <FiCheckCircle className="w-3 h-3" />
                      )}
                      {p.status?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-gray-600 text-xs">
                    {new Date(p.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ─────────────────────────────── */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
            <p className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages} · {pagination.total}{" "}
              total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.pages, p + 1))
                }
                disabled={page === pagination.pages}
                className="btn-secondary text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modals ─────────────────────────────────── */}
      <PaymentDetailModal
        payment={viewPayment}
        open={!!viewPayment}
        onClose={() => setViewPayment(null)}
        onRefund={(p) => {
          setViewPayment(null);
          setRefundPayment(p);
        }}
      />

      <RefundModal
        payment={refundPayment}
        open={!!refundPayment}
        onClose={() => setRefundPayment(null)}
      />
    </div>
  );
}
