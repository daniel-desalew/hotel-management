// frontend/src/pages/rooms/RoomList.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiEye, FiEdit2, FiPlus, FiSearch } from "react-icons/fi";
import { roomApi } from "../../api/roomApi";
import RoomDetailModal from "../../components/rooms/RoomDetailModal";
import EditRoomModal from "../../components/rooms/EditRoomModal";
import AddRoomModal from "../../components/rooms/AddRoomModal";
import useAuthStore from "../../store/authStore";

export default function RoomList() {
  const user = useAuthStore((s) => s.user);

  const [status, setStatus] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [floor, setFloor] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  const [viewRoom, setViewRoom] = useState(null);
  const [editRoom, setEditRoom] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  // ─── Fetch rooms ────────────────────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey: ["rooms", { status, roomTypeId, floor, page }],
    queryFn: () =>
      roomApi.list({
        status: status || undefined,
        roomTypeId: roomTypeId || undefined,
        floor: floor || undefined,
        page,
        limit,
      }),
  });

  // ─── Fetch room types ───────────────────────────────────────
  const { data: roomTypesData } = useQuery({
    queryKey: ["roomTypes"],
    queryFn: () => roomApi.typesList({}),
  });

  const rooms = data?.data?.rooms || [];
  const pagination = data?.data?.pagination || {};
  const roomTypes = roomTypesData?.data || [];

  // ─── Client-side search ─────────────────────────────────────
  const filtered = search
    ? rooms.filter((r) =>
        (r.roomNumber || "").toLowerCase().includes(search.toLowerCase()),
      )
    : rooms;

  // ─── Status color helper ────────────────────────────────────
  const statusBadge = (s) => {
    switch (s) {
      case "available":
        return "bg-green-100 text-green-800";
      case "occupied":
        return "bg-blue-100 text-blue-800";
      case "cleaning":
        return "bg-yellow-100 text-yellow-800";
      case "maintenance":
      case "out_of_order":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // ─── Image helper (falls back by room type) ─────────────────
  const getImage = (room) => {
    if (room.roomTypeId?.code === "DLX")
      return "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600";
    if (room.roomTypeId?.code === "STE")
      return "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600";
    return "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Rooms
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading
              ? "Loading..."
              : `${pagination.total || rooms.length} rooms total`}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <FiPlus className="w-4 h-4" /> Add Room
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search room number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="input py-2 text-sm min-w-[140px]"
        >
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="cleaning">Cleaning</option>
          <option value="maintenance">Maintenance</option>
          <option value="out_of_order">Out of Order</option>
        </select>

        <select
          value={roomTypeId}
          onChange={(e) => {
            setRoomTypeId(e.target.value);
            setPage(1);
          }}
          className="input py-2 text-sm min-w-[140px]"
        >
          <option value="">All types</option>
          {roomTypes.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Floor"
          value={floor}
          onChange={(e) => {
            setFloor(e.target.value);
            setPage(1);
          }}
          className="input py-2 text-sm w-24"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Failed to load rooms: {error.message || "Unknown error"}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton rounded-xl h-64" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-5xl mb-3">🚪</div>
          <p className="text-gray-500 font-medium">No rooms found</p>
          <p className="text-xs text-gray-400 mt-1">
            Try clearing filters or add a new room
          </p>
        </div>
      )}

      {/* Room grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((room) => (
            <div
              key={room._id}
              className="rounded-xl border-2 border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Image */}
              <div className="h-40 bg-gray-100 overflow-hidden">
                <img
                  src={getImage(room)}
                  alt={`Room ${room.roomNumber}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/400x300/e5e7eb/9ca3af?text=Room";
                  }}
                />
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xl font-bold text-gray-900">
                      Room {room.roomNumber}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      Floor {room.floor} · {room.roomTypeId?.name || "Standard"}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full capitalize whitespace-nowrap ${statusBadge(
                      room.status,
                    )}`}
                  >
                    {room.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Price</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${room.roomTypeId?.basePrice || 0}/night
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setViewRoom(room)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 font-medium transition-colors"
                  >
                    <FiEye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    onClick={() => setEditRoom(room)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600 px-4">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="btn-secondary"
          >
            Next →
          </button>
        </div>
      )}

      {/* Modals */}
      <RoomDetailModal
        room={viewRoom}
        open={!!viewRoom}
        onClose={() => setViewRoom(null)}
        onEdit={(r) => {
          setViewRoom(null);
          setEditRoom(r);
        }}
      />
      <EditRoomModal
        room={editRoom}
        open={!!editRoom}
        onClose={() => setEditRoom(null)}
      />
      <AddRoomModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        hotelId={user?.hotelId}
      />
    </div>
  );
}
