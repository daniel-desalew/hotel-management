import Badge from "../common/Badge";
import dayjs from "dayjs";

const statusColors = {
  pending: "yellow",
  confirmed: "blue",
  checked_in: "green",
  checked_out: "gray",
  cancelled: "red",
  no_show: "red",
};

export default function BookingCard({ booking, onClick }) {
  const guest = booking.guestId || {};
  const room = booking.rooms?.[0] || {};

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold">{booking.bookingNumber}</p>
          <p className="text-sm text-gray-500">
            {guest.firstName} {guest.lastName}
          </p>
        </div>
        <Badge color={statusColors[booking.status] || "gray"}>
          {booking.status?.replace("_", " ")}
        </Badge>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        <p>
          <span className="font-medium">Room:</span>{" "}
          {room.roomId?.roomNumber || "—"}
        </p>
        <p>
          <span className="font-medium">Check-in:</span>{" "}
          {dayjs(booking.checkIn).format("MMM D, YYYY")}
        </p>
        <p>
          <span className="font-medium">Check-out:</span>{" "}
          {dayjs(booking.checkOut).format("MMM D, YYYY")}
        </p>
        <p>
          <span className="font-medium">Nights:</span> {booking.nights}
        </p>
      </div>

      <div className="mt-3 pt-3 border-t flex justify-between items-center">
        <span className="text-sm text-gray-500">{booking.nights} nights</span>
        <span className="font-semibold text-primary-600">
          ${booking.pricing?.totalAmount?.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
