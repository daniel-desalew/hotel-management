// frontend/src/components/booking/AddBookingModal.jsx
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiX, FiSave } from "react-icons/fi";
import { bookingApi } from "../../api/bookingApi";
import { guestApi } from "../../api/guestApi";
import { roomApi } from "../../api/roomApi";

export default function AddBookingModal({ open, onClose, hotelId }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    guestId: "",
    roomTypeId: "",
    checkIn: "",
    checkOut: "",
    adults: 2,
    children: 0,
    source: "direct",
    specialRequests: "",
  });

  const { data: guestsData } = useQuery({
    queryKey: ["guests-for-booking"],
    queryFn: () => guestApi.list({ limit: 100 }),
    enabled: open,
  });

  const { data: roomTypesData } = useQuery({
    queryKey: ["roomTypes-for-booking"],
    queryFn: () => roomApi.getRoomTypes({}),
    enabled: open,
  });

  const guests = guestsData?.data?.guests || [];
  const roomTypes = roomTypesData?.data || [];

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setForm({
        guestId: "",
        roomTypeId: "",
        checkIn: "",
        checkOut: "",
        adults: 2,
        children: 0,
        source: "direct",
        specialRequests: "",
      });
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: (data) => bookingApi.create({ ...data, hotelId }),
    onSuccess: (res) => {
      toast.success(`Booking created: ${res.data.bookingNumber}`);
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    },
    onError: (err) => {
      const msg =
        err?.message || err?.errors?.[0]?.message || "Failed to create booking";
      toast.error(msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.guestId) return toast.error("Select a guest");
    if (!form.roomTypeId) return toast.error("Select a room type");
    if (!form.checkIn) return toast.error("Pick check-in");
    if (!form.checkOut) return toast.error("Pick check-out");
    if (new Date(form.checkOut) <= new Date(form.checkIn)) {
      return toast.error("Check-out must be after check-in");
    }
    createMutation.mutate({
      ...form,
      adults: Number(form.adults) || 1,
      children: Number(form.children) || 0,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">New Booking</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          <div>
            <label className="label">Guest *</label>
            <select
              value={form.guestId}
              onChange={(e) => setForm({ ...form, guestId: e.target.value })}
              className="input"
            >
              <option value="">Select guest</option>
              {guests.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.firstName} {g.lastName} — {g.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Room Type *</label>
            <select
              value={form.roomTypeId}
              onChange={(e) => setForm({ ...form, roomTypeId: e.target.value })}
              className="input"
            >
              <option value="">Select room type</option>
              {roomTypes.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} — ${t.basePrice}/night
                </option>
              ))}
            </select>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Check-in *</label>
              <input
                type="date"
                value={form.checkIn}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Check-out *</label>
              <input
                type="date"
                value={form.checkOut}
                min={form.checkIn || new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Source</label>
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
            </select>
          </div>

          <div>
            <label className="label">Special Requests</label>
            <textarea
              value={form.specialRequests}
              onChange={(e) =>
                setForm({ ...form, specialRequests: e.target.value })
              }
              className="input min-h-[70px]"
              placeholder="Optional..."
            />
          </div>
        </form>

        <div className="flex-shrink-0 flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn-primary flex-1"
            disabled={createMutation.isPending}
          >
            <FiSave className="w-4 h-4" />
            {createMutation.isPending ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
