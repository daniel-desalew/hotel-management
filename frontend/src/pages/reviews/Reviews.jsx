// frontend/src/pages/reviews/Reviews.jsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  FiSearch,
  FiStar,
  FiTrendingUp,
  FiMessageSquare,
  FiCheckCircle,
} from "react-icons/fi";
import { reviewApi } from "../../api/reviewApi";
import ReviewCard from "../../components/reviews/ReviewCard";
import ReviewDetailModal from "../../components/reviews/ReviewDetailModal";
import RespondModal from "../../components/reviews/RespondModal";

export default function Reviews() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const [viewReview, setViewReview] = useState(null);
  const [respondReview, setRespondReview] = useState(null);

  const limit = 12;

  const { data, isLoading, error } = useQuery({
    queryKey: ["reviews", { page, minRating }],
    queryFn: () =>
      reviewApi.list({
        page,
        limit,
        minRating: minRating || undefined,
      }),
  });

  const reviews = data?.data?.reviews || [];
  const pagination = data?.data?.pagination || {};

  const stats = useMemo(() => {
    if (!reviews.length) {
      return { avg: 0, total: 0, responded: 0, fiveStar: 0 };
    }
    const total = pagination.total || reviews.length;
    const responded = reviews.filter((r) => r.response?.text).length;
    const avg =
      reviews.reduce((s, r) => s + (r.ratings?.overall || 0), 0) /
      reviews.length;
    const fiveStar = reviews.filter(
      (r) => (r.ratings?.overall || 0) === 5,
    ).length;
    return { avg, total, responded, fiveStar };
  }, [reviews, pagination.total]);

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => {
        const guest = r.guestId || {};
        return (
          (r.comment || "").toLowerCase().includes(q) ||
          (r.title || "").toLowerCase().includes(q) ||
          `${guest.firstName || ""} ${guest.lastName || ""}`
            .toLowerCase()
            .includes(q)
        );
      });
    }
    if (sortBy === "highest") {
      list.sort(
        (a, b) => (b.ratings?.overall || 0) - (a.ratings?.overall || 0),
      );
    } else if (sortBy === "lowest") {
      list.sort(
        (a, b) => (a.ratings?.overall || 0) - (b.ratings?.overall || 0),
      );
    } else {
      list.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
    }
    return list;
  }, [reviews, search, sortBy]);

  const deleteMutation = useMutation({
    mutationFn: (id) => reviewApi.remove(id),
    onSuccess: () => {
      toast.success("Review deleted");
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (err) => toast.error(err?.message || "Delete failed"),
  });

  const handleDelete = (review) => {
    if (window.confirm("Delete this review? This cannot be undone.")) {
      deleteMutation.mutate(review._id);
    }
  };

  const responseRate = reviews.length
    ? Math.round((stats.responded / reviews.length) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Reviews
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading
              ? "Loading..."
              : `${pagination.total || reviews.length} guest reviews`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card bg-gradient-to-br from-amber-500/10 to-yellow-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Average Rating
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                {stats.avg.toFixed(1)}
                <span className="text-sm text-gray-400"> / 5</span>
              </p>
              <div className="flex gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <FiStar
                    key={n}
                    className={`w-3.5 h-3.5 ${
                      n <= Math.round(stats.avg)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center shadow-lg">
              <FiStar className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Total Reviews
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                {stats.total}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {stats.fiveStar} five-star
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
              <FiTrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-green-500/10 to-emerald-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Response Rate
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                {responseRate}%
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {stats.responded} responded
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-lg">
              <FiMessageSquare className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-purple-500/10 to-violet-600/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Verified Stays
              </p>
              <p className="text-2xl font-bold mt-1 text-gray-900">
                {reviews.filter((r) => r.isVerified).length}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                of {reviews.length} shown
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center shadow-lg">
              <FiCheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by guest, title, or comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        <select
          value={minRating}
          onChange={(e) => {
            setMinRating(e.target.value);
            setPage(1);
          }}
          className="input py-2 text-sm min-w-[140px]"
        >
          <option value="">All ratings</option>
          <option value="5">5 stars only</option>
          <option value="4">4+ stars</option>
          <option value="3">3+ stars</option>
          <option value="2">2+ stars</option>
          <option value="1">1+ stars</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input py-2 text-sm min-w-[140px]"
        >
          <option value="recent">Most recent</option>
          <option value="highest">Highest rated</option>
          <option value="lowest">Lowest rated</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load reviews: {error.message}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton rounded-xl h-44" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-5xl mb-3">⭐</div>
          <p className="text-gray-500 font-medium">No reviews found</p>
          <p className="text-xs text-gray-400 mt-1">
            Reviews appear here once guests submit them after checkout
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <ReviewCard
              key={r._id}
              review={r}
              onClick={() => setViewReview(r)}
            />
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600 px-4">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="btn-secondary"
          >
            Next →
          </button>
        </div>
      )}

      <ReviewDetailModal
        review={viewReview}
        open={!!viewReview}
        onClose={() => setViewReview(null)}
        onRespond={(r) => setRespondReview(r)}
        onDelete={handleDelete}
      />

      <RespondModal
        review={respondReview}
        open={!!respondReview}
        onClose={() => setRespondReview(null)}
      />
    </div>
  );
}
