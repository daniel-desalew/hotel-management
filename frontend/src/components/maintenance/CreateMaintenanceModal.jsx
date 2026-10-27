// frontend/src/components/maintenance/CreateMaintenanceModal.jsx
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiX, FiSave, FiTool } from "react-icons/fi";
import { maintenanceApi } from "../../api/maintenanceApi";
import { roomApi } from "../../api/roomApi";

const CATEGORIES = [
  "plumbing",
  "electrical",
  "hvac",
  "furniture",
  "appliance",
  "network",
  "cleaning",
  "pest_control",
  "other",
];

const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function CreateMaintenanceModal({ open, onClose, hotelId }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other",
    priority: "medium",
    roomId: "",
    estimatedCost: "",
  });

  const { data: roomsData } = useQuery({
    queryKey: ["rooms-for-maintenance"],
    queryFn: () => roomApi.list({ limit: 100 }),
    enabled: open,
  });

  const rooms = roomsData?.data?.rooms || [];

  useEffect(() => {
    if (open) {
      setForm({
        title: "",
        description: "",
        category: "other",
        priority: "medium",
        roomId: "",
        estimatedCost: "",
      });
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const createMutation = useMutation({
    mutationFn: (data) => maintenanceApi.create(data),
    onSuccess: () => {
      toast.success("Maintenance ticket created");
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      onClose();
    },
    onError: (err) => toast.error(err?.message || "Failed to create ticket"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.description.trim()) return toast.error("Description is required");
    if (!hotelId) return toast.error("No hotel linked to your account");

    createMutation.mutate({
      hotelId,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      priority: form.priority,
      roomId: form.roomId || undefined,
      estimatedCost: form.estimatedCost
        ? Number(form.estimatedCost)
        : undefined,
      status: "open",
      reportedAt: new Date().toISOString(),
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <FiTool className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              New Maintenance Ticket
            </h2>
          </div>
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
            <label className="label">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="e.g., Leaking faucet in bathroom"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="input min-h-[100px] resize-y"
              placeholder="Describe the issue in detail..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input capitalize"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="input capitalize"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} className="capitalize">
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Room (optional)</label>
              <select
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                className="input"
              >
                <option value="">Not room-specific</option>
                {rooms.map((r) => (
                  <option key={r._id} value={r._id}>
                    Room {r.roomNumber} (Floor {r.floor})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Estimated Cost ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.estimatedCost}
                onChange={(e) =>
                  setForm({ ...form, estimatedCost: e.target.value })
                }
                className="input"
                placeholder="Optional"
              />
            </div>
          </div>
        </form>

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
            type="button"
            onClick={handleSubmit}
            className="btn-primary flex-1"
            disabled={createMutation.isPending}
          >
            <FiSave className="w-4 h-4" />
            {createMutation.isPending ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}
