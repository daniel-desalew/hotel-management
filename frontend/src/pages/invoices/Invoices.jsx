// frontend/src/pages/invoices/Invoices.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiSearch,
  FiFileText,
  FiPlus,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";
import { invoiceApi } from "../../api/invoiceApi";
import InvoiceDetailModal from "../../components/invoices/InvoiceDetailModal";
import GenerateInvoiceModal from "../../components/invoices/GenerateInvoiceModal";

export default function Invoices() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);

  const limit = 15;

  const { data, isLoading, error } = useQuery({
    queryKey: ["invoices", { page, status }],
    queryFn: () =>
      invoiceApi.list({
        page,
        limit,
        status: status || undefined,
      }),
  });

  const invoices = data?.data?.invoices || [];
  const pagination = data?.data?.pagination || {};

  const filtered = search
    ? invoices.filter((inv) => {
        const q = search.toLowerCase();
        return (
          (inv.invoiceNumber || "").toLowerCase().includes(q) ||
          (inv.bookingId?.bookingNumber || "").toLowerCase().includes(q) ||
          `${inv.guestId?.firstName || ""} ${inv.guestId?.lastName || ""}`
            .toLowerCase()
            .includes(q)
        );
      })
    : invoices;

  const totalInvoiced = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
  const totalBalance = invoices.reduce((s, i) => s + (i.balanceAmount || 0), 0);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  const statusBadge = (s) => {
    switch (s) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "partially_paid":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "issued":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Invoices
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total || invoices.length} invoices · $
            {totalInvoiced.toLocaleString()} invoiced
          </p>
        </div>
        <button onClick={() => setShowGenerate(true)} className="btn-primary">
          <FiPlus className="w-4 h-4" /> Generate Invoice
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Total Invoiced
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                $
                {totalInvoiced.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
              <FiFileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-green-500/10 to-emerald-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Total Paid
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                $
                {totalPaid.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-lg">
              <FiCheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-amber-500/10 to-yellow-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Outstanding
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                $
                {totalBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center shadow-lg">
              <FiClock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-red-500/10 to-rose-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Overdue
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                {overdueCount}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">need attention</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-lg">
              <FiAlertCircle className="w-5 h-5" />
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
            placeholder="Search invoice, booking, or guest..."
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
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load invoices: {error.message}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">
                  Invoice #
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">
                  Guest
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">
                  Booking
                </th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase">
                  Total
                </th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase">
                  Balance
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Loading invoices...
                  </td>
                </tr>
              )}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    <FiFileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No invoices found</p>
                  </td>
                </tr>
              )}

              {filtered.map((inv) => (
                <tr
                  key={inv._id}
                  onClick={() => setViewInvoice(inv)}
                  className="hover:bg-primary-50/30 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-6 font-mono text-xs text-gray-600">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-6 font-medium text-gray-900">
                    {inv.guestId?.firstName} {inv.guestId?.lastName}
                  </td>
                  <td className="py-3 px-6 font-mono text-xs text-gray-700">
                    {inv.bookingId?.bookingNumber || "—"}
                  </td>
                  <td className="py-3 px-6 text-right font-semibold text-gray-900">
                    ${(inv.totalAmount || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-6 text-right font-medium">
                    <span
                      className={
                        (inv.balanceAmount || 0) > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      ${(inv.balanceAmount || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusBadge(
                        inv.status,
                      )}`}
                    >
                      {inv.status?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-gray-600 text-xs">
                    {new Date(
                      inv.issueDate || inv.createdAt,
                    ).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* Modals */}
      <InvoiceDetailModal
        invoice={viewInvoice}
        open={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
      />
      <GenerateInvoiceModal
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
      />
    </div>
  );
}
