// frontend/src/components/rooms/AddRoomModal.jsx
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiX, FiSave } from "react-icons/fi";
import { roomApi } from "../../api/roomApi";

export default function AddRoomModal({ open, onClose, hotelId }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    roomNumber: "",
    floor: 1,
    roomTypeId: "",
    status: "available",
    housekeepingStatus: "clean",
    notes: "",
  });

  const { data: roomTypesData } = useQuery({
    queryKey: ["roomTypes"],
    queryFn: () => roomApi.typesList({}),
    enabled: open,
  });

  const roomTypes = roomTypesData?.data || [];

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setForm({
        roomNumber: "",
        floor: 1,
        roomTypeId: "",
        status: "available",
        housekeepingStatus: "clean",
        notes: "",
      });
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: (data) => roomApi.create(data),
    onSuccess: () => {
      toast.success("Room created");
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    },
    onError: (err) => toast.error(err?.message || "Failed to create room"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.roomNumber) return toast.error("Room number required");
    if (!form.roomTypeId) return toast.error("Select room type");
    if (!hotelId) return toast.error("No hotel linked to your account");

    createMutation.mutate({
      hotelId,
      roomNumber: form.roomNumber,
      floor: Number(form.floor),
      roomTypeId: form.roomTypeId,
      status: form.status,
      housekeepingStatus: form.housekeepingStatus,
      notes: form.notes,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Add Room</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Room Number *</label>
              <input
                type="text"
                value={form.roomNumber}
                onChange={(e) =>
                  setForm({ ...form, roomNumber: e.target.value })
                }
                className="input"
                placeholder="101"
                required
              />
            </div>
            <div>
              <label className="label">Floor *</label>
              <input
                type="number"
                min="0"
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Room Type *</label>
            <select
              value={form.roomTypeId}
              onChange={(e) => setForm({ ...form, roomTypeId: e.target.value })}
              className="input"
              required
            >
              <option value="">Select room type</option>
              {roomTypes.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} (${t.basePrice}/night)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Room Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input"
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_order">Out of Order</option>
              </select>
            </div>
            <div>
              <label className="label">Housekeeping</label>
              <select
                value={form.housekeepingStatus}
                onChange={(e) =>
                  setForm({ ...form, housekeepingStatus: e.target.value })
                }
                className="input"
              >
                <option value="clean">Clean</option>
                <option value="dirty">Dirty</option>
                <option value="inspected">Inspected</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input min-h-[70px] resize-y"
              placeholder="Any notes about this room..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex-shrink-0 flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={createMutation.isPending}
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
            {createMutation.isPending ? "Creating..." : "Create Room"}
          </button>
        </div>
      </div>
    </div>
  );
}
