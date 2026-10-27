// frontend/src/components/reviews/ReviewDetailModal.jsx
import { useEffect } from "react";
import {
  FiX,
  FiStar,
  FiMessageSquare,
  FiTrash2,
  FiCheckCircle,
} from "react-icons/fi";

const StarRating = ({ value = 0, size = "sm" }) => {
  const sizeClass = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <FiStar
          key={n}
          className={`${sizeClass} ${
            n <= value ? "fill-amber-400 text-amber-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
};

const SubRating = ({ label, value }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-sm text-gray-600">{label}</span>
    <div className="flex items-center gap-2">
      <StarRating value={value || 0} />
      <span className="text-xs font-semibold text-gray-700 w-6 text-right">
        {value?.toFixed(1) || "0.0"}
      </span>
    </div>
  </div>
);

export default function ReviewDetailModal({
  review,
  open,
  onClose,
  onRespond,
  onDelete,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !review) return null;

  const guest = review.guestId || {};
  const initials =
    `${guest.firstName?.[0] || ""}${guest.lastName?.[0] || ""}`.toUpperCase();
  const ratings = review.ratings || {};
  const hasResponse = review.response?.text;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold">
              {initials}
            </div>
            <div>
              <h2 className="font-bold text-gray-900">
                {guest.firstName} {guest.lastName}
              </h2>
              <p className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
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

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-100">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {ratings.overall?.toFixed(1) || "0.0"}
                </div>
                <div className="mt-1">
                  <StarRating value={ratings.overall || 0} size="lg" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Overall</p>
              </div>
              <div className="flex-1">
                <SubRating label="Cleanliness" value={ratings.cleanliness} />
                <SubRating label="Comfort" value={ratings.comfort} />
                <SubRating label="Location" value={ratings.location} />
                <SubRating label="Facilities" value={ratings.facilities} />
                <SubRating label="Staff" value={ratings.staff} />
                <SubRating label="Value" value={ratings.valueForMoney} />
              </div>
            </div>
          </div>

          <div>
            {review.title && (
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {review.title}
              </h3>
            )}
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {review.comment || "No comment provided."}
            </p>
          </div>

          {review.isVerified && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
              <FiCheckCircle className="w-3.5 h-3.5" />
              Verified Stay
            </div>
          )}

          {hasResponse && (
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiMessageSquare className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-semibold text-primary-900">
                  Hotel Response
                </span>
              </div>
              <p className="text-sm text-gray-700">{review.response.text}</p>
              {review.response.respondedAt && (
                <p className="text-xs text-gray-500 mt-2">
                  Responded on{" "}
                  {new Date(review.response.respondedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="btn-secondary flex-1">
            Close
          </button>

          {!hasResponse && (
            <button
              onClick={() => {
                onClose();
                onRespond?.(review);
              }}
              className="btn-primary flex-1 justify-center"
            >
              <FiMessageSquare className="w-4 h-4" /> Respond
            </button>
          )}

          {hasResponse && onDelete && (
            <button
              onClick={() => onDelete(review)}
              className="btn-danger px-4"
              title="Delete review"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
