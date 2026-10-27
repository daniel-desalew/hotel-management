// frontend/src/pages/staff/StaffList.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiSearch,
  FiUsers,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiCalendar,
  FiEye,
  FiEdit2,
} from "react-icons/fi";
import api from "../../api/axios";
import StaffDetailModal from "../../components/staff/StaffDetailModal";
import EditStaffModal from "../../components/staff/EditStaffModal";
import AddStaffModal from "../../components/staff/AddStaffModal";
import useAuthStore from "../../store/authStore";

export default function StaffList() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [viewStaff, setViewStaff] = useState(null);
  const [editStaff, setEditStaff] = useState(null);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const currentUser = useAuthStore((state) => state.user);
  const canAddStaff = ["super_admin", "hotel_admin"].includes(currentUser?.role);

  const { data, isLoading, error } = useQuery({
    queryKey: ["staff", { department }],
    queryFn: () =>
      api.get("/staff", {
        params: { department: department || undefined, limit: 100 },
      }),
  });

  const raw = data?.data;
  const staff = Array.isArray(raw) ? raw : raw?.staff || [];

  const filtered = search
    ? staff.filter((s) => {
      const q = search.toLowerCase();
      const user = s.userId || {};
      return (
        `${user.firstName || ""} ${user.lastName || ""}`
          .toLowerCase()
          .includes(q) ||
        (user.email || "").toLowerCase().includes(q) ||
        (s.employeeId || "").toLowerCase().includes(q) ||
        (s.designation || "").toLowerCase().includes(q)
      );
    })
    : staff;

  const deptColors = {
    front_desk: "bg-blue-100 text-blue-800",
    housekeeping: "bg-green-100 text-green-800",
    food_beverage: "bg-orange-100 text-orange-800",
    maintenance: "bg-yellow-100 text-yellow-800",
    security: "bg-red-100 text-red-800",
    management: "bg-purple-100 text-purple-800",
    other: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Staff
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading ? "Loading..." : `${staff.length} team members`}
          </p>
        </div>
        {canAddStaff && (
          <button className="btn-primary" onClick={() => setAddStaffOpen(true)}>
            <FiUsers className="w-4 h-4" /> Add Staff
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="input py-2 text-sm min-w-[180px]"
        >
          <option value="">All departments</option>
          <option value="front_desk">Front Desk</option>
          <option value="housekeeping">Housekeeping</option>
          <option value="food_beverage">Food & Beverage</option>
          <option value="maintenance">Maintenance</option>
          <option value="security">Security</option>
          <option value="management">Management</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load staff: {error.message}
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
          <div className="text-5xl mb-3">👥</div>
          <p className="text-gray-500">No staff found</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const user = s.userId || {};
            const initials =
              `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

            return (
              <div
                key={s._id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                {/* Header - clickable to view */}
                <div
                  onClick={() => setViewStaff(s)}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                    {initials || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {s.designation || "—"}
                    </p>
                    <span
                      className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${deptColors[s.department] || deptColors.other
                        }`}
                    >
                      {(s.department || "other").replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Contact - clickable */}
                <div className="mt-4 space-y-1.5 text-sm text-gray-600">
                  {user.email && (
                    <a
                      href={`mailto:${user.email}`}
                      className="flex items-center gap-2 truncate hover:text-primary-600 transition-colors group"
                      title={`Email ${user.email}`}
                    >
                      <FiMail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 group-hover:text-primary-600" />
                      <span className="truncate">{user.email}</span>
                    </a>
                  )}
                  {user.phone && (
                    <a
                      href={`tel:${user.phone}`}
                      className="flex items-center gap-2 hover:text-primary-600 transition-colors group"
                      title={`Call ${user.phone}`}
                    >
                      <FiPhone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 group-hover:text-primary-600" />
                      <span>{user.phone}</span>
                    </a>
                  )}
                  {s.employeeId && (
                    <p className="flex items-center gap-2">
                      <FiBriefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="font-mono text-xs">{s.employeeId}</span>
                    </p>
                  )}
                  {s.joiningDate && (
                    <p className="flex items-center gap-2 text-xs text-gray-400">
                      <FiCalendar className="w-3.5 h-3.5" />
                      Joined {new Date(s.joiningDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 capitalize">
                      {s.shift || "morning"} shift
                    </span>
                    <span
                      className={`font-medium ${s.isActive ? "text-green-600" : "text-red-600"
                        }`}
                    >
                      ● {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {user.email && (
                      <a
                        href={`mailto:${user.email}`}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Send email"
                      >
                        <FiMail className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {user.phone && (
                      <a
                        href={`tel:${user.phone}`}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                        title="Call"
                      >
                        <FiPhone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => setViewStaff(s)}
                      className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors"
                      title="View profile"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditStaff(s)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <StaffDetailModal
        staff={viewStaff}
        open={!!viewStaff}
        onClose={() => setViewStaff(null)}
        onEdit={(s) => {
          setViewStaff(null);
          setEditStaff(s);
        }}
      />
      <EditStaffModal
        staff={editStaff}
        open={!!editStaff}
        onClose={() => setEditStaff(null)}
      />
      <AddStaffModal open={addStaffOpen} onClose={() => setAddStaffOpen(false)} />
    </div>
  );
}
