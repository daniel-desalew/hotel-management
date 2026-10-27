// frontend/src/components/booking/BookingForm.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiSave, FiSearch } from "react-icons/fi";
import { bookingApi } from "../../api/bookingApi";
import { roomApi } from "../../api/roomApi";
import { guestApi } from "../../api/guestApi";
import { dashboardApi } from "../../api/dashboardApi";

export default function BookingForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    hotelId: "",
    guestId: "",
    roomTypeId: "",
    checkIn: "",
    checkOut: "",
    adults: 2,
    children: 0,
    source: "direct",
    specialRequests: "",
  });

  // ─── Load hotels ──────────────────────────────────────────
  const { data: hotelsData } = useQuery({
    queryKey: ["hotels"],
    queryFn: async () => {
      // Use dashboardApi to hit the dashboard route which resolves hotelId
      const res = await fetch("http://localhost:5000/api/v1/hotels");
      return res.json();
    },
  });

  // ─── Load room types (no hotelId filter) ─────────────────
  const {
    data: roomTypesData,
    isLoading: loadingTypes,
    error: typesError,
  } = useQuery({
    queryKey: ["roomTypes"],
    queryFn: () => roomApi.typesList({}),
  });

  // ─── Load guests ─────────────────────────────────────────
  const { data: guestsData } = useQuery({
    queryKey: ["guests"],
    queryFn: () => guestApi.list({ limit: 100 }),
  });

  const hotels = hotelsData?.data?.hotels || [];
  const roomTypes = roomTypesData?.data || [];
  const guests = guestsData?.data?.guests || [];

  // ─── Auto-select first hotel ─────────────────────────────
  if (!form.hotelId && hotels.length > 0) {
    setForm((f) => ({ ...f, hotelId: hotels[0]._id }));
  }

  // ─── Create booking ───────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => bookingApi.create(data),
    onSuccess: (res) => {
      toast.success(`Booking created: ${res.data.bookingNumber}`);
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
      navigate("/bookings");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to create booking");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.hotelId) return toast.error("Select a hotel");
    if (!form.guestId) return toast.error("Select a guest");
    if (!form.roomTypeId) return toast.error("Select a room type");
    if (!form.checkIn) return toast.error("Pick a check-in date");
    if (!form.checkOut) return toast.error("Pick a check-out date");

    createMutation.mutate({
      ...form,
      adults: Number(form.adults),
      children: Number(form.children),
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Create Booking
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details to create a new reservation
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-5"
      >
        {/* Hotel */}
        <div>
          <label className="label">Hotel</label>
          <select
            value={form.hotelId}
            onChange={(e) => setForm({ ...form, hotelId: e.target.value })}
            className="input"
            required
          >
            <option value="">Select hotel</option>
            {hotels.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* Guest */}
        <div>
          <label className="label">Guest</label>
          <select
            value={form.guestId}
            onChange={(e) => setForm({ ...form, guestId: e.target.value })}
            className="input"
            required
          >
            <option value="">Select guest</option>
            {guests.map((g) => (
              <option key={g._id} value={g._id}>
                {g.firstName} {g.lastName} ({g.phone})
              </option>
            ))}
          </select>
        </div>

        {/* Room Type */}
        <div>
          <label className="label">Room Type</label>
          {loadingTypes ? (
            <div className="input flex items-center text-gray-400">
              Loading room types...
            </div>
          ) : typesError ? (
            <div className="input border-red-300 text-red-600">
              Failed to load room types
            </div>
          ) : roomTypes.length === 0 ? (
            <div className="input border-red-300 text-red-600">
              No room types available
            </div>
          ) : (
            <select
              value={form.roomTypeId}
              onChange={(e) => setForm({ ...form, roomTypeId: e.target.value })}
              className="input"
              required
            >
              <option value="">Select room type</option>
              {roomTypes.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} — ${t.basePrice}/night (max {t.maxOccupancy})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Adults / Children */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Adults</label>
            <input
              type="number"
              min="1"
              max="10"
              value={form.adults}
              onChange={(e) => setForm({ ...form, adults: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Children</label>
            <input
              type="number"
              min="0"
              max="10"
              value={form.children}
              onChange={(e) => setForm({ ...form, children: e.target.value })}
              className="input"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Check-in</label>
            <input
              type="date"
              value={form.checkIn}
              onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Check-out</label>
            <input
              type="date"
              value={form.checkOut}
              onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
              className="input"
              required
            />
          </div>
        </div>

        {/* Source */}
        <div>
          <label className="label">Booking Source</label>
          <select
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            className="input"
          >
            <option value="direct">Direct</option>
            <option value="website">Website</option>
            <option value="phone">Phone</option>
            <option value="walk_in">Walk In</option>
            <option value="booking_com">Booking.com</option>
            <option value="expedia">Expedia</option>
            <option value="airbnb">Airbnb</option>
            <option value="agent">Travel Agent</option>
          </select>
        </div>

        {/* Special Requests */}
        <div>
          <label className="label">Special Requests (optional)</label>
          <textarea
            value={form.specialRequests}
            onChange={(e) =>
              setForm({ ...form, specialRequests: e.target.value })
            }
            className="input min-h-[80px]"
            placeholder="Any special requests from the guest..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary flex-1"
          >
            <FiSave className="w-4 h-4" />
            {createMutation.isPending ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
