import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiX, FiSave } from 'react-icons/fi';
import { roomApi } from '../../api/roomApi';

const STATUSES = ['available', 'occupied', 'cleaning', 'maintenance', 'out_of_order', 'reserved'];
const HK_STATUSES = ['clean', 'dirty', 'inspected', 'in_progress'];

export default function EditRoomModal({ room, open, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    roomNumber: '',
    floor: 1,
    status: 'available',
    housekeepingStatus: 'clean',
    notes: '',
  });

  useEffect(() => {
    if (room && open) {
      setForm({
        roomNumber: room.roomNumber || '',
        floor: room.floor || 1,
        status: room.status || 'available',
        housekeepingStatus: room.housekeepingStatus || 'clean',
        notes: room.notes || '',
      });
    }
  }, [room, open]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const updateMutation = useMutation({
    mutationFn: (data) => roomApi.update(room._id, data),
    onSuccess: () => {
      toast.success('Room updated');
      qc.invalidateQueries({ queryKey: ['rooms'] });
      onClose();
    },
    onError: (err) => toast.error(err?.message || 'Update failed'),
  });

  if (!open || !room) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      roomNumber: form.roomNumber,
      floor: Number(form.floor),
      status: form.status,
      housekeepingStatus: form.housekeepingStatus,
      notes: form.notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Edit Room {room.roomNumber}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Room Number</label>
              <input type="text" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">Floor</label>
              <input type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} className="input" required />
            </div>
          </div>

          <div>
            <label className="label">Room Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input">
              {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Housekeeping Status</label>
            <select value={form.housekeepingStatus} onChange={(e) => setForm({ ...form, housekeepingStatus: e.target.value })} className="input">
              {HK_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input min-h-[80px] resize-y" placeholder="Any notes about this room..." />
          </div>
        </form>

        <div className="flex-shrink-0 flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={updateMutation.isPending}>Cancel</button>
          <button type="submit" onClick={handleSubmit} className="btn-primary flex-1" disabled={updateMutation.isPending}>
            <FiSave className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
