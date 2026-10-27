// frontend/src/components/maintenance/MaintenanceDetailModal.jsx
import { useEffect } from "react";
import {
  FiX,
  FiTool,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiMapPin,
} from "react-icons/fi";

const STATUS_STYLES = {
  open: "bg-red-100 text-red-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const PRIORITY_STYLES = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function MaintenanceDetailModal({
  ticket,
  open,
  onClose,
  onResolve,
  onEdit,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !ticket) return null;

  const statusStyle = STATUS_STYLES[ticket.status] || STATUS_STYLES.open;
  const priorityStyle =
    PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.medium;
  const canResolve = ["open", "in_progress"].includes(ticket.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition"
          >
            <FiX className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <FiTool className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-white/70 font-semibold">
                {ticket.ticketNumber || "MAINTENANCE TICKET"}
              </p>
              <h2 className="text-xl font-bold mt-1">
                {ticket.title || "Maintenance Request"}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${statusStyle}`}
                >
                  {ticket.status?.replace(/_/g, " ")}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${priorityStyle}`}
                >
                  {ticket.priority} priority
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Location + Type */}
          <div className="grid grid-cols-2 gap-3">
            {ticket.roomId && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                  <FiMapPin className="w-3.5 h-3.5" /> Location
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  Room {ticket.roomId.roomNumber || "—"}
                </p>
              </div>
            )}

            {ticket.category && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                  <FiTool className="w-3.5 h-3.5" /> Category
                </div>
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {ticket.category.replace(/_/g, " ")}
                </p>
              </div>
            )}

            {ticket.reportedAt && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                  <FiCalendar className="w-3.5 h-3.5" /> Reported
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(ticket.reportedAt).toLocaleDateString()}
                </p>
              </div>
            )}

            {ticket.estimatedCost && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                  <FiDollarSign className="w-3.5 h-3.5" /> Cost
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  ${ticket.estimatedCost}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {ticket.description && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Description
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3 whitespace-pre-line">
                {ticket.description}
              </p>
            </div>
          )}

          {/* Assigned staff */}
          {ticket.assignedTo && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Assigned To
              </h3>
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                  {ticket.assignedTo.firstName?.[0]}
                  {ticket.assignedTo.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {ticket.assignedTo.role?.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Resolution notes */}
          {ticket.resolutionNotes && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Resolution Notes
              </h3>
              <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  {ticket.resolutionNotes}
                </p>
                {ticket.resolvedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Resolved on{" "}
                    {new Date(ticket.resolvedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="btn-secondary flex-1">
            Close
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(ticket)}
              className="btn-secondary flex-1"
            >
              Edit
            </button>
          )}
          {canResolve && onResolve && (
            <button
              onClick={() => onResolve(ticket)}
              className="btn-success flex-1 justify-center"
            >
              <FiCheckCircle className="w-4 h-4" /> Mark Resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
