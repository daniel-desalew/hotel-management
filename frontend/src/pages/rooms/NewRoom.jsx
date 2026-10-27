import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { hotelApi } from "../../api/hotelApi";
import { roomApi } from "../../api/roomApi";
import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  hotelId: "",
  roomTypeId: "",
  roomNumber: "",
  floor: "",
  status: "available",
  housekeepingStatus: "clean",
  features: "",
  notes: "",
};

export default function NewRoom() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hotels, setHotels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [form, setForm] = useState({
    ...emptyForm,
    hotelId: user?.hotelId || "",
  });
  const [saving, setSaving] = useState(false);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);

  useEffect(() => {
    const loadHotels = async () => {
      try {
        const res = await hotelApi.getAll({ limit: 100 });
        const hotelList = res?.data?.hotels || [];
        setHotels(hotelList);

        const initialHotelId = user?.hotelId || hotelList[0]?._id || "";
        if (initialHotelId) {
          setForm((prev) => ({ ...prev, hotelId: initialHotelId }));
        }
      } catch (err) {
        toast.error(err?.message || "Failed to load hotels");
      }
    };

    loadHotels();
  }, [user?.hotelId]);

  useEffect(() => {
    const loadRoomTypes = async () => {
      if (!form.hotelId) {
        setRoomTypes([]);
        return;
      }

      try {
        setLoadingRoomTypes(true);
        const res = await roomApi.getRoomTypes({ hotelId: form.hotelId });
        const types = res?.data || [];
        setRoomTypes(types);

        if (!types.some((rt) => rt._id === form.roomTypeId)) {
          setForm((prev) => ({ ...prev, roomTypeId: types[0]?._id || "" }));
        }
      } catch (err) {
        console.error(err);
        setRoomTypes([]);
      } finally {
        setLoadingRoomTypes(false);
      }
    };

    loadRoomTypes();
  }, [form.hotelId]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.hotelId || !form.roomTypeId || !form.roomNumber || !form.floor) {
      toast.error("Hotel, room type, room number, and floor are required");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        floor: Number(form.floor),
        roomNumber: String(form.roomNumber).trim(),
        features: form.features
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      await roomApi.create(payload);
      toast.success("Room created");
      navigate("/rooms");
    } catch (err) {
      toast.error(err?.message || "Failed to create room");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Room</h1>
        <p className="text-sm text-gray-500">Create a new room for a hotel</p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Hotel</label>
            <select
              className="input"
              value={form.hotelId}
              onChange={(e) => updateField("hotelId", e.target.value)}
            >
              <option value="">Select hotel</option>
              {hotels.map((hotel) => (
                <option key={hotel._id} value={hotel._id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Room Type</label>
            <select
              className="input"
              value={form.roomTypeId}
              onChange={(e) => updateField("roomTypeId", e.target.value)}
              disabled={!form.hotelId || loadingRoomTypes}
            >
              <option value="">
                {loadingRoomTypes
                  ? "Loading room types..."
                  : "Select room type"}
              </option>
              {roomTypes.map((rt) => (
                <option key={rt._id} value={rt._id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Room Number</label>
            <input
              className="input"
              value={form.roomNumber}
              onChange={(e) => updateField("roomNumber", e.target.value)}
              placeholder="101"
            />
          </div>

          <div>
            <label className="label">Floor</label>
            <input
              type="number"
              className="input"
              value={form.floor}
              onChange={(e) => updateField("floor", e.target.value)}
              placeholder="1"
            />
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="cleaning">Cleaning</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_order">Out of order</option>
            </select>
          </div>

          <div>
            <label className="label">Housekeeping</label>
            <select
              className="input"
              value={form.housekeepingStatus}
              onChange={(e) =>
                updateField("housekeepingStatus", e.target.value)
              }
            >
              <option value="clean">Clean</option>
              <option value="dirty">Dirty</option>
              <option value="inspected">Inspected</option>
              <option value="in_progress">In progress</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Features</label>
          <input
            className="input"
            value={form.features}
            onChange={(e) => updateField("features", e.target.value)}
            placeholder="balcony, sea_view, minibar"
          />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            className="input"
            rows="3"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Optional notes"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="btn-outline"
            onClick={() => navigate("/rooms")}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Create Room"}
          </button>
        </div>
      </form>
    </div>
  );
}
