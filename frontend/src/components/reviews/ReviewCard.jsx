// frontend/src/components/reviews/ReviewCard.jsx
import { FiStar, FiMessageSquare, FiUser } from "react-icons/fi";

const StarRating = ({ value = 0, size = "sm" }) => {
  const sizeClass = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
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

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

export default function ReviewCard({ review, onClick }) {
  const guest = review.guestId || {};
  const initials =
    `${guest.firstName?.[0] || ""}${guest.lastName?.[0] || ""}`.toUpperCase();
  const rating = review.ratings?.overall || 0;
  const hasResponse = review.response?.text;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold flex-shrink-0">
          {initials || <FiUser className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {guest.firstName} {guest.lastName}
            </h3>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {timeAgo(review.createdAt)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <StarRating value={rating} />
            <span className="text-xs font-semibold text-gray-600">
              {rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {review.title && (
        <h4 className="mt-3 font-semibold text-gray-900 line-clamp-1">
          {review.title}
        </h4>
      )}
      <p className="mt-1 text-sm text-gray-600 line-clamp-3">
        {review.comment || "No comment provided"}
      </p>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {review.hotelId?.name && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 uppercase tracking-wide">
            {review.hotelId.name}
          </span>
        )}
        {review.isVerified && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">
            Verified Stay
          </span>
        )}
      </div>

      {hasResponse && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary-600 mb-1">
            <FiMessageSquare className="w-3.5 h-3.5" />
            Hotel Response
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">
            {review.response.text}
          </p>
        </div>
      )}
    </div>
  );
}
