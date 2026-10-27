// frontend/src/components/invoices/InvoiceDetailModal.jsx
import { useEffect, useRef } from "react";
import {
  FiX,
  FiPrinter,
  FiMail,
  FiCalendar,
  FiUser,
  FiHash,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { invoiceApi } from "../../api/invoiceApi";

const STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-800",
  issued: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  partially_paid: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_ICONS = {
  paid: FiCheckCircle,
  issued: FiClock,
  overdue: FiAlertCircle,
  draft: FiClock,
};

export default function InvoiceDetailModal({ invoice, open, onClose }) {
  const printRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !invoice) return null;

  const StatusIcon = STATUS_ICONS[invoice.status] || FiClock;
  const guest = invoice.guestId || {};
  const booking = invoice.bookingId || {};

  // ─── Print PDF ──────────────────────────────────────────
  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1f2937; }
            h1 { color: #1e40af; margin: 0; }
            .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .box { background: #f9fafb; padding: 15px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #f3f4f6; font-weight: 600; }
            .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 20px; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
            .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  // ─── Send Email ─────────────────────────────────────────
  const handleSendEmail = async () => {
    try {
      await invoiceApi.sendEmail(invoice._id);
      toast.success("Invoice sent by email");
    } catch (err) {
      toast.error(err?.message || "Failed to send");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ─── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <FiHash className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Invoice {invoice.invoiceNumber}
              </h2>
              <p className="text-xs text-gray-500">
                Created {new Date(invoice.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* ─── Body ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Printable content */}
          <div ref={printRef}>
            {/* Company header */}
            <div className="header flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-primary-700">INVOICE</h1>
                <p className="text-sm text-gray-500 mt-1">
                  #{invoice.invoiceNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Grand Plaza Hotel</p>
                <p className="text-xs text-gray-500">
                  123 Main Street, New York
                </p>
                <p className="text-xs text-gray-500">info@grandplaza.com</p>
              </div>
            </div>

            {/* Status + dates */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="box">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Bill To
                </p>
                <p className="font-semibold text-gray-900">
                  {guest.firstName} {guest.lastName}
                </p>
                {guest.email && (
                  <p className="text-sm text-gray-600">{guest.email}</p>
                )}
                {guest.phone && (
                  <p className="text-sm text-gray-600">{guest.phone}</p>
                )}
              </div>
              <div className="box">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                      STATUS_STYLES[invoice.status] ||
                      "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {invoice.status?.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Issue Date</p>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  {new Date(
                    invoice.issueDate || invoice.createdAt,
                  ).toLocaleDateString()}
                </p>
                {invoice.dueDate && (
                  <>
                    <p className="text-xs text-gray-500">Due Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Booking reference */}
            {booking.bookingNumber && (
              <div className="box mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Booking Reference
                </p>
                <p className="text-sm font-mono font-semibold text-gray-900">
                  {booking.bookingNumber}
                </p>
                {booking.checkIn && (
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(booking.checkIn).toLocaleDateString()} →{" "}
                    {new Date(booking.checkOut).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Items table */}
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">
                    Description
                  </th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-600 uppercase">
                    Qty
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase">
                    Price
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-900">
                      {item.description}
                    </td>
                    <td className="py-2 px-3 text-center text-gray-600">
                      {item.quantity || 1}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-600">
                      ${(item.unitPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-gray-900">
                      $
                      {(
                        item.amount || item.unitPrice * (item.quantity || 1)
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {(!invoice.items || invoice.items.length === 0) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-6 text-gray-400 italic"
                    >
                      No line items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totals */}
            <div className="ml-auto max-w-xs space-y-2">
              <div className="row flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  ${(invoice.subtotal || 0).toFixed(2)}
                </span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="row flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">
                    ${(invoice.taxAmount || 0).toFixed(2)}
                  </span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="row flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-green-600">
                    -${(invoice.discount || 0).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="row flex justify-between pt-2 border-t-2 border-gray-200">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-lg text-primary-700">
                  ${(invoice.totalAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="row flex justify-between text-sm">
                <span className="text-gray-600">Paid</span>
                <span className="font-medium text-green-600">
                  ${(invoice.paidAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="row flex justify-between text-sm">
                <span className="text-gray-600">Balance Due</span>
                <span className="font-semibold text-red-600">
                  ${(invoice.balanceAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Notes
                </p>
                <p className="text-sm text-gray-700">{invoice.notes}</p>
              </div>
            )}

            {/* Terms */}
            {invoice.termsAndConditions && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Terms & Conditions
                </p>
                <p className="text-xs text-gray-600">
                  {invoice.termsAndConditions}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="footer mt-10 pt-6 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                Thank you for your business · Grand Plaza Hotel
              </p>
            </div>
          </div>
        </div>

        {/* ─── Footer Actions ─────────────────────────── */}
        <div className="flex-shrink-0 flex flex-wrap gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 min-w-[100px]"
          >
            Close
          </button>
          <button
            onClick={handleSendEmail}
            className="btn-secondary flex-1 min-w-[140px] justify-center"
          >
            <FiMail className="w-4 h-4" /> Send Email
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary flex-1 min-w-[140px] justify-center"
          >
            <FiPrinter className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
