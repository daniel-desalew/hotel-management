// frontend/src/components/invoices/GenerateInvoiceModal.jsx
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiX, FiFileText } from "react-icons/fi";
import { invoiceApi } from "../../api/invoiceApi";
import { bookingApi } from "../../api/bookingApi";

export default function GenerateInvoiceModal({ open, onClose }) {
  const qc = useQueryClient();
  const [bookingId, setBookingId] = useState("");

  const { data: bookingsData } = useQuery({
    queryKey: ["bookings-for-invoice"],
    queryFn: () => bookingApi.list({ limit: 100 }),
    enabled: open,
  });

  const bookings = bookingsData?.data?.bookings || [];
  const selectedBooking = bookings.find((b) => b._id === bookingId);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setBookingId("");
  }, [open]);

  const generateMutation = useMutation({
    mutationFn: () => invoiceApi.generateFromBooking(bookingId),
    onSuccess: (res) => {
      toast.success(`Invoice ${res.data?.invoiceNumber || ""} created`);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      onClose();
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to generate invoice");
    },
  });

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bookingId) return toast.error("Select a booking");
    generateMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <FiFileText className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Generate Invoice
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Select Booking *</label>
            <select
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="input"
              required
            >
              <option value="">Choose a booking...</option>
              {bookings.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.bookingNumber} — {b.guestId?.firstName}{" "}
                  {b.guestId?.lastName} — ${b.pricing?.totalAmount?.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          {selectedBooking && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Preview
              </h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Guest</span>
                  <span className="font-medium">
                    {selectedBooking.guestId?.firstName}{" "}
                    {selectedBooking.guestId?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-medium">
                    {new Date(selectedBooking.checkIn).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-medium">
                    {new Date(selectedBooking.checkOut).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nights</span>
                  <span className="font-medium">{selectedBooking.nights}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>
                    ${selectedBooking.pricing?.totalAmount?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Paid</span>
                  <span>
                    ${selectedBooking.pricing?.paidAmount?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Balance</span>
                  <span>
                    ${selectedBooking.pricing?.balanceAmount?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500">
            An invoice will be auto-generated with line items from the booking's
            room charges, taxes, and any discounts.
          </p>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={generateMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary flex-1"
            disabled={generateMutation.isPending || !bookingId}
          >
            <FiFileText className="w-4 h-4" />
            {generateMutation.isPending ? "Generating..." : "Generate Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
