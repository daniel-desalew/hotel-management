// frontend/src/components/staff/EditStaffModal.jsx
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiX, FiSave, FiTrash2 } from "react-icons/fi";
import api from "../../api/axios";

const DEPARTMENTS = [
  "front_desk",
  "housekeeping",
  "food_beverage",
  "maintenance",
  "security",
  "management",
  "other",
];

const SHIFTS = ["morning", "evening", "night", "rotational"];

export default function EditStaffModal({ staff, open, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    employeeId: "",
    designation: "",
    department: "front_desk",
    shift: "morning",
    salary: "",
    isActive: true,
  });

  useEffect(() => {
    if (staff && open) {
      setForm({
        employeeId: staff.employeeId || "",
        designation: staff.designation || "",
        department: staff.department || "front_desk",
        shift: staff.shift || "morning",
        salary: staff.salary || "",
        isActive: staff.isActive ?? true,
      });
    }
  }, [staff, open]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const updateMutation = useMutation({
    mutationFn: (data) => api.patch(`/staff/${staff._id}`, data),
    onSuccess: () => {
      toast.success("Staff updated");
      qc.invalidateQueries({ queryKey: ["staff"] });
      onClose();
    },
    onError: (err) => toast.error(err?.message || "Update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/staff/${staff._id}`),
    onSuccess: () => {
      toast.success("Staff removed");
      qc.invalidateQueries({ queryKey: ["staff"] });
      onClose();
    },
    onError: (err) => toast.error(err?.message || "Delete failed"),
  });

  if (!open || !staff) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      employeeId: form.employeeId,
      designation: form.designation,
      department: form.department,
      shift: form.shift,
      salary: form.salary ? Number(form.salary) : undefined,
      isActive: form.isActive,
    });
  };

  const handleDelete = () => {
    if (window.confirm("Remove this staff member? This cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Edit Staff</h2>
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
            <label className="label">Employee ID</label>
            <input
              type="text"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Designation</label>
            <input
              type="text"
              value={form.designation}
              onChange={(e) =>
                setForm({ ...form, designation: e.target.value })
              }
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Department</label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="input"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d} className="capitalize">
                  {d.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Shift</label>
            <select
              value={form.shift}
              onChange={(e) => setForm({ ...form, shift: e.target.value })}
              className="input"
            >
              {SHIFTS.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Salary (monthly)</label>
            <input
              type="number"
              min="0"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
              className="input"
              placeholder="Optional"
            />
          </div>

          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <span className="text-sm font-medium text-gray-700">Active</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                form.isActive ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  form.isActive ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </form>

        <div className="flex-shrink-0 flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleDelete}
            className="btn-secondary text-red-600 hover:bg-red-50 px-4"
            disabled={deleteMutation.isPending}
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={updateMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn-primary flex-1"
            disabled={updateMutation.isPending}
          >
            <FiSave className="w-4 h-4" />
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
