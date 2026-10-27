// frontend/src/pages/guests/GuestList.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiSearch,
  FiPlus,
  FiMail,
  FiPhone,
  FiMapPin,
  FiAward,
  FiEye,
} from "react-icons/fi";
import { guestApi } from "../../api/guestApi";
import GuestDetailModal from "../../components/guests/GuestDetailModal";
import AddGuestModal from "../../components/guests/AddGuestModal";

export default function GuestList() {
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("");
  const [page, setPage] = useState(1);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const limit = 12;

  const { data, isLoading, error } = useQuery({
    queryKey: ["guests", { page, tier }],
    queryFn: () =>
      guestApi.list({
        page,
        limit,
        tier: tier || undefined,
      }),
  });

  const guests = data?.data?.guests || [];
  const pagination = data?.data?.pagination || {};

  const filtered = search
    ? guests.filter((g) => {
        const q = search.toLowerCase();
        const name = `${g.firstName || ""} ${g.lastName || ""}`.toLowerCase();
        return (
          name.includes(q) ||
          (g.email || "").toLowerCase().includes(q) ||
          (g.phone || "").toLowerCase().includes(q)
        );
      })
    : guests;

  const tierColors = {
    platinum: "bg-gradient-to-r from-slate-700 to-slate-900 text-white",
    gold: "bg-gradient-to-r from-amber-400 to-yellow-600 text-white",
    silver: "bg-gradient-to-r from-gray-300 to-gray-500 text-white",
    none: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Guests
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading
              ? "Loading..."
              : `${pagination.total || guests.length} guests in your database`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setAddGuestOpen(true)}>
          <FiPlus className="w-4 h-4" /> Add Guest
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select
          value={tier}
          onChange={(e) => {
            setTier(e.target.value);
            setPage(1);
          }}
          className="input py-2 text-sm min-w-[160px]"
        >
          <option value="">All tiers</option>
          <option value="none">Standard</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="platinum">Platinum</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load guests: {error.message}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton rounded-xl h-44" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-5xl mb-3">👤</div>
          <p className="text-gray-500 font-medium">No guests found</p>
          <p className="text-xs text-gray-400 mt-1">Try clearing filters</p>
        </div>
      )}

      {/* Guest grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => {
            const initials =
              `${g.firstName?.[0] || ""}${g.lastName?.[0] || ""}`.toUpperCase();
            const guestTier = g.loyalty?.tier || "none";

            return (
              <div
                key={g._id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                {/* Header */}
                <div
                  onClick={() => setSelectedGuest(g)}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                    {initials || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {g.firstName} {g.lastName}
                    </h3>
                    <span
                      className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                        tierColors[guestTier] || tierColors.none
                      }`}
                    >
                      {guestTier === "none" ? "Standard" : guestTier}
                    </span>
                  </div>
                </div>

                {/* Contact with clickable actions */}
                <div className="mt-4 space-y-1.5 text-sm text-gray-600">
                  {g.email && (
                    <a
                      href={`mailto:${g.email}`}
                      className="flex items-center gap-2 truncate hover:text-primary-600 transition-colors group"
                      title={`Email ${g.email}`}
                    >
                      <FiMail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 group-hover:text-primary-600" />
                      <span className="truncate">{g.email}</span>
                    </a>
                  )}
                  {g.phone && (
                    <a
                      href={`tel:${g.phone}`}
                      className="flex items-center gap-2 hover:text-primary-600 transition-colors group"
                      title={`Call ${g.phone}`}
                    >
                      <FiPhone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 group-hover:text-primary-600" />
                      <span>{g.phone}</span>
                    </a>
                  )}
                  {g.address?.city && (
                    <p className="flex items-center gap-2 truncate">
                      <FiMapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        {g.address.city}
                        {g.address.country ? `, ${g.address.country}` : ""}
                      </span>
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-500">
                    <FiAward className="w-3.5 h-3.5 text-amber-500" />
                    {g.loyalty?.points || 0} points
                  </span>

                  <div className="flex items-center gap-1">
                    {g.email && (
                      <a
                        href={`mailto:${g.email}`}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Send email"
                      >
                        <FiMail className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {g.phone && (
                      <a
                        href={`tel:${g.phone}`}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                        title="Call"
                      >
                        <FiPhone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedGuest(g)}
                      className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors"
                      title="View profile"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
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

      {/* Detail Modal */}
      <GuestDetailModal
        guest={selectedGuest}
        open={!!selectedGuest}
        onClose={() => setSelectedGuest(null)}
      />
      <AddGuestModal open={addGuestOpen} onClose={() => setAddGuestOpen(false)} />
    </div>
  );
}
