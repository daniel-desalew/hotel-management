import dayjs from "dayjs";

export default function BookingCalendar({ bookings = [], month, year }) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  const isBooked = (date) => {
    const target = dayjs(date).startOf("day");

    return bookings.some((booking) => {
      const start = dayjs(booking.checkIn).startOf("day");
      const end = dayjs(booking.checkOut).startOf("day");

      return target.isSameOrAfter(start) && target.isBefore(end);
    });
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const bookedDays = cells.reduce((count, item) => {
    if (item && isBooked(new Date(year, month - 1, item))) {
      return count + 1;
    }
    return count;
  }, 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold">
          {dayjs(`${year}-${month}-01`).format("MMMM YYYY")}
        </h3>
        <span className="text-sm text-gray-500">{bookedDays} booked days</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => (
          <div
            key={i}
            className={`aspect-square flex items-center justify-center rounded-lg text-sm ${
              d
                ? isBooked(new Date(year, month - 1, d))
                  ? "bg-red-100 text-red-700 font-medium"
                  : "bg-green-50 text-gray-700 hover:bg-green-100"
                : "bg-transparent"
            }`}
            title={
              d
                ? isBooked(new Date(year, month - 1, d))
                  ? "Booked"
                  : "Available"
                : ""
            }
          >
            {d || ""}
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-200" /> Available
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-300" /> Booked
        </div>
      </div>
    </div>
  );
}
