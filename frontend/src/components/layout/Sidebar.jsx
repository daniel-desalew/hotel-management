// frontend/src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiCalendar,
  FiGrid,
  FiUsers,
  FiUserCheck,
  FiCheckSquare,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiDollarSign,
  FiFileText,
  FiStar,
  FiTool,
  FiBell,
} from "react-icons/fi";
import useAuthStore from "../../store/authStore";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: FiHome },

  { to: "/bookings", label: "Bookings", icon: FiCalendar },

  { to: "/rooms", label: "Rooms", icon: FiGrid },

  { to: "/guests", label: "Guests", icon: FiUsers },
  { to: "/notifications", label: "Notifications", icon: FiBell },

  {
    to: "/staff",
    label: "Staff",
    icon: FiUserCheck,
    roles: ["super_admin", "hotel_admin", "manager"],
  },

  { to: "/housekeeping", label: "Housekeeping", icon: FiCheckSquare },

  {
    to: "/maintenance",
    label: "Maintenance",
    icon: FiTool,
    roles: ["super_admin", "hotel_admin", "manager", "housekeeping"],
  },
  {
    to: "/payments",
    label: "Payments",
    icon: FiDollarSign,
    roles: ["super_admin", "hotel_admin", "manager", "receptionist"],
  },

  {
    to: "/invoices",
    label: "Invoices",
    icon: FiFileText,
    roles: ["super_admin", "hotel_admin", "manager", "receptionist"],
  },

  {
    to: "/reviews",
    label: "Reviews",
    icon: FiStar,
    roles: ["super_admin", "hotel_admin", "manager"],
  },

  {
    to: "/reports",
    label: "Reports",
    icon: FiBarChart2,
    roles: ["super_admin", "hotel_admin", "manager"],
  },

  { to: "/settings", label: "Settings", icon: FiSettings },
];

export default function Sidebar({ open }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const filteredItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role),
  );

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 z-30 hidden lg:flex flex-col transition-all duration-300 ${
        open ? "w-64" : "w-20"
      }`}
    >
      {/* ─── Logo ──────────────────────────────── */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Hotel Logo"
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          <div className="w-10 h-10 rounded-lg bg-primary-600 items-center justify-center text-white text-xl font-bold flex-shrink-0 hidden">
            🏨
          </div>
          {open && (
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 truncate">HotelMS</h1>
              <p className="text-xs text-gray-500 truncate">Management</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Navigation ────────────────────────── */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            title={!open ? label : undefined}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary-50 text-primary-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? "text-primary-600" : "text-gray-500"
                  }`}
                />
                {open && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ─── User Footer ───────────────────────── */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-white">
        <div
          className={`flex items-center gap-3 ${!open ? "justify-center" : ""}`}
        >
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {(user?.firstName?.[0] || "?").toUpperCase()}
            {(user?.lastName?.[0] || "").toUpperCase()}
          </div>
          {open && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {user?.role?.replace(/_/g, " ")}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="mt-3 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <FiLogOut className="w-5 h-5 flex-shrink-0" />
          {open && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
