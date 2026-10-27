// frontend/src/App.jsx
import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "./store/authStore";
import useSocketStore, { SOCKET_EVENTS } from "./store/socketStore";

import ProtectedRoute from "./components/layout/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

// ─── Auth pages ─────────────────────────────────────────
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// ─── Main pages ─────────────────────────────────────────
import Dashboard from "./pages/dashboard/Dashboard";
import BookingList from "./pages/bookings/BookingList";
import BookingDetail from "./pages/bookings/BookingDetail";
import BookingCreate from "./pages/bookings/BookingCreate";
import RoomList from "./pages/rooms/RoomList";
import GuestList from "./pages/guests/GuestList";
import StaffList from "./pages/staff/StaffList";
import HousekeepingList from "./pages/housekeeping/HousekeepingList";

// ─── Feature pages ──────────────────────────────────────
import Payments from "./pages/payments/Payments";
import Invoices from "./pages/invoices/Invoices";
import Reviews from "./pages/reviews/Reviews";
import MaintenanceList from "./pages/maintenance/MaintenanceList";

// ─── Other pages ────────────────────────────────────────
import Reports from "./pages/reports/Reports";
import Settings from "./pages/settings/Settings";
import Notifications from "./pages/notifications/Notifications";
import NotFound from "./pages/NotFound";

export default function App() {
  const init = useAuthStore((s) => s.init);
  const initialized = useAuthStore((s) => s.initialized);
  const user = useAuthStore((s) => s.user);

  const connect = useSocketStore((s) => s.connect);
  const disconnect = useSocketStore((s) => s.disconnect);
  const socket = useSocketStore((s) => s.socket);
  const queryClient = useQueryClient();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (initialized && user) {
      connect();
    } else {
      disconnect();
    }
  }, [initialized, user, connect, disconnect]);

  useEffect(() => {
    if (!socket) return undefined;

    const refresh = (...queryKeys) => () => {
      queryKeys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });
    };
    const subscriptions = [
      [[SOCKET_EVENTS.BOOKING_CREATED, SOCKET_EVENTS.BOOKING_UPDATED, SOCKET_EVENTS.BOOKING_CANCELLED, SOCKET_EVENTS.CHECK_IN, SOCKET_EVENTS.CHECK_OUT], refresh("bookings", "booking", "rooms", "dashboard", "revenueChart", "occupancyChart")],
      [[SOCKET_EVENTS.PAYMENT_RECEIVED, SOCKET_EVENTS.PAYMENT_FAILED], refresh("payments", "bookings", "dashboard", "revenueChart")],
      [[SOCKET_EVENTS.ROOM_STATUS_CHANGED, SOCKET_EVENTS.ROOM_CLEANED], refresh("rooms", "housekeeping", "dashboard", "occupancyChart")],
      [[SOCKET_EVENTS.HOUSEKEEPING_ASSIGNED, SOCKET_EVENTS.HOUSEKEEPING_COMPLETED], refresh("housekeeping", "rooms", "dashboard")],
      [[SOCKET_EVENTS.MAINTENANCE_CREATED], refresh("maintenance", "rooms", "dashboard")],
      [[SOCKET_EVENTS.DASHBOARD_REFRESH], refresh("dashboard", "revenueChart", "occupancyChart")],
      [[SOCKET_EVENTS.NOTIFICATION_NEW], refresh("notifications")],
    ];

    const handlers = subscriptions.flatMap(([events, handler]) =>
      events.map((event) => {
        socket.on(event, handler);
        return [event, handler];
      }),
    );
    return () => handlers.forEach(([event, handler]) => socket.off(event, handler));
  }, [socket, queryClient]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* ─── Public ──────────────────────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ─── Protected ───────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Bookings */}
        <Route path="/bookings" element={<BookingList />} />
        <Route path="/bookings/new" element={<BookingCreate />} />
        <Route path="/bookings/:id" element={<BookingDetail />} />

        {/* Rooms */}
        <Route path="/rooms" element={<RoomList />} />

        {/* Guests */}
        <Route path="/guests" element={<GuestList />} />

        {/* Staff (restricted) */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute roles={["super_admin", "hotel_admin", "manager"]}>
              <StaffList />
            </ProtectedRoute>
          }
        />

        {/* Housekeeping */}
        <Route path="/housekeeping" element={<HousekeepingList />} />

        {/* Payments (both singular + plural) */}
        <Route path="/payments" element={<Payments />} />
        <Route path="/payment" element={<Payments />} />

        {/* Invoices (both singular + plural) */}
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoice" element={<Invoices />} />

        {/* Reviews (both singular + plural) */}
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/review" element={<Reviews />} />

        {/* Maintenance (both singular + plural) */}
        <Route path="/maintenance" element={<MaintenanceList />} />
        <Route path="/maintenances" element={<MaintenanceList />} />

        {/* Reports (restricted) */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={["super_admin", "hotel_admin", "manager"]}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      {/* ─── 404 ─────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
