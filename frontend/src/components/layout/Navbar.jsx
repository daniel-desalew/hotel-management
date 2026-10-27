import { FiMenu, FiBell } from "react-icons/fi";
import useSocketStore from "../../store/socketStore";
import NotificationsDrawer from "./NotificationsDrawer";

export default function Navbar({ onToggleSidebar }) {
  const connected = useSocketStore((s) => s.connected);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <FiMenu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              connected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                connected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            {connected ? "Live" : "Offline"}
          </div>
          <NotificationsDrawer />
        </div>
      </div>
    </header>
  );
}
