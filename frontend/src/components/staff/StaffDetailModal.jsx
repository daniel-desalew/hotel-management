// frontend/src/components/staff/StaffDetailModal.jsx
import { useEffect } from "react";
import {
  FiX,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiUser,
} from "react-icons/fi";

const DEPT_COLORS = {
  front_desk: "bg-blue-100 text-blue-800",
  housekeeping: "bg-green-100 text-green-800",
  food_beverage: "bg-orange-100 text-orange-800",
  maintenance: "bg-yellow-100 text-yellow-800",
  security: "bg-red-100 text-red-800",
  management: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800",
};

export default function StaffDetailModal({
  staff,
  open,
  onClose,
  onEdit,
  onDelete,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !staff) return null;

  const user = staff.userId || {};
  const initials =
    `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  const deptColor = DEPT_COLORS[staff.department] || DEPT_COLORS.other;

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
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-white/80 mt-0.5">
                {staff.designation}
              </p>
              <span
                className={`inline-block mt-2 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide ${deptColor}`}
              >
                {staff.department?.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Contact */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Contact
            </h3>

            {user.email && (
              <a
                href={`mailto:${user.email}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100">
                  <FiMail className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.email}
                  </p>
                </div>
              </a>
            )}

            {user.phone && (
              <a
                href={`tel:${user.phone}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition group"
              >
                <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-100">
                  <FiPhone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.phone}
                  </p>
                </div>
              </a>
            )}
          </div>

          {/* Employment */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Employment
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                  <FiBriefcase className="w-3.5 h-3.5" /> Employee ID
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {staff.employeeId}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                  <FiClock className="w-3.5 h-3.5" /> Shift
                </div>
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {staff.shift}
                </p>
              </div>

              {staff.joiningDate && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                    <FiCalendar className="w-3.5 h-3.5" /> Joined
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(staff.joiningDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {staff.salary && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                    <FiDollarSign className="w-3.5 h-3.5" /> Salary
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    ${staff.salary}/mo
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FiUser className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Status</span>
            </div>
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full ${
                staff.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {staff.isActive ? "● Active" : "● Inactive"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="btn-secondary flex-1">
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit?.(staff);
            }}
            className="btn-primary flex-1 justify-center"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
