// frontend/src/components/guests/GuestDetailModal.jsx
import { useEffect } from "react";
import {
  FiX,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiAward,
  FiUser,
  FiBookmark,
} from "react-icons/fi";

const TIER_COLORS = {
  platinum: "bg-gradient-to-r from-slate-700 to-slate-900 text-white",
  gold: "bg-gradient-to-r from-amber-400 to-yellow-600 text-white",
  silver: "bg-gradient-to-r from-gray-300 to-gray-500 text-white",
  none: "bg-gray-100 text-gray-700",
};

export default function GuestDetailModal({ guest, open, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !guest) return null;

  const initials =
    `${guest.firstName?.[0] || ""}${guest.lastName?.[0] || ""}`.toUpperCase();
  const tier = guest.loyalty?.tier || "none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary-600 to-indigo-700 text-white p-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition"
          >
            <FiX className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {guest.firstName} {guest.lastName}
              </h2>
              <span
                className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                  TIER_COLORS[tier] || TIER_COLORS.none
                }`}
              >
                {tier === "none" ? "Standard" : tier} Member
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Contact */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Contact
            </h3>

            {guest.email ? (
              <a
                href={`mailto:${guest.email}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100">
                  <FiMail className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {guest.email}
                  </p>
                </div>
              </a>
            ) : (
              <p className="text-sm text-gray-400 italic">No email on file</p>
            )}

            {guest.phone ? (
              <a
                href={`tel:${guest.phone}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group"
              >
                <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-100">
                  <FiPhone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {guest.phone}
                  </p>
                </div>
              </a>
            ) : (
              <p className="text-sm text-gray-400 italic">No phone on file</p>
            )}

            {guest.address?.city && (
              <div className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FiMapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">
                    {guest.address.city}
                    {guest.address.country ? `, ${guest.address.country}` : ""}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Loyalty */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-3">
              <FiAward className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Loyalty Program
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-500">Points</p>
                <p className="text-lg font-bold text-gray-900">
                  {guest.loyalty?.points || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Stays</p>
                <p className="text-lg font-bold text-gray-900">
                  {guest.loyalty?.totalStays || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Spent</p>
                <p className="text-lg font-bold text-gray-900">
                  ${guest.loyalty?.totalSpent || 0}
                </p>
              </div>
            </div>
          </div>

          {/* ID / Document */}
          {guest.idProof?.number && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                ID Document
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                <FiBookmark className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 capitalize">
                    {guest.idProof.type?.replace(/_/g, " ") || "ID"}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {guest.idProof.number}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {guest.notes && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Notes
              </h3>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                {guest.notes}
              </p>
            </div>
          )}

          {/* Tags */}
          {guest.tags?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {guest.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="btn-secondary flex-1">
            Close
          </button>
          {guest.email && (
            <a
              href={`mailto:${guest.email}`}
              className="btn-primary flex-1 justify-center"
            >
              <FiMail className="w-4 h-4" /> Send Email
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
