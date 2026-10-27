import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Modal from "../common/Modal";
import { staffApi } from "../../api/staffApi";
import { hotelApi } from "../../api/hotelApi";
import useAuthStore from "../../store/authStore";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  role: "receptionist",
  hotelId: "",
  employeeId: "",
  designation: "",
  department: "front_desk",
  shift: "morning",
  joiningDate: new Date().toISOString().slice(0, 10),
  salary: "",
};

const departments = [
  "front_desk", "housekeeping", "food_beverage", "maintenance",
  "security", "management", "other",
];

export default function AddStaffModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [form, setForm] = useState(initialForm);
  const isSuperAdmin = currentUser?.role === "super_admin";

  const { data: hotelResponse } = useQuery({
    queryKey: ["hotels", "staff-create"],
    queryFn: () => hotelApi.getAll({ limit: 100 }),
    enabled: open && isSuperAdmin && !currentUser?.hotelId,
  });
  const hotels = hotelResponse?.data?.hotels || [];

  const createMutation = useMutation({
    mutationFn: staffApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member added");
      setForm(initialForm);
      onClose();
    },
    onError: (error) => toast.error(error?.message || "Could not add staff member"),
  });

  const setField = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    createMutation.mutate({
      ...form,
      salary: form.salary ? Number(form.salary) : undefined,
      hotelId: form.hotelId || undefined,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Staff Member" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="label">First name *<input className="input mt-1" name="firstName" value={form.firstName} onChange={setField} required /></label>
          <label className="label">Last name *<input className="input mt-1" name="lastName" value={form.lastName} onChange={setField} required /></label>
          <label className="label">Email *<input className="input mt-1" name="email" type="email" value={form.email} onChange={setField} required /></label>
          <label className="label">Phone *<input className="input mt-1" name="phone" type="tel" value={form.phone} onChange={setField} required /></label>
          <label className="label">Temporary password *<input className="input mt-1" name="password" type="password" minLength={8} value={form.password} onChange={setField} required /></label>
          <label className="label">Account role *
            <select className="input mt-1" name="role" value={form.role} onChange={setField}>
              <option value="receptionist">Receptionist</option>
              <option value="housekeeping">Housekeeping</option>
              <option value="manager">Manager</option>
            </select>
          </label>
          {isSuperAdmin && !currentUser?.hotelId && (
            <label className="label sm:col-span-2">Hotel *
              <select className="input mt-1" name="hotelId" value={form.hotelId} onChange={setField} required>
                <option value="">Select a hotel</option>
                {hotels.map((hotel) => <option key={hotel._id} value={hotel._id}>{hotel.name}</option>)}
              </select>
            </label>
          )}
          <label className="label">Employee ID *<input className="input mt-1" name="employeeId" value={form.employeeId} onChange={setField} required /></label>
          <label className="label">Job title *<input className="input mt-1" name="designation" value={form.designation} onChange={setField} required /></label>
          <label className="label">Department *
            <select className="input mt-1" name="department" value={form.department} onChange={setField}>
              {departments.map((department) => <option key={department} value={department}>{department.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <label className="label">Shift
            <select className="input mt-1" name="shift" value={form.shift} onChange={setField}>
              { ["morning", "evening", "night", "rotational"].map((shift) => <option key={shift} value={shift}>{shift}</option>) }
            </select>
          </label>
          <label className="label">Joining date *<input className="input mt-1" name="joiningDate" type="date" value={form.joiningDate} onChange={setField} required /></label>
          <label className="label">Monthly salary<input className="input mt-1" name="salary" type="number" min="0" value={form.salary} onChange={setField} /></label>
        </div>
        <p className="text-xs text-gray-500">The account email and temporary password let this staff member sign in.</p>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={createMutation.isPending}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Adding…" : "Add Staff"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
