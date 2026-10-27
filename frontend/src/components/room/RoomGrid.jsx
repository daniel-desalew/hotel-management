import RoomStatusBadge from "./RoomStatusBadge";

export default function RoomGrid({ rooms = [], onSelect }) {
  const getBg = (status) => {
    switch (status) {
      case "available":
        return "bg-green-50 border-green-200 hover:bg-green-100";
      case "occupied":
        return "bg-blue-50 border-blue-200 hover:bg-blue-100";
      case "reserved":
        return "bg-yellow-50 border-yellow-200 hover:bg-yellow-100";
      case "cleaning":
        return "bg-orange-50 border-orange-200 hover:bg-orange-100";
      case "maintenance":
        return "bg-purple-50 border-purple-200 hover:bg-purple-100";
      case "out_of_order":
        return "bg-red-50 border-red-200 hover:bg-red-100";
      default:
        return "bg-gray-50 border-gray-200 hover:bg-gray-100";
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {rooms.map((room) => (
        <button
          key={room._id}
          onClick={() => onSelect?.(room)}
          className={`p-4 rounded-xl border-2 text-left transition-colors ${getBg(room.status)}`}
        >
          <div className="text-2xl font-bold">{room.roomNumber}</div>
          <div className="text-xs text-gray-600 mt-1">Floor {room.floor}</div>
          <div className="mt-2">
            <RoomStatusBadge status={room.status} />
          </div>
        </button>
      ))}
    </div>
  );
}
