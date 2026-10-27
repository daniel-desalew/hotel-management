import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { notificationApi } from "../../api/notificationApi";
import useSocketStore from "../../store/socketStore";

export default function Notifications() {
  const queryClient = useQueryClient();
  const markReadInStore = useSocketStore((state) => state.markRead);
  const markAllReadInStore = useSocketStore((state) => state.markAllRead);
  const clearInStore = useSocketStore((state) => state.clearNotifications);
  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.getAll({ page: 1, limit: 50 }),
  });
  const notifications = data?.data?.notifications || [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const markRead = useMutation({
    mutationFn: markReadInStore,
    onSuccess: refresh,
    onError: (requestError) => toast.error(requestError?.message || "Could not update notification"),
  });
  const markAllRead = useMutation({
    mutationFn: markAllReadInStore,
    onSuccess: refresh,
    onError: (requestError) => toast.error(requestError?.message || "Could not update notifications"),
  });
  const clearAll = useMutation({
    mutationFn: clearInStore,
    onSuccess: () => {
      toast.success("Notifications cleared");
      refresh();
    },
    onError: (requestError) => toast.error(requestError?.message || "Could not clear notifications"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-gray-500">Live alerts and recent activity for your account</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => markAllRead.mutate()} disabled={!notifications.some((item) => !item.isRead) || markAllRead.isPending}>
            Mark all read
          </button>
          <button className="btn-secondary text-red-600" onClick={() => clearAll.mutate()} disabled={!notifications.length || clearAll.isPending}>
            Clear all
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not load notifications: {error.message}</div>}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="px-4 py-10 text-center text-gray-400">Loading notifications…</div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-400">No notifications yet. New activity will appear here.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <li key={notification._id} className={`flex items-start justify-between gap-4 p-4 ${notification.isRead ? "bg-white" : "bg-blue-50/50"}`}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-gray-900">{notification.title}</h2>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{notification.type.replace(/_/g, " ")}</span>
                    {!notification.isRead && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">New</span>}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                  <p className="mt-2 text-xs text-gray-400">{notification.priority} · {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ""}</p>
                </div>
                {!notification.isRead && (
                  <button className="btn-secondary shrink-0 text-xs" onClick={() => markRead.mutate(notification._id)} disabled={markRead.isPending}>Mark read</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
