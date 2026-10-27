// frontend/src/pages/bookings/NewBooking.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiSave, FiArrowLeft } from "react-icons/fi";
import { bookingApi } from "../../api/bookingApi";
import { roomApi } from "../../api/roomApi";
import { guestApi } from "../../api/guestApi";

export default function NewBooking() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [hotels, setHotels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState({
    hotels: true,
    roomTypes: true,
    guests: true,
  });

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
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/v1/hotels");
        const data = await res.json();
        const list = data?.data?.hotels || [];
        setHotels(list);
        if (list.length > 0) {
          setForm((f) => ({ ...f, hotelId: list[0]._id }));
        }
      } catch (err) {
        console.error("Hotels load failed:", err);
        toast.error("Failed to load hotels");
      } finally {
        setLoading((l) => ({ ...l, hotels: false }));
      }
    };
    load();
  }, []);

  // ─── Load room types ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await roomApi.getRoomTypes({});
        const list = res?.data || [];
        setRoomTypes(list);
        console.log("✅ Room types loaded:", list.length);
      } catch (err) {
        console.error("Room types load failed:", err);
        toast.error("Failed to load room types");
      } finally {
        setLoading((l) => ({ ...l, roomTypes: false }));
      }
    };
    load();
  }, []);

  // ─── Load guests ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await guestApi.list({ limit: 100 });
        const list = res?.data?.guests || [];
        setGuests(list);
      } catch (err) {
        console.error("Guests load failed:", err);
      } finally {
        setLoading((l) => ({ ...l, guests: false }));
      }
    };
    load();
  }, []);

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
      console.error("Booking error:", err);
      const msg =
        err?.message || err?.errors?.[0]?.message || "Failed to create booking";
      toast.error(msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!form.hotelId) return toast.error("Please select a hotel");
    if (!form.guestId) return toast.error("Please select a guest");
    if (!form.roomTypeId) return toast.error("Please select a room type");
    if (!form.checkIn) return toast.error("Please pick a check-in date");
    if (!form.checkOut) return toast.error("Please pick a check-out date");

    const checkIn = new Date(form.checkIn);
    const checkOut = new Date(form.checkOut);
    if (checkOut <= checkIn) {
      return toast.error("Check-out must be after check-in");
    }

    createMutation.mutate({
      hotelId: form.hotelId,
      guestId: form.guestId,
      roomTypeId: form.roomTypeId,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      adults: Number(form.adults) || 2,
      children: Number(form.children) || 0,
      source: form.source || "direct",
      specialRequests: form.specialRequests || "",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <FiArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          New Booking
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a reservation for a guest
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-5"
      >
        {/* Hotel */}
        <div>
          <label className="label">Hotel *</label>
          <select
            value={form.hotelId}
            onChange={(e) => setForm({ ...form, hotelId: e.target.value })}
            className="input"
            disabled={loading.hotels}
          >
            <option value="">
              {loading.hotels ? "Loading..." : "Select hotel"}
            </option>
            {hotels.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* Guest */}
        <div>
          <label className="label">Guest *</label>
          <select
            value={form.guestId}
            onChange={(e) => setForm({ ...form, guestId: e.target.value })}
            className="input"
            disabled={loading.guests}
          >
            <option value="">
              {loading.guests ? "Loading..." : "Select guest"}
            </option>
            {guests.map((g) => (
              <option key={g._id} value={g._id}>
                {g.firstName} {g.lastName} — {g.phone}
              </option>
            ))}
          </select>
        </div>

        {/* Room Type */}
        <div>
          <label className="label">Room Type *</label>
          <select
            value={form.roomTypeId}
            onChange={(e) => setForm({ ...form, roomTypeId: e.target.value })}
            className="input"
            disabled={loading.roomTypes}
          >
            <option value="">
              {loading.roomTypes
                ? "Loading..."
                : roomTypes.length === 0
                  ? "No room types available"
                  : "Select room type"}
            </option>
            {roomTypes.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} — ${t.basePrice}/night (max {t.maxOccupancy})
              </option>
            ))}
          </select>
        </div>

        {/* Adults / Children */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Adults *</label>
            <input
              type="number"
              min="1"
              max="20"
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
            <label className="label">Check-in *</label>
            <input
              type="date"
              value={form.checkIn}
              onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
              className="input"
            />
          </div>
          <div>
            <label className="label">Check-out *</label>
            <input
              type="date"
              value={form.checkOut}
              onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
              min={form.checkIn || new Date().toISOString().split("T")[0]}
              className="input"
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
            className="input min-h-[80px] resize-y"
            placeholder="Any special requests from the guest..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
            disabled={createMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={
              createMutation.isPending || loading.roomTypes || loading.guests
            }
          >
            <FiSave className="w-4 h-4" />
            {createMutation.isPending ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
