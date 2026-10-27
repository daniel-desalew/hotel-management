import { useState, useEffect } from "react";
import { FiBell, FiX } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import useSocketStore, { SOCKET_EVENTS } from "../../store/socketStore";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

export default function NotificationsDrawer() {
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    markAllRead,
    clearNotifications,
    loadNotifications,
    notificationsLoading,
    joinHotel,
    on,
  } = useSocketStore();

  // Auto-join hotel room + listen for notifications
  useEffect(() => {
    if (!user?.hotelId) return;
    joinHotel(user.hotelId);

    const offBookingCreated = on(SOCKET_EVENTS.BOOKING_CREATED, (b) => {
      toast.success(`New booking: ${b.bookingNumber}`);
    });

    const offCheckIn = on(SOCKET_EVENTS.CHECK_IN, (b) => {
      toast.success(`Check-in: ${b.bookingNumber}`);
    });

    const offCheckOut = on(SOCKET_EVENTS.CHECK_OUT, (b) => {
      toast(`Check-out: ${b.bookingNumber}`, { icon: "👋" });
    });

    const offPayment = on(SOCKET_EVENTS.PAYMENT_RECEIVED, (p) => {
      toast.success(`Payment received: $${p.amount}`);
    });

    const offTask = on(SOCKET_EVENTS.HOUSEKEEPING_ASSIGNED, () => {
      toast(`New housekeeping task`, { icon: "🧹" });
    });
    const offMaintenance = on(SOCKET_EVENTS.MAINTENANCE_CREATED, (request) => {
      toast(`Maintenance request: ${request.title}`, { icon: "🛠️" });
    });

    return () => {
      offBookingCreated();
      offCheckIn();
      offCheckOut();
      offPayment();
      offTask();
      offMaintenance();
    };
  }, [user, joinHotel, on]);

  const handleOpen = async () => {
    setOpen(true);
    await loadNotifications();
    try {
      await markAllRead();
    } catch (error) {
      toast.error(error?.message || "Could not mark notifications as read");
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100"
        aria-label="Notifications"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed top-0 right-0 h-screen w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Notifications</h2>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={async () => {
                      try {
                        await clearNotifications();
                      } catch (error) {
                        toast.error(
                          error?.message || "Could not clear notifications",
                        );
                      }
                    }}
                    className="text-xs text-gray-500 hover:text-gray-800"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notificationsLoading ? (
                <div className="text-center py-16 text-gray-400">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <FiBell className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {notifications.map((n, i) => (
                    <li
                      key={n._id || n.id || i}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {n.title || n.type || "Notification"}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {n.message || "New activity"}
                      </p>
                      {n.createdAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
