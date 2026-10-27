// frontend/src/components/payments/PaymentDetailModal.jsx
import { useEffect } from "react";
import {
  FiX,
  FiDollarSign,
  FiCreditCard,
  FiCalendar,
  FiUser,
  FiHash,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiRotateCcw,
} from "react-icons/fi";

const STATUS_STYLES = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
  partially_refunded: "bg-orange-100 text-orange-800",
};

const STATUS_ICONS = {
  completed: FiCheckCircle,
  pending: FiClock,
  failed: FiXCircle,
  refunded: FiRotateCcw,
  partially_refunded: FiRotateCcw,
};

export default function PaymentDetailModal({
  payment,
  open,
  onClose,
  onRefund,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !payment) return null;

  const StatusIcon = STATUS_ICONS[payment.status] || FiCheckCircle;
  const canRefund =
    payment.status === "completed" || payment.status === "partially_refunded";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* ─── Header ─────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition"
          >
            <FiX className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FiDollarSign className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/70 font-semibold">
                Amount
              </p>
              <p className="text-3xl font-bold">
                ${(payment.amount || 0).toFixed(2)}
              </p>
              <span
                className={`inline-flex items-center gap-1 mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                  STATUS_STYLES[payment.status] || "bg-gray-100 text-gray-800"
                }`}
              >
                <StatusIcon className="w-3 h-3" />
                {(payment.status || "unknown").replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Body ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Payment Info */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Payment Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                  <FiHash className="w-3.5 h-3.5" /> Payment #
                </div>
                <p className="text-xs font-mono text-gray-900 break-all">
                  {payment.paymentNumber}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                  <FiCreditCard className="w-3.5 h-3.5" /> Method
                </div>
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {(payment.method || "—").replace(/_/g, " ")}
                </p>
              </div>

              {payment.type && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                    <FiDollarSign className="w-3.5 h-3.5" /> Type
                  </div>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {payment.type}
                  </p>
                </div>
              )}

              {payment.gateway && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                    <FiCreditCard className="w-3.5 h-3.5" /> Gateway
                  </div>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {payment.gateway}
                  </p>
                </div>
              )}

              {payment.createdAt && (
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                    <FiCalendar className="w-3.5 h-3.5" /> Date
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(payment.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Booking */}
          {payment.bookingId && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Linked Booking
              </h3>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-sm font-mono font-semibold text-gray-900">
                  {payment.bookingId.bookingNumber || payment.bookingId}
                </p>
                {payment.bookingId.pricing && (
                  <p className="text-xs text-gray-600 mt-1">
                    Total: ${payment.bookingId.pricing.totalAmount?.toFixed(2)}{" "}
                    · Paid: ${payment.bookingId.pricing.paidAmount?.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Guest */}
          {payment.guestId && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Guest
              </h3>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                  {payment.guestId.firstName?.[0]}
                  {payment.guestId.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {payment.guestId.firstName} {payment.guestId.lastName}
                  </p>
                  {payment.guestId.email && (
                    <p className="text-xs text-gray-500">
                      {payment.guestId.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Refund History */}
          {payment.refund?.amount && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Refund
              </h3>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Amount</span>
                  <span className="text-sm font-semibold text-purple-700">
                    ${payment.refund.amount.toFixed(2)}
                  </span>
                </div>
                {payment.refund.reason && (
                  <p className="text-xs text-gray-600 mt-2">
                    {payment.refund.reason}
                  </p>
                )}
                {payment.refund.refundedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Refunded{" "}
                    {new Date(payment.refund.refundedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {payment.notes && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Notes
              </h3>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                {payment.notes}
              </p>
            </div>
          )}
        </div>

        {/* ─── Footer ─────────────────────────────────── */}
        <div className="flex-shrink-0 flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="btn-secondary flex-1">
            Close
          </button>
          {canRefund && (
            <button
              onClick={() => onRefund?.(payment)}
              className="btn-danger flex-1 justify-center"
            >
              <FiRotateCcw className="w-4 h-4" /> Refund
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
