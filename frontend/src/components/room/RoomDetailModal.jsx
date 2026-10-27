// frontend/src/components/rooms/RoomDetailModal.jsx
import { useEffect } from "react";
import {
  FiX,
  FiEdit2,
  FiHome,
  FiLayers,
  FiCheckCircle,
  FiDollarSign,
  FiInfo,
} from "react-icons/fi";

const STATUS_COLORS = {
  available: "bg-green-100 text-green-800 border-green-200",
  occupied: "bg-blue-100 text-blue-800 border-blue-200",
  cleaning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  maintenance: "bg-red-100 text-red-800 border-red-200",
  out_of_order: "bg-red-100 text-red-800 border-red-200",
  reserved: "bg-purple-100 text-purple-800 border-purple-200",
};

const HK_COLORS = {
  clean: "bg-green-50 text-green-700",
  dirty: "bg-red-50 text-red-700",
  inspected: "bg-blue-50 text-blue-700",
  in_progress: "bg-yellow-50 text-yellow-700",
};

export default function RoomDetailModal({ room, open, onClose, onEdit }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !room) return null;

  const statusColor =
    STATUS_COLORS[room.status] || "bg-gray-100 text-gray-800 border-gray-200";
  const hkColor =
    HK_COLORS[room.housekeepingStatus] || "bg-gray-50 text-gray-700";

  const image =
    room.roomTypeId?.code === "DLX"
      ? "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800"
      : room.roomTypeId?.code === "STE"
        ? "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"
        : "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="relative h-56 bg-gray-100 flex-shrink-0">
          <img
            src={image}
            alt={`Room ${room.roomNumber}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src =
                "https://via.placeholder.com/800x400/e5e7eb/9ca3af?text=Room";
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg"
          >
            <FiX className="w-5 h-5 text-gray-700" />
          </button>
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl px-4 py-2 shadow-lg">
            <div className="text-2xl font-bold text-gray-900">
              Room {room.roomNumber}
            </div>
            <div className="text-xs text-gray-500">Floor {room.floor}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border capitalize ${statusColor}`}
            >
              <FiCheckCircle className="w-3.5 h-3.5" />
              {room.status.replace(/_/g, " ")}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium capitalize ${hkColor}`}
            >
              🧹 {room.housekeepingStatus?.replace(/_/g, " ")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                <FiHome className="w-4 h-4" /> Room Type
              </div>
              <p className="mt-1.5 font-semibold text-gray-900">
                {room.roomTypeId?.name || "—"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Code: {room.roomTypeId?.code || "—"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                <FiDollarSign className="w-4 h-4" /> Base Price
              </div>
              <p className="mt-1.5 font-semibold text-gray-900">
                ${room.roomTypeId?.basePrice || 0}
                <span className="text-xs text-gray-500 font-normal">
                  /night
                </span>
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                <FiLayers className="w-4 h-4" /> Max Occupancy
              </div>
              <p className="mt-1.5 font-semibold text-gray-900">
                {room.roomTypeId?.maxOccupancy || 0} guests
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                <FiInfo className="w-4 h-4" /> Active
              </div>
              <p className="mt-1.5 font-semibold text-gray-900">
                {room.isActive ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="btn-secondary flex-1">
            Close
          </button>
          <button onClick={() => onEdit(room)} className="btn-primary flex-1">
            <FiEdit2 className="w-4 h-4" /> Edit Room
          </button>
        </div>
      </div>
    </div>
  );
}
