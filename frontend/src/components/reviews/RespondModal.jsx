// frontend/src/components/reviews/RespondModal.jsx
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiX, FiSend, FiMessageSquare } from "react-icons/fi";
import { reviewApi } from "../../api/reviewApi";

export default function RespondModal({ review, open, onClose }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const respondMutation = useMutation({
    mutationFn: (data) => reviewApi.respond(review._id, data),
    onSuccess: () => {
      toast.success("Response posted");
      qc.invalidateQueries({ queryKey: ["reviews"] });
      onClose();
    },
    onError: (err) => toast.error(err?.message || "Failed to respond"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return toast.error("Response text is required");
    if (text.length > 1000) return toast.error("Response is too long");
    respondMutation.mutate({ text: text.trim() });
  };

  if (!open || !review) return null;

  const guest = review.guestId || {};

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <FiMessageSquare className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Respond to Review
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Replying to</p>
          <p className="text-sm font-semibold text-gray-900">
            {guest.firstName} {guest.lastName}
          </p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            "{review.comment?.slice(0, 120)}..."
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Your Response *</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="input min-h-[140px] resize-y"
              placeholder="Thank the guest and address their feedback..."
              maxLength={1000}
              autoFocus
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Be professional and courteous</span>
              <span className={text.length > 950 ? "text-red-500" : ""}>
                {text.length} / 1000
              </span>
            </div>
          </div>
        </form>

        <div className="flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={respondMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary flex-1"
            disabled={respondMutation.isPending || !text.trim()}
          >
            <FiSend className="w-4 h-4" />
            {respondMutation.isPending ? "Posting..." : "Post Response"}
          </button>
        </div>
      </div>
    </div>
  );
}
