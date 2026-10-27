import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Modal from "../common/Modal";
import { guestApi } from "../../api/guestApi";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  nationality: "",
};

export default function AddGuestModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);

  const createMutation = useMutation({
    mutationFn: guestApi.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      toast.success(response?.message || "Guest added successfully");
      setForm(initialForm);
      onClose();
    },
    onError: (error) => toast.error(error?.message || "Could not add guest"),
  });

  const setField = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    createMutation.mutate({
      ...form,
      email: form.email.trim() || undefined,
      nationality: form.nationality.trim() || undefined,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Guest">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="label">
            First name *
            <input className="input mt-1" name="firstName" value={form.firstName} onChange={setField} required />
          </label>
          <label className="label">
            Last name *
            <input className="input mt-1" name="lastName" value={form.lastName} onChange={setField} required />
          </label>
        </div>
        <label className="label">
          Phone *
          <input className="input mt-1" name="phone" type="tel" value={form.phone} onChange={setField} required />
        </label>
        <label className="label">
          Email
          <input className="input mt-1" name="email" type="email" value={form.email} onChange={setField} />
        </label>
        <label className="label">
          Nationality
          <input className="input mt-1" name="nationality" value={form.nationality} onChange={setField} />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={createMutation.isPending}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Adding…" : "Add Guest"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
