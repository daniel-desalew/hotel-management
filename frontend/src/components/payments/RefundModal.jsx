// frontend/src/components/payments/RefundModal.jsx
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiX, FiRotateCcw, FiAlertCircle } from "react-icons/fi";
import { paymentApi } from "../../api/paymentApi";

export default function RefundModal({ payment, open, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ amount: "", reason: "" });

  useEffect(() => {
    if (payment && open) {
      setForm({
        amount: payment.amount?.toString() || "",
        reason: "",
      });
    }
  }, [payment, open]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const refundMutation = useMutation({
    mutationFn: (data) => paymentApi.refund(payment._id, data),
    onSuccess: (res) => {
      toast.success(`Refund of $${form.amount} processed`);
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["payment", payment._id] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    },
    onError: (err) => {
      toast.error(err?.message || "Refund failed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return toast.error("Enter a valid amount");
    if (amount > payment.amount) {
      return toast.error(`Max refund is $${payment.amount.toFixed(2)}`);
    }
    if (!form.reason.trim()) return toast.error("Reason is required");

    refundMutation.mutate({
      amount,
      reason: form.reason.trim(),
    });
  };

  if (!open || !payment) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <FiRotateCcw className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Process Refund</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Warning */}
        <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
          <FiAlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            This will refund money to the guest. The payment status will change
            to <strong>refunded</strong>. This action cannot be undone.
          </p>
        </div>

        {/* Original payment */}
        <div className="mx-6 mt-4 bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Original Payment</p>
          <p className="text-lg font-bold text-gray-900">
            ${payment.amount?.toFixed(2)}
          </p>
          <p className="text-xs font-mono text-gray-500 mt-0.5">
            {payment.paymentNumber}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Refund Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={payment.amount}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="input"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Max: ${payment.amount?.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="label">Reason *</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="input min-h-[80px] resize-y"
              placeholder="Why is this refund being processed?"
              required
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={refundMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-danger flex-1"
            disabled={refundMutation.isPending}
          >
            <FiRotateCcw className="w-4 h-4" />
            {refundMutation.isPending ? "Processing..." : "Refund Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
