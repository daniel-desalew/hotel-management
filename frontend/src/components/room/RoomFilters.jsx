export default function RoomFilters({ filters, onChange, roomTypes = [] }) {
  const update = (key, value) =>
    onChange({ ...filters, [key]: value || undefined, page: 1 });

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="label">Status</label>
        <select
          className="input w-40"
          value={filters.status || ""}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="">All</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
          <option value="cleaning">Cleaning</option>
          <option value="maintenance">Maintenance</option>
          <option value="out_of_order">Out of order</option>
        </select>
      </div>

      <div>
        <label className="label">Room Type</label>
        <select
          className="input w-48"
          value={filters.roomTypeId || ""}
          onChange={(e) => update("roomTypeId", e.target.value)}
        >
          <option value="">All types</option>
          {roomTypes.map((rt) => (
            <option key={rt._id} value={rt._id}>
              {rt.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Floor</label>
        <input
          type="number"
          className="input w-24"
          placeholder="Any"
          value={filters.floor || ""}
          onChange={(e) => update("floor", e.target.value)}
        />
      </div>
    </div>
  );
}
